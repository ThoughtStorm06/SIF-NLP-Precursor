from sif_nlp_precursor.schemas.nlp_result import SPSBreakdown


def calculate_normalized_sps(breakdown: SPSBreakdown) -> float:
    """
    Calculate normalized SPS from the NLP SPS breakdown.

    Formula:
        normalized_sps = raw_total / max_possible

    Returns:
        A value between 0 and 1.
    """

    try:
        if breakdown.max_possible <= 0:
            raise ValueError(
                "max_possible must be greater than zero."
            )

        if breakdown.raw_total < 0:
            raise ValueError(
                "raw_total cannot be negative."
            )

        if breakdown.raw_total > breakdown.max_possible:
            raise ValueError(
                "raw_total cannot be greater than max_possible."
            )

        normalized_sps = (
            breakdown.raw_total / breakdown.max_possible
        )

        return normalized_sps

    except ValueError:
        # Expected validation/calculation errors
        raise

    except Exception as e:
        # Unexpected runtime errors
        raise RuntimeError(
            f"Unexpected SPS calculation error: {e}"
        ) from e
    