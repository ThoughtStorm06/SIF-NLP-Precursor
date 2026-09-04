"""
End-to-end inference: narrative in -> all 16 columns out.

Loads BOTH trained checkpoints (BERT multi-head classifier + fine-tuned Qwen
generator) and chains them:

    narrative
        -> BERT model -> 6 classification labels, 2 binary/bucket labels,
                          evidence_phrase span
        -> postprocessing.py -> evidence_verified, sps, sps_breakdown
        -> gen_dataset.build_control_prefix() (same format used in training,
           but filled with PREDICTED fields instead of ground truth)
        -> Qwen generator -> counterfactual_reasoning

Usage:
    python inference_pipeline.py --narrative "A worker was tightening a valve..."
"""

import argparse
import json

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

import config as C
import postprocessing as P
from dataset import (
    ENERGY_SOURCE_I2L, ENERGY_LEVEL_I2L, EXPOSURE_TYPE_I2L, BARRIER_STATUS_I2L,
    LSR_I2L, SEVERITY_I2L,
)
from gen_dataset import build_control_prefix, SYSTEM_PROMPT
from model import MultiTaskIncidentModel


def load_bert_model(checkpoint_path, device):
    ckpt = torch.load(checkpoint_path, map_location=device)
    backbone_path = C.BACKBONE_NAME
    model = MultiTaskIncidentModel(backbone_path).to(device)
    model.load_state_dict(ckpt["model_state_dict"])
    model.eval()
    tokenizer = AutoTokenizer.from_pretrained(backbone_path, local_files_only=True)
    return model, tokenizer


def predict_structured_fields(narrative, bert_model, bert_tokenizer, device, max_len=C.MAX_LEN):
    enc = bert_tokenizer(
        narrative, truncation=True, max_length=max_len, padding="max_length",
        return_offsets_mapping=True, return_tensors="pt",
    )
    offsets = enc.pop("offset_mapping")[0]
    enc = {k: v.to(device) for k, v in enc.items()}

    with torch.no_grad():
        preds = bert_model(enc["input_ids"], enc["attention_mask"])

    def top(head, i2l):
        idx = preds[head].argmax(dim=-1).item()
        return i2l[idx]

    energy_source = top("energy_source", ENERGY_SOURCE_I2L)
    energy_level = top("energy_level", ENERGY_LEVEL_I2L)
    exposure_type = top("exposure_type", EXPOSURE_TYPE_I2L)
    barrier_status = top("barrier_status", BARRIER_STATUS_I2L)
    life_saving_rule = top("life_saving_rule", LSR_I2L)
    severity_probs = torch.sigmoid(preds["recorded_severity"])[0]
    severity_ids = (severity_probs >= 0.5).nonzero(as_tuple=False).flatten().tolist()
    if not severity_ids:
        severity_ids = [severity_probs.argmax().item()]
    recorded_severity = [SEVERITY_I2L[idx] for idx in severity_ids]
    counterfactual_could_be_fatal = bool(preds["counterfactual_binary"].argmax(dim=-1).item())
    confidence = torch.sigmoid(preds["confidence"]).clamp(0.0, 1.0).item()

    # span: constrain end >= start by masking invalid combinations, then argmax
    start_logits = preds["span_start"][0]
    end_logits = preds["span_end"][0]
    seq_len = start_logits.size(0)
    best_score, best_start, best_end = float("-inf"), 0, 0
    start_top = torch.topk(start_logits, k=min(20, seq_len)).indices.tolist()
    end_top = torch.topk(end_logits, k=min(20, seq_len)).indices.tolist()
    for s in start_top:
        for e in end_top:
            if e >= s and (e - s) < 60:  # cap span length to something plausible
                score = start_logits[s].item() + end_logits[e].item()
                if score > best_score:
                    best_score, best_start, best_end = score, s, e

    if best_start == 0 and best_end == 0:
        evidence_phrase = ""
    else:
        char_start = offsets[best_start][0].item()
        char_end = offsets[best_end][1].item()
        evidence_phrase = narrative[char_start:char_end] if char_end > char_start else ""

    evidence_verified = P.evidence_verified_from_span(best_start, best_end)
    sps, sps_breakdown = P.compute_sps(
        energy_level=energy_level, exposure_type=exposure_type,
        barrier_status=barrier_status,
        counterfactual_could_be_fatal=counterfactual_could_be_fatal,
    )

    return {
        "energy_source": energy_source,
        "energy_level": energy_level,
        "exposure_type": exposure_type,
        "barrier_status": barrier_status,
        "life_saving_rule": life_saving_rule,
        "recorded_severity": recorded_severity,
        "counterfactual_could_be_fatal_or_permanent": counterfactual_could_be_fatal,
        "confidence": confidence,
        "evidence_phrase": evidence_phrase,
        "evidence_verified": evidence_verified,
        "sps": sps,
        "sps_breakdown": sps_breakdown,
    }


def generate_counterfactual_reasoning(narrative, fields, gen_model, gen_tokenizer, device,
                                       max_new_tokens=200):
    user_content = build_control_prefix(
        energy_source=fields["energy_source"],
        energy_level=fields["energy_level"],
        exposure_type=fields["exposure_type"],
        barrier_status=fields["barrier_status"],
        life_saving_rule=fields["life_saving_rule"],
        recorded_severity=fields["recorded_severity"],
        counterfactual_could_be_fatal=fields["counterfactual_could_be_fatal_or_permanent"],
        evidence_phrase=fields["evidence_phrase"],
        confidence=fields["confidence"],
    ).format(narrative=narrative)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]
    encoded_prompt = gen_tokenizer.apply_chat_template(
        messages, tokenize=True, add_generation_prompt=True, return_tensors="pt",
    )
    input_ids = encoded_prompt["input_ids"].to(device)

    with torch.no_grad():
        out = gen_model.generate(
            input_ids, max_new_tokens=max_new_tokens, do_sample=False,
            pad_token_id=gen_tokenizer.pad_token_id or gen_tokenizer.eos_token_id,
        )
    generated = out[0][input_ids.shape[1]:]
    return gen_tokenizer.decode(generated, skip_special_tokens=True).strip()


def predict_full_record(narrative, bert_model, bert_tokenizer, gen_model, gen_tokenizer, device):
    fields = predict_structured_fields(narrative, bert_model, bert_tokenizer, device)
    reasoning = generate_counterfactual_reasoning(narrative, fields, gen_model, gen_tokenizer, device)
    fields["counterfactual_reasoning"] = reasoning
    fields["narrative"] = narrative
    return fields


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--narrative", type=str, required=True)
    parser.add_argument("--bert_checkpoint", type=str, default=f"{C.OUTPUT_DIR}/best_model.pt")
    parser.add_argument("--gen_checkpoint", type=str, default=f"{C.GEN_OUTPUT_DIR}/best_gen_model")
    parser.add_argument("--output_json", type=str, default="", help="Optional path to save the prediction JSON.")
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    bert_model, bert_tokenizer = load_bert_model(args.bert_checkpoint, device)
    gen_tokenizer = AutoTokenizer.from_pretrained(
        args.gen_checkpoint, local_files_only=True
    )
    gen_model = AutoModelForCausalLM.from_pretrained(
        args.gen_checkpoint, local_files_only=True
    ).to(device)
    gen_model.eval()

    record = predict_full_record(args.narrative, bert_model, bert_tokenizer, gen_model, gen_tokenizer, device)
    if args.output_json:
        with open(args.output_json, "w", encoding="utf-8") as output_file:
            json.dump(record, output_file, indent=2)
        print(f"Saved model output to {args.output_json}")
    for k, v in record.items():
        print(f"{k}: {v}")


if __name__ == "__main__":
    main()
