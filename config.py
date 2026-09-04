"""
Canonical label vocabularies + cleaning maps + hyperparameters.

IMPORTANT: The canonicalization dicts below (*_CANON) were built by inspecting
the messy df[col].unique() output you pasted earlier. Several mappings are
judgment calls (e.g. mapping 'earthquake' -> 'other', or 'failed' -> 'absent'
for barrier_status). Re-run the audit snippet at the bottom of this file on
your real sample.csv and adjust these dicts before trusting the model's output.
"""

# ---------------------------------------------------------------------------
# Canonical label vocabularies (these size each head's output layer)
# ---------------------------------------------------------------------------

ENERGY_SOURCES = [
    "chemical", "electrical", "thermal", "gravity_fall", "motion_vehicle_traffic",
    "pressure_kinetic_release", "explosion", "mechanical_moving_equipment",
    "mechanical_rotating_equipment", "mechanical_caught_in_between",
    "mechanical_unstable_load", "mechanical_lifting_operations", "mechanical_ejected",
    "hydraulic", "flammable_material", "combustible_dust", "other",
]

ENERGY_LEVELS = ["low", "moderate", "high", "very_high"]

EXPOSURE_TYPES = ["no_proximity", "indirect", "proximity_line_of_fire", "direct_contact"]

BARRIER_STATUS = ["functioning", "partially_functioning", "degraded", "absent", "not_applicable"]

LIFE_SAVING_RULES = [
    "confined_space", "elevator", "energy_isolation", "hot_work", "lifting_operations",
    "line_of_fire", "lockout_tagout", "mobile_equipment_driving", "point_of_operation",
    "ppe", "shoring", "working_at_height", "aerial_lift", "none", "other",
]

RECORDED_SEVERITIES = [
    "fatality", "hospitalized_serious", "amputation", "fracture", "burn",
    "laceration", "concussion_head_injury", "sprain_strain", "chemical_exposure_illness",
    "respiratory_illness", "minor_injury", "no_injury", "near_miss",
    "property_damage_only", "other",
]

CONFIDENCE_VALUES = [0.70, 0.75, 0.80, 0.85, 0.90, 0.95, 0.98, 1.00]

# ---------------------------------------------------------------------------
# Canonicalization maps: raw value (as seen in your unique() dump) -> canonical value
# Anything not listed here is assumed to already be canonical (identity mapped
# at clean time). Values mapped to None are DROPPED (row excluded from training
# for that head only -- see dataset.py MASK handling).
# ---------------------------------------------------------------------------

ENERGY_SOURCE_CANON = {
    "combustible dust": "combustible_dust",
    "earthquake": "other",
    "wind": "other",
    "water": "other",
    "weather": "other",
    "animal": "other",
    "gas": "other",
    "hydrogen": "chemical",
    "ignition system": "other",
    "mechanical_falling": "gravity_fall",
    "explosive": "explosion",
    "explosive mixing": "explosion",
    "explosives": "explosion",
}

BARRIER_STATUS_CANON = {
    "none": "not_applicable",
    "failed": "absent",
}

LIFE_SAVING_RULE_CANON = {
    "aerial lift": "aerial_lift",
    "police_operations": "other",
    "fall_protection": "working_at_height",
    "rope": "other",
    "cover": "other",
    "lockout": "lockout_tagout",
    "entry permit": "confined_space",
    "crane": "lifting_operations",
    "hoisting_operations": "lifting_operations",
    # stringified multi-label lists -> take a representative single label.
    # NOTE: if these rows are common, life_saving_rule may genuinely be
    # multi-label and deserves a sigmoid/BCE head instead of softmax/CE.
    "['lockout_tagout', 'point_of_operation', 'ppe']": "lockout_tagout",
    "['point_of_operation', 'ppe']": "point_of_operation",
}

# recorded_severity had an inconsistent column name in your dump
# ('recorded severity' vs 'recorded_severity') -- handled in dataset.py by
# normalizing column names, not here.

# ---------------------------------------------------------------------------
# Hyperparameters
# ---------------------------------------------------------------------------

BACKBONE_NAME = "./backbone_bert"
MAX_LEN = 256
BATCH_SIZE = 8
EPOCHS = 8
LR = 1e-5
VAL_SPLIT = 0.15
TEST_SPLIT = 0.15
SEED = 42
DATA_PATH = "./data/sample.csv"
OUTPUT_DIR = "./checkpoints_encoder_tuned"

# Per-head loss weights (start uniform; raise/lower after watching per-head
# loss curves -- see the note on shared-backbone interference).
LOSS_WEIGHTS = {
    "energy_source": 1.0,
    "energy_level": 1.0,
    "exposure_type": 1.0,
    "barrier_status": 1.0,
    "life_saving_rule": 1.0,
    "recorded_severity": 1.0,
    "counterfactual_binary": 1.0,
    "confidence": 1.0,
    "span": 1.0,  # applied to (span_start + span_end) combined
}

# ---------------------------------------------------------------------------
# Generation (counterfactual_reasoning) -- a SEPARATE model from the BERT
# multi-head backbone above. Qwen2-0.5B-Instruct is already instruction-tuned
# (has a working chat template), which fits the control-prefix-prompted
# generation style directly. Gemma-3-270m (the base, non "-it" repo) has no
# chat template and is positioned by Google for narrow classification/
# extraction tasks rather than open-ended explanatory writing -- if you want
# to try it instead, use google/gemma-3-270m-it (the instruction-tuned repo)
# so you at least get a chat template to build prompts from.
# ---------------------------------------------------------------------------

GEN_MODEL_NAME = "Qwen/Qwen2-0.5B-Instruct"
GEN_MAX_PROMPT_LEN = 384
GEN_MAX_TARGET_LEN = 192
GEN_BATCH_SIZE = 1
GEN_GRADIENT_ACCUMULATION_STEPS = 8
GEN_EPOCHS = 5
GEN_LR = 1e-5
GEN_OUTPUT_DIR = "./checkpoints_gen_final_tuned"

if __name__ == "__main__":
    # Quick audit helper: run `python config.py` after pointing DATA_PATH
    # at your real CSV to see raw unique() values per column before trusting
    # the canonicalization maps above.
    import pandas as pd

    df = pd.read_csv(DATA_PATH)
    df.columns = [c.strip().replace(" ", "_") for c in df.columns]
    cols = ["energy_source", "energy_level", "exposure_type", "barrier_status",
            "life_saving_rule", "recorded_severity", "confidence"]
    for c in cols:
        if c in df.columns:
            print(f"--- {c} ---")
            print(df[c].value_counts(dropna=False))
            print()
        else:
            print(f"--- {c} NOT FOUND IN COLUMNS: {list(df.columns)} ---\n")
