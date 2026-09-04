"""
Fields computed AFTER the model(s) run, not predicted by any head.

evidence_verified:
    True iff the span head pointed at a real (non-empty) span. Once
    evidence_phrase is produced by predicting start/end token indices INTO the
    narrative's own tokens (see dataset.py's span head), the extracted text is
    guaranteed to be a literal substring of the narrative -- there's no way for
    the model to "verify" a phrase it can only ever pull from the source text.
    So this is never a learned head; it's read off the span head's own output.

sps / sps_breakdown:
    Pure arithmetic on the OTHER heads' predicted labels. The point values and
    MAX_RAW_SCORE below are reconstructed from the rubric snippet you shared
    earlier ({_ENERGY_LEVEL_PTS, _EXPOSURE_PTS, _BARRIER_PTS, _COUNTERFACTUAL_PTS,
    _MAX_RAW_SCORE=16}). VERIFY these against the actual formula in the
    augmentation repo before trusting this in production -- I'm inferring the
    combination rule from a comment, not the real source.
    The column descriptor confirms sps is normalized 0-100 (not 0-1).
"""

ENERGY_LEVEL_PTS = {"low": 0, "moderate": 2, "high": 4, "very_high": 6}
EXPOSURE_PTS = {"no_proximity": 0, "indirect": 1, "proximity_line_of_fire": 2, "direct_contact": 3}
BARRIER_PTS = {"functioning": 0, "partially_functioning": 0, "not_applicable": 0, "degraded": 1.5, "absent": 3}
COUNTERFACTUAL_PTS = 4
MAX_RAW_SCORE = (
    max(ENERGY_LEVEL_PTS.values()) + max(EXPOSURE_PTS.values())
    + max(BARRIER_PTS.values()) + COUNTERFACTUAL_PTS
)  # 6 + 3 + 3 + 4 = 16


def evidence_verified_from_span(span_start: int, span_end: int) -> bool:
    """span_start == span_end == 0 is dataset.py's/model's sentinel for
    "no phrase found / no phrase present" (points at [CLS]). Anything else is
    a real span the span head extracted from the narrative's own tokens."""
    return not (span_start == 0 and span_end == 0)


def compute_sps(energy_level: str, exposure_type: str, barrier_status: str,
                 counterfactual_could_be_fatal: bool):
    """Returns (sps_0_to_100, breakdown_dict). No model involved -- just sums
    points from the OTHER heads' predicted (or ground-truth) labels."""
    breakdown = {
        "energy_level_pts": ENERGY_LEVEL_PTS.get(energy_level, 0),
        "exposure_type_pts": EXPOSURE_PTS.get(exposure_type, 0),
        "barrier_status_pts": BARRIER_PTS.get(barrier_status, 0),
        "counterfactual_pts": COUNTERFACTUAL_PTS if counterfactual_could_be_fatal else 0,
    }
    raw = sum(breakdown.values())
    sps = round(raw / MAX_RAW_SCORE * 100, 2)
    breakdown["raw_score"] = raw
    breakdown["max_raw_score"] = MAX_RAW_SCORE
    breakdown["sps"] = sps
    return sps, breakdown
