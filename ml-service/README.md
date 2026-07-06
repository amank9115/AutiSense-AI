# ManasSaathi Python ML Service

This service provides OpenCV-based live and window behavior scoring.

## Model Artifacts & Deployment Strategy

The RandomForest model files (`app/asd_model.pkl`, `app/asd_scaler.pkl`,
`app/asd_metadata.pkl`) are **gitignored** and are **not** checked into the repo.

**Production strategy (Option C — train at build time):** the `Dockerfile` runs
`python train_model.py` during the image build. That script fetches the public UCI
ASD screening dataset and writes the `.pkl` artifacts into the image, so a built
container is fully self-contained. Note this requires network access during
`docker build`.

Alternative strategies if build-time training is undesirable:
- **Git LFS** — track the `.pkl` files with Git LFS and `COPY` them in the Dockerfile.
- **Object storage** — download pre-trained artifacts from S3/GCS on container start.

For local development, run `python train_model.py` once before starting the service.

## Setup

```bash
cd backend-python
python -m venv .venv
# Windows
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

## Endpoints

- `GET /health`
- `POST /predict/live`
- `POST /predict/window`

## Live payload example

```json
{
  "session_key": "child-email",
  "frame": {
    "frame_index": 12,
    "eye_contact": 68,
    "attention_span": 73,
    "emotion_signals": 64,
    "gesture_analysis": 41,
    "confidence": 77
  }
}
```

Optional: include `image_base64` inside `frame` for OpenCV face-aware scoring.
