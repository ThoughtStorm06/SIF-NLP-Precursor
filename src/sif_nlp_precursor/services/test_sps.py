from sif_nlp_precursor.schemas.nlp_result import SPSBreakdown
from sif_nlp_precursor.services.sps import calculate_normalized_sps


def test_sps_calculation():
    breakdown = SPSBreakdown(
        energy_level_pts=3,
        exposure_pts=4,
        barrier_pts=2,
        counterfactual_pts=5,
        raw_total=14,
        max_possible=20,
    )

    normalized_sps = calculate_normalized_sps(breakdown)

    print("SPS calculation successful!")
    print("Raw total:", breakdown.raw_total)
    print("Maximum possible:", breakdown.max_possible)
    print("Normalized SPS:", normalized_sps)


if __name__ == "__main__":
    test_sps_calculation()