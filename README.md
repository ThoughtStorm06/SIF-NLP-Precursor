# SIF NLP Precursor

Backend and local inference runtime for the SIF incident analysis system.

## Backend

The application backend is under `backend/`. Install the project dependencies
with the repository's configured Python/Node tooling and use the backend's
existing server entry point.

## Local model runtime

The model branch includes the inference modules and Git LFS-managed weights:

- `inference_pipeline.py` - end-to-end structured prediction and reasoning.
- `backbone_bert/` - local BERT backbone and tokenizer.
- `checkpoints_encoder_tuned/` - tuned encoder checkpoint.
- `checkpoints_gen_final_tuned/` - tuned Qwen decoder checkpoint.

Run a local prediction with:

```bash
HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 \
python inference_pipeline.py \
  --narrative "A worker fell from a ladder and fractured a wrist."
```

Generated reasoning is structure-guided but not strictly factual; treat it as
human-reviewed decision support.

## Clone with model weights

```bash
git lfs install
git clone -b model https://github.com/ThoughtStorm06/SIF-NLP-Precursor.git
cd SIF-NLP-Precursor
git lfs pull
```
