"""
GWA (General Weighted Average) normalization utility.
Converts Philippine grading scales to 0-100 percentage for uniform comparison.
Does NOT define scoring math - only normalization.
"""

GWA_SCALE_5_0 = "5.0_scale"  # 1.00 highest, 3.00 passing (SUCs, UP, PUP)
GWA_SCALE_4_0 = "4.0_scale"  # 4.00 highest, 1.00 passing (DLSU, Ateneo, UST)
GWA_SCALE_PERCENTAGE = "percentage"  # 100 highest, 75 passing (K-12, many foundations)


def _parse_numeric(value: str | float | int) -> float | None:
    """Parse input to float, handling commas and whitespace."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).strip().replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def normalize_gwa(
    gwa_raw: str | float | int | None,
    scale: str | None = None,
) -> float | None:
    """
    Convert GWA to 0-100 normalized percentage.
    Returns None if input is invalid.

    Scale mapping:
    - 5.0_scale: 1.00 = 100%, 3.00 = 75%, 5.00 = 0%
    - 4.0_scale: 4.00 = 100%, 1.00 = 75%, 0.00 = 0%
    - percentage: pass-through (already 0-100)
    """
    val = _parse_numeric(gwa_raw)
    if val is None:
        return None

    scale_key = (scale or "").strip().lower()

    if scale_key in ("percentage", "percent", "pct", ""):
        # Assume already percentage
        return max(0.0, min(100.0, val))

    if scale_key in ("5.0_scale", "5.0", "1.0_scale"):
        # 1.00 = 100%, 3.00 = 75%, 5.00 = 0%
        # Linear: pct = 100 - (val - 1) * 50  for val in [1, 5]
        if val < 1.0:
            return 100.0
        if val > 5.0:
            return 0.0
        return 100.0 - (val - 1.0) * 25.0  # 1->100, 2->75, 3->50, 4->25, 5->0

    if scale_key in ("4.0_scale", "4.0"):
        # 4.00 = 100%, 1.00 = 75%, 0.00 = 0%
        if val >= 4.0:
            return 100.0
        if val <= 0.0:
            return 0.0
        return (val / 4.0) * 100.0

    # Default: treat as percentage
    return max(0.0, min(100.0, val))
