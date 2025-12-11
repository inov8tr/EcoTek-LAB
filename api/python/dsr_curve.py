import json


def handler(request):
    data = request.json()
    temps = data.get("temps", [])
    gstars = data.get("gstars", [])

    result = {
        "temps": temps,
        "gstars": gstars,
        "message": "Placeholder DSR master curve.",
    }
    return json.dumps(result)
