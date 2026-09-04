from copy import deepcopy

import pytest

from sif_nlp_precursor.schemas.nlp_result import NLPResult


# Sample NLP output
sample_result = {
    "case_id": "CASE-001",
    "narrative": "A worker nearly fell from an elevated platform.",
    "title": "Near fall from elevated platform",

    "energy_source": "gravity",
    "energy_level": "high",

    "exposure_type": "fall from height",
    "barrier_status": "guardrail missing",

    "life_saving_rule": "working at height",

    "counterfactual_could_be_fatal_or_permanent": True,

    "counterfactual_reasoning": (
        "A fall from the elevated platform could result "
        "in fatal or permanent injury."
    ),

    "evidence_phrase": "nearly fell from an elevated platform",

    "recorded_severity": {
        "EMP001": "near_miss"
    },

    "confidence": 0.94,

    "evidence_verified": True,

    "sps": 14,

    "sps_breakdown": {
        "energy_level_pts": 3,
        "exposure_pts": 4,
        "barrier_pts": 2,
        "counterfactual_pts": 5,
        "raw_total": 14,
        "max_possible": 20
    }
}


def test_valid_nlp_result():
    result = NLPResult.model_validate(sample_result)

    assert result.case_id == "CASE-001"
    assert result.energy_level == "high"
    assert result.confidence == 0.94
    assert result.sps == 14
    assert result.sps_breakdown.raw_total == 14
    assert result.sps_breakdown.max_possible == 20

def test_invalid_nlp_result():
    invalid_result = deepcopy(sample_result)

    # Invalid energy level
    invalid_result["energy_level"] = "extreme"

    with pytest.raises(ValueError):
        NLPResult.model_validate(invalid_result)

if __name__ == "__main__":
    test_valid_nlp_result()
    test_invalid_nlp_result()

