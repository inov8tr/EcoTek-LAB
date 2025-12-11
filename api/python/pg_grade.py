import json


def handler(request):
    data = request.json()
    g_original = data.get("g_original")
    delta_original = data.get("delta_original")
    g_rtfo = data.get("g_rtfo")
    delta_rtfo = data.get("delta_rtfo")

    # Placeholder logic — replace with real spec equations
    pg_high = 64
    pg_low = -22

    return json.dumps(
        {
            "pg_high": pg_high,
            "pg_low": pg_low,
            "ok": True,
            "inputs": {
                "g_original": g_original,
                "delta_original": delta_original,
                "g_rtfo": g_rtfo,
                "delta_rtfo": delta_rtfo,
            },
        }
    )
