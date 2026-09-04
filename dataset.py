"""
Data cleaning + torch Dataset for the multi-head incident model.

Pipeline:
    raw CSV -> clean_dataframe() -> canonical labels + int-encoded targets
            -> IncidentDataset -> tokenized narrative + 10 target tensors per row
"""

import ast

import pandas as pd
import torch
from torch.utils.data import Dataset

import config as C


def _canon_map(values, extra_canon):
    """Build a lookup: any raw string -> canonical label (or None if unmappable)."""
    lookup = {v: v for v in values}          # canonical values map to themselves
    lookup.update(extra_canon)                # then apply overrides
    return lookup


SEVERITY_CANON = {
    "amputated": "amputation",
    "abrasion": "laceration",
    "bruise": "minor_injury",
    "bruises_contusion": "minor_injury",
    "contusion": "minor_injury",
}


def _parse_severities(value):
    """Parse scalar or employee-keyed severity values into unique labels."""
    if pd.isna(value):
        return None
    raw = str(value).strip()
    try:
        parsed = ast.literal_eval(raw)
    except (SyntaxError, ValueError):
        parsed = raw

    values = list(parsed.values()) if isinstance(parsed, dict) else parsed
    if isinstance(values, str):
        values = [values]
    if not isinstance(values, (list, tuple, set)):
        return None

    labels = set()
    for item in values:
        label = SEVERITY_CANON.get(str(item).strip(), str(item).strip())
        if label in C.RECORDED_SEVERITIES:
            labels.add(label)
    return [label for label in C.RECORDED_SEVERITIES if label in labels] or None


def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalizes column names, canonicalizes categorical columns, coerces types,
    and drops rows with values that still don't resolve to a known label
    (printing a warning with counts so you can see what's being dropped).
    """
    df = df.copy()
    df.columns = [c.strip().replace(" ", "_") for c in df.columns]

    col_specs = [
        ("energy_source", C.ENERGY_SOURCES, C.ENERGY_SOURCE_CANON),
        ("energy_level", C.ENERGY_LEVELS, {}),
        ("exposure_type", C.EXPOSURE_TYPES, {}),
        ("barrier_status", C.BARRIER_STATUS, C.BARRIER_STATUS_CANON),
        ("life_saving_rule", C.LIFE_SAVING_RULES, C.LIFE_SAVING_RULE_CANON),
    ]

    for col, canonical_values, extra_canon in col_specs:
        if col not in df.columns:
            raise KeyError(f"Expected column '{col}' not found. Columns present: {list(df.columns)}")
        lookup = _canon_map(canonical_values, extra_canon)
        raw = df[col].astype(str).str.strip()
        mapped = raw.map(lookup)

        unmapped_mask = mapped.isna()
        if unmapped_mask.any():
            print(f"[clean_dataframe] '{col}': dropping {unmapped_mask.sum()} rows with "
                  f"unrecognized values: {sorted(raw[unmapped_mask].unique().tolist())}")
        df[col] = mapped
        df = df[~unmapped_mask]

    raw_severity = df["recorded_severity"].copy()
    parsed_severity = raw_severity.apply(_parse_severities)
    unmapped_mask = parsed_severity.isna()
    if unmapped_mask.any():
        print(f"[clean_dataframe] 'recorded_severity': dropping {unmapped_mask.sum()} rows with "
              f"unrecognized values: {sorted(raw_severity[unmapped_mask].astype(str).unique().tolist())}")
    df["recorded_severity"] = parsed_severity
    df = df[~unmapped_mask]

    # Keep confidence continuous; only reject missing or out-of-range values.
    def parse_confidence(x):
        try:
            value = float(x)
        except (TypeError, ValueError):
            return None
        return value if 0.0 <= value <= 1.0 else None

    df["confidence"] = df["confidence"].apply(parse_confidence)
    df = df[df["confidence"].notna()]

    # counterfactual binary column -> bool -> int (this one IS a trained head)
    df["counterfactual_could_be_fatal_or_permanent"] = (
        df["counterfactual_could_be_fatal_or_permanent"].astype(str).str.lower()
        .map({"true": 1, "false": 0, "1": 1, "0": 0})
    )
    df = df[df["counterfactual_could_be_fatal_or_permanent"].notna()]

    # evidence_verified is NOT a trained head -- see postprocessing.py. It's used
    # here only as a data-quality filter: if the augmentation pipeline's own
    # evidence_phrase wasn't actually found in the narrative, that phrase is
    # unreliable, so we clear it (the span head then treats it as "no phrase",
    # via IncidentDataset._find_span's empty-string branch) rather than training
    # the span head to point at a hallucinated quote.
    if "evidence_verified" in df.columns:
        verified = df["evidence_verified"].astype(str).str.lower().map(
            {"true": 1, "false": 0, "1": 1, "0": 0}
        )
        df.loc[verified != 1, "evidence_phrase"] = ""

    # narrative / evidence_phrase must be non-null strings
    df = df[df["narrative"].notna()]
    df["evidence_phrase"] = df["evidence_phrase"].fillna("")

    return df.reset_index(drop=True)


def _label_maps(values):
    l2i = {v: i for i, v in enumerate(values)}
    i2l = {i: v for i, v in enumerate(values)}
    return l2i, i2l


ENERGY_SOURCE_L2I, ENERGY_SOURCE_I2L = _label_maps(C.ENERGY_SOURCES)
ENERGY_LEVEL_L2I, ENERGY_LEVEL_I2L = _label_maps(C.ENERGY_LEVELS)
EXPOSURE_TYPE_L2I, EXPOSURE_TYPE_I2L = _label_maps(C.EXPOSURE_TYPES)
BARRIER_STATUS_L2I, BARRIER_STATUS_I2L = _label_maps(C.BARRIER_STATUS)
LSR_L2I, LSR_I2L = _label_maps(C.LIFE_SAVING_RULES)
SEVERITY_L2I, SEVERITY_I2L = _label_maps(C.RECORDED_SEVERITIES)


class IncidentDataset(Dataset):
    def __init__(self, df: pd.DataFrame, tokenizer, max_len: int = C.MAX_LEN):
        self.df = df.reset_index(drop=True)
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.df)

    def _find_span(self, narrative: str, phrase: str, offsets: torch.Tensor):
        """Maps a literal substring `phrase` inside `narrative` to token indices
        using the tokenizer's offset mapping. Returns (start_tok, end_tok) both 0
        (pointing at [CLS]) if the phrase is empty or not found verbatim -- these
        rows should be excluded from the span loss via span_mask."""
        if not phrase:
            return 0, 0, 0  # start, end, mask (0 = exclude from loss)
        char_start = narrative.find(phrase)
        if char_start == -1:
            return 0, 0, 0
        char_end = char_start + len(phrase)
        start_tok, end_tok = 0, 0
        found_start, found_end = False, False
        for i, (s, e) in enumerate(offsets.tolist()):
            if s == e == 0 and i != 0:
                continue  # special token padding
            if s <= char_start < e:
                start_tok, found_start = i, True
            if s < char_end <= e:
                end_tok, found_end = i, True
        if not (found_start and found_end):
            return 0, 0, 0
        return start_tok, end_tok, 1

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        narrative = str(row["narrative"])

        enc = self.tokenizer(
            narrative,
            truncation=True,
            max_length=self.max_len,
            padding="max_length",
            return_offsets_mapping=True,
            return_tensors="pt",
        )

        start_tok, end_tok, span_mask = self._find_span(
            narrative, str(row["evidence_phrase"]), enc["offset_mapping"][0]
        )

        return {
            "input_ids": enc["input_ids"].squeeze(0),
            "attention_mask": enc["attention_mask"].squeeze(0),
            "energy_source": torch.tensor(ENERGY_SOURCE_L2I[row["energy_source"]], dtype=torch.long),
            "energy_level": torch.tensor(ENERGY_LEVEL_L2I[row["energy_level"]], dtype=torch.long),
            "exposure_type": torch.tensor(EXPOSURE_TYPE_L2I[row["exposure_type"]], dtype=torch.long),
            "barrier_status": torch.tensor(BARRIER_STATUS_L2I[row["barrier_status"]], dtype=torch.long),
            "life_saving_rule": torch.tensor(LSR_L2I[row["life_saving_rule"]], dtype=torch.long),
            "recorded_severity": torch.tensor(
                [float(label in row["recorded_severity"]) for label in C.RECORDED_SEVERITIES],
                dtype=torch.float,
            ),
            "counterfactual_binary": torch.tensor(int(row["counterfactual_could_be_fatal_or_permanent"]), dtype=torch.long),
            "confidence": torch.tensor(float(row["confidence"]), dtype=torch.float),
            "span_start": torch.tensor(start_tok, dtype=torch.long),
            "span_end": torch.tensor(end_tok, dtype=torch.long),
            "span_mask": torch.tensor(span_mask, dtype=torch.float),
        }
