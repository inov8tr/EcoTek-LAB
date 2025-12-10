from __future__ import annotations


def estimate_softening_point(temp1: float, temp2: float, penetration_ratio: float) -> float:
    if penetration_ratio <= 0:
        raise ValueError("Penetration ratio must be positive")
    midpoint = (temp1 + temp2) / 2
    adjustment = 5 * (1 - penetration_ratio)
    return midpoint + adjustment
