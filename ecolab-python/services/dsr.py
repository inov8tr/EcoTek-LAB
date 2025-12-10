from __future__ import annotations

from typing import Iterable, List, Tuple

import numpy as np


def compute_dsr_curve(temps: Iterable[float], gstar: Iterable[float]) -> List[Tuple[float, float]]:
    temps_arr = np.array(list(temps), dtype=float)
    gstar_arr = np.array(list(gstar), dtype=float)
    if temps_arr.size != gstar_arr.size:
        raise ValueError("Temperature and G* arrays must align")
    order = np.argsort(temps_arr)
    sorted_temps = temps_arr[order]
    sorted_gstar = gstar_arr[order]
    smoothed = np.convolve(sorted_gstar, np.ones(3) / 3, mode="same")
    return list(zip(sorted_temps.tolist(), smoothed.tolist()))
