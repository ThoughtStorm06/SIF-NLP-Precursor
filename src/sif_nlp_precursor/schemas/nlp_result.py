from pydantic import BaseModel, Field
from typing import Dict


class SPSBreakdown(BaseModel):
    energy_level_pts: float
    exposure_pts: float
    barrier_pts: float
    counterfactual_pts: float
    raw_total: float
    max_possible: float
from typing import Literal


class NLPResult(BaseModel):
    case_id: str
    narrative: str
    title: str

    energy_source: str

    energy_level: Literal[
        "moderate",
        "high",
        "very_high",
    ]

    exposure_type: str
    barrier_status: str
    life_saving_rule: str

    counterfactual_could_be_fatal_or_permanent: bool

    counterfactual_reasoning: str
    evidence_phrase: str

    recorded_severity: Dict[str, str]

    confidence: float = Field(
        ge=0.0,
        le=1.0,
    )

    evidence_verified: bool

    sps: float

    sps_breakdown: SPSBreakdown