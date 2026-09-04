"""
Dataset for the generation decoder (counterfactual_reasoning).

This is a SEPARATE model/tokenizer from the BERT multi-head backbone --
Qwen2-0.5B-Instruct is decoder-only, so it gets its own fine-tuning pass.

During TRAINING, the control prefix is built from the row's GROUND-TRUTH
structured fields (teacher forcing -- the decoder should learn to write
grounded explanations of a known-correct assessment). At INFERENCE, the same
prefix format is built from the BERT model's PREDICTED fields instead -- see
inference_pipeline.py's build_control_prefix(), which both this file and that
one call, so the format never drifts between train and inference.
"""

import pandas as pd
import torch
from torch.utils.data import Dataset

import config as C


def build_control_prefix(energy_source, energy_level, exposure_type, barrier_status,
                          life_saving_rule, recorded_severity,
                          counterfactual_could_be_fatal, evidence_phrase,
                          confidence):
    """Shared prompt-building logic -- used by both training (ground-truth
    fields) and inference (predicted fields), so the two never diverge."""
    fatal_str = "yes" if counterfactual_could_be_fatal else "no"
    phrase_str = evidence_phrase if evidence_phrase else "(none extracted)"
    return (
        f"Narrative: {{narrative}}\n\n"
        f"Structured assessment:\n"
        f"- energy_source: {energy_source}\n"
        f"- energy_level: {energy_level}\n"
        f"- exposure_type: {exposure_type}\n"
        f"- barrier_status: {barrier_status}\n"
        f"- life_saving_rule: {life_saving_rule}\n"
        f"- recorded_severity: {recorded_severity}\n"
        f"- confidence: {float(confidence):.4f}\n"
        f"- counterfactual_could_be_fatal_or_permanent: {fatal_str}\n"
        f"- evidence_phrase: \"{phrase_str}\"\n\n"
        f"Given this narrative and structured assessment, explain the "
        f"counterfactual reasoning: why a small change in circumstances could "
        f"(or could not) have made this fatal or permanently disabling."
    )


SYSTEM_PROMPT = (
    "You are a workplace safety analyst. You explain counterfactual "
    "reasoning about incident severity strictly grounded in the structured "
    "assessment you are given -- do not contradict or ignore it. Return "
    "exactly one concise paragraph beginning with 'Counterfactual:'; use "
    "only facts stated in the narrative or structured assessment, and do "
    "not invent distances, speeds, treatments, or injuries."
)


class GenerationDataset(Dataset):
    def __init__(self, df: pd.DataFrame, tokenizer,
                 max_prompt_len: int = C.GEN_MAX_PROMPT_LEN,
                 max_target_len: int = C.GEN_MAX_TARGET_LEN):
        self.df = df.reset_index(drop=True)
        self.tokenizer = tokenizer
        self.max_prompt_len = max_prompt_len
        self.max_target_len = max_target_len

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]

        user_content = build_control_prefix(
            energy_source=row["energy_source"],
            energy_level=row["energy_level"],
            exposure_type=row["exposure_type"],
            barrier_status=row["barrier_status"],
            life_saving_rule=row["life_saving_rule"],
            recorded_severity=row["recorded_severity"],
            counterfactual_could_be_fatal=bool(row["counterfactual_could_be_fatal_or_permanent"]),
            evidence_phrase=str(row["evidence_phrase"]),
            confidence=row["confidence"],
        ).format(narrative=str(row["narrative"]))

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ]

        prompt_ids = self.tokenizer.apply_chat_template(
            messages, tokenize=True, add_generation_prompt=True,
        )
        if not isinstance(prompt_ids, list):
            prompt_ids = prompt_ids["input_ids"]
        if hasattr(prompt_ids, "tolist"):
            prompt_ids = prompt_ids.tolist()
        if prompt_ids and isinstance(prompt_ids[0], list):
            prompt_ids = prompt_ids[0]
        if len(prompt_ids) > self.max_prompt_len:
            prompt_ids = prompt_ids[-self.max_prompt_len:]  # keep the end (closest to generation point)

        target_text = "Counterfactual: " + str(row["counterfactual_reasoning"]).strip()
        target_ids = self.tokenizer(
            target_text, add_special_tokens=False,
        )["input_ids"]
        target_ids = target_ids[: self.max_target_len - 1]
        target_ids = target_ids + [self.tokenizer.eos_token_id]

        input_ids = prompt_ids + target_ids
        labels = [-100] * len(prompt_ids) + target_ids  # only supervise the answer, not the prompt

        pad_len = (self.max_prompt_len + self.max_target_len) - len(input_ids)
        attention_mask = [1] * len(input_ids)
        if pad_len > 0:
            pad_id = self.tokenizer.pad_token_id or self.tokenizer.eos_token_id
            input_ids = input_ids + [pad_id] * pad_len
            labels = labels + [-100] * pad_len
            attention_mask = attention_mask + [0] * pad_len
        else:
            input_ids = input_ids[: self.max_prompt_len + self.max_target_len]
            labels = labels[: self.max_prompt_len + self.max_target_len]
            attention_mask = attention_mask[: self.max_prompt_len + self.max_target_len]

        return {
            "input_ids": torch.tensor(input_ids, dtype=torch.long),
            "attention_mask": torch.tensor(attention_mask, dtype=torch.long),
            "labels": torch.tensor(labels, dtype=torch.long),
        }
