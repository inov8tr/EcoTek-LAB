from __future__ import annotations

from typing import Iterable

import numpy as np


def compute_pg_grade(temps: Iterable[float], gstar_original: Iterable[float], gstar_rtfo: Iterable[float]) -> float:
    temps_arr = np.array(list(temps), dtype=float)
    orig = np.array(list(gstar_original), dtype=float)
    rtfo = np.array(list(gstar_rtfo), dtype=float)

    if not (len(temps_arr) and len(orig) and len(rtfo)):
        raise ValueError("Empty arrays provided")

    valid_mask = (orig > 1.0) & (rtfo > 2.2)
    if not np.any(valid_mask):
        return float(np.max(temps_arr))

    highest_valid_temp = temps_arr[valid_mask][-1]
    return float(highest_valid_temp)
