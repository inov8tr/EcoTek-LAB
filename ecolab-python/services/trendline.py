from __future__ import annotations

from typing import Iterable, Tuple

import numpy as np


def compute_trendline(x: Iterable[float], y: Iterable[float]) -> Tuple[float, float, float]:
    x_arr = np.array(list(x), dtype=float)
    y_arr = np.array(list(y), dtype=float)
    if x_arr.size != y_arr.size:
        raise ValueError("x and y arrays must have identical length")
    slope, intercept = np.polyfit(x_arr, y_arr, 1)
    residuals = y_arr - (slope * x_arr + intercept)
    ss_res = np.sum(residuals ** 2)
    ss_tot = np.sum((y_arr - np.mean(y_arr)) ** 2)
    r_squared = 1 - ss_res / ss_tot if ss_tot != 0 else 0.0
    return float(slope), float(intercept), float(r_squared)
