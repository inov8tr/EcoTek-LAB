from __future__ import annotations

try:
    import joblib
except ImportError:  # joblib included with scikit-learn, but guard anyhow
    joblib = None

MODEL_PATH = "ml/model.pkl"


def predict_storage_stability(g_star: float, phase_angle: float, density: float) -> float:
    if joblib and joblib.os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        return float(model.predict([[g_star, phase_angle, density]])[0])
    # Fallback heuristic
    return float((g_star / (phase_angle + 1)) * density / 1000)
