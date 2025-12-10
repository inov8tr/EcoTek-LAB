# EcoLAB Python Service

FastAPI microservice responsible for PG grading, DSR curve workups, viscosity approximations, and future ML predictions.

## Local Development

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 10000 --reload
```

## Render Deployment

1. Click **New → Web Service** in the Render dashboard.
2. Choose the repo containing `ecolab-python`.
3. Configure:
   - **Environment:** Python 3.11
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Port:** Render injects `$PORT` (default 10000 locally).
   - **Health check path:** `/health`
4. Add environment variables if needed (e.g., `MODEL_BUCKET`, `API_TOKEN`).
5. Deploy and verify `GET /health` returns `{ "status": "ok" }`.

Expose the base URL (e.g., `https://ecolab-python.onrender.com`) to the Next.js app via `PY_SERVICE_URL` / `NEXT_PUBLIC_PY_SERVICE_URL`.
