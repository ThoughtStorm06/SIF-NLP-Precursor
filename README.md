# SIF Incident Inference Runtime

**Two separate trained models**, chained together at inference:

1. **BERT multi-head classifier** — shared backbone + 8 independent trained
   heads (6 classification, 1 binary, 1 confidence-bucket) + 1 extractive span
   head for `evidence_phrase`.
2. **Qwen2-0.5B-Instruct generation decoder** — fine-tuned separately to write
   `counterfactual_reasoning`, conditioned on the narrative + the *other*
   model's predicted structured fields as a control prefix.

Two fields are **never trained at all** — they're pure post-processing on the
other heads' outputs (see `postprocessing.py`):
- `evidence_verified` — guaranteed true whenever the span head found a real
  span, since it can only ever point at tokens that exist in the narrative.
- `sps` / `sps_breakdown` — arithmetic on the classification heads' predicted
  labels. The rubric in `postprocessing.py` is reconstructed from a snippet
  you shared, not the real augmentation-repo formula — verify it.

## Runtime Files
- `config.py` — label vocabularies, canonicalization maps, hyperparameters for
  both models. **Run `python config.py` first** (after setting `DATA_PATH`) to
  print real `value_counts()` per categorical column and sanity-check the
  canonicalization maps before training.
- `dataset.py` — `clean_dataframe()` (canonicalizes labels; also nulls out any
  `evidence_phrase` whose `evidence_verified` wasn't true, so the span head
  never trains on a hallucinated quote) and `IncidentDataset` (tokenizes,
  aligns `evidence_phrase` to token spans).
- `model.py` — `MultiTaskIncidentModel`: shared BERT backbone, independent
  `nn.Linear` heads reading the full pooled `[CLS]` vector (classification/
  binary/confidence) or full token sequence (span).
- `checkpoints_encoder_tuned/` — tuned BERT classifier and evidence-span model.
- `postprocessing.py` — `evidence_verified_from_span()` and `compute_sps()`.
  No model involved in either.
- `gen_dataset.py` — `build_control_prefix()` (the prompt-building logic
  shared between training and inference, so the format never drifts) +
  `GenerationDataset` for fine-tuning Qwen.
- `checkpoints_gen_final_tuned/` — tuned Qwen counterfactual reasoning model.
- `inference_pipeline.py` — the actual end-to-end path: narrative in, all 16
  columns out. Runs the BERT model, computes the two post-processed fields,
  builds the control prefix from the BERT model's *predictions* (not ground
  truth — ground truth won't exist at real inference time), and generates
  `counterfactual_reasoning` with the fine-tuned Qwen model.

## Run

```bash
pip install -r requirements.txt

# Run the full pipeline on a new narrative
python inference_pipeline.py --narrative "A worker was tightening a valve when..."
```

The output includes structured hazard fields, evidence, SPS values, and
`counterfactual_reasoning`. Generated reasoning is structure-guided but not
strictly factual, so treat it as human-reviewed decision support.

## Before you trust this on your real data, check:

1. **`clean_dataframe()` drop warnings.** On first run it will print every
   raw value it couldn't map to a canonical label per column, and how many
   rows got dropped. If that number is large, the canonicalization maps in
   `config.py` need more entries — don't silently lose data.
2. **`life_saving_rule` multi-label question.** The stringified-list entries
   (`"['lockout_tagout', 'point_of_operation', 'ppe']"`) currently get
   collapsed to a single representative label. If this pattern is common in
   the real data, this column is genuinely multi-label and the head should
   be `nn.Linear(h, N)` + `BCEWithLogitsLoss` + sigmoid/threshold instead of
   the current `CrossEntropyLoss`/softmax — ping me and I'll swap it.
3. **`evidence_phrase` not-found rate.** `dataset.py`'s `_find_span` silently
   masks out rows (`span_mask=0`) where the phrase isn't a verbatim substring
   of the narrative. `clean_dataframe()` also clears `evidence_phrase` for any
   row where the raw `evidence_verified` column says the phrase wasn't
   actually found — check what fraction of rows that affects; a high rate
   there is itself informative about the augmentation pipeline's quality.
4. **Confidence snapping.** Raw confidence values are snapped to the nearest
   of the 8 canonical buckets (`config.CONFIDENCE_VALUES`). If your real data
   has confidence values far from these 8 anchors, reconsider whether this
   should be regression instead of 8-way classification.
5. **Loss weights.** All heads start at weight 1.0 in `config.LOSS_WEIGHTS`.
   Watch the per-head loss printout during training — if one head's loss
   stays much higher/noisier than the others and seems to be dragging down
   the shared backbone, lower its weight.
6. **`postprocessing.py`'s SPS rubric.** The point values and combination
   rule are reconstructed from a code comment, not the real formula — pull
   the actual formula from the augmentation repo and update `ENERGY_LEVEL_PTS`
   / `EXPOSURE_PTS` / `BARRIER_PTS` / `COUNTERFACTUAL_PTS` / `MAX_RAW_SCORE`
   accordingly before trusting `sps` output.
7. **Qwen2-0.5B-Instruct license/gating.** Unlike `google/gemma-3-270m`
   (which is gated behind Google's license on Hugging Face), Qwen2-0.5B-Instruct
   is openly downloadable — no login/license step needed to run `gen_train.py`.
8. **Generation quality is only loss-tracked, not human-eval'd.**
   `gen_train.py` saves the checkpoint with the lowest validation loss, which
   is a proxy for fluency/likelihood, not for whether the reasoning is
   actually sound. Spot-check `inference_pipeline.py` output on held-out
   narratives before using generated `counterfactual_reasoning` for anything
   downstream (e.g. feeding synthetic rows back into classifier training).
