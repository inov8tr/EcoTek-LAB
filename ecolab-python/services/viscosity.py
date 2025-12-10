from __future__ import annotations

import math


ACTIVATION_ENERGY = 55000  # J/mol placeholder
GAS_CONSTANT = 8.314


def estimate_viscosity(temp_c: float, shear_rate: float) -> float:
    temp_k = temp_c + 273.15
    base = math.exp(ACTIVATION_ENERGY / (GAS_CONSTANT * temp_k))
    shear_factor = math.log1p(shear_rate)
    return float(base / shear_factor)
