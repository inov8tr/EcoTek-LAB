import json


def handler(request):
    data = request.json()
    shear_rate = data.get("shear_rate")
    temperature = data.get("temperature")
    viscosity = 150  # placeholder

    return json.dumps(
        {
          "shear_rate": shear_rate,
          "temperature": temperature,
          "viscosity_cP": viscosity,
          "message": "Placeholder viscosity model.",
        }
    )
