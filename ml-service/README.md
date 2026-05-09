# ManasSaathi Python ML Service

This service provides OpenCV-based live and window behavior scoring.

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
