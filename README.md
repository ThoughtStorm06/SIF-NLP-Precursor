# SIF NLP Precursor

Backend and local inference runtime for the SIF incident analysis system.

## Backend

The application backend is under `backend/`. Install the project dependencies
with the repository's configured Python/Node tooling and use the backend's
existing server entry point.

The frontend uses the Node API at `http://localhost:5000`, and the Node API
proxies `/api/v1/*` requests to the Python service at `http://localhost:8000`.
Start all three services with:

```bash
npm run dev:all
```

The Python service initializes its local SQLite tables in `data/sif.db` on
startup. To regenerate the Node seed fixture from five rows in the downloaded
dataset, run:

```bash
npm run seed:sample

# Populate the Python SQLite store from the generated seed records
npm run seed:sqlite
```

The Python SQLite sample database has been populated with the first five rows
from `data/sample.csv`, including their structured prediction fields and SPS
breakdowns.

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

The model command requires the Python environment to provide `torch`,
`transformers`, `pandas`, and the local checkpoint files. The API and database
smoke checks can run without loading neural weights, but actual inference
cannot run until those model dependencies are installed.

Generated reasoning is structure-guided but not strictly factual; treat it as
human-reviewed decision support.

## Clone with model weights

```bash
git lfs install
git clone -b model https://github.com/ThoughtStorm06/SIF-NLP-Precursor.git
cd SIF-NLP-Precursor
git lfs pull
```
