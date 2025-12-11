import json


def handler(request):
    data = request.json()
    capsule_pct = data.get("capsule_pct")
    reagent_pct = data.get("reagent_pct")

    result = {
        "capsule_pct": capsule_pct,
        "reagent_pct": reagent_pct,
        "stability_score": 0.95,
        "message": "Placeholder storage stability model.",
    }
    return json.dumps(result)
