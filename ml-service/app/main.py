from __future__ import annotations

import base64
import math
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

try:
    import cv2  # type: ignore
except Exception:
    cv2 = None

# ── Load trained model ────────────────────────────────────────────────────────
try:
    import joblib

    _MODEL_PATH    = os.path.join(os.path.dirname(__file__), "asd_model.pkl")
    _META_PATH     = os.path.join(os.path.dirname(__file__), "asd_metadata.pkl")

    if os.path.exists(_MODEL_PATH):
        _pipeline  = joblib.load(_MODEL_PATH)
        _meta      = joblib.load(_META_PATH) if os.path.exists(_META_PATH) else {}
        _model_ready = True
        _model_version = "manassaathi-rf-uci-asd-v1"
        print(f"[ML] Trained model loaded from {_MODEL_PATH}")
        print(f"[ML] Accuracy: {_meta.get('accuracy', '?'):.1%}  ROC-AUC: {_meta.get('roc_auc', '?'):.3f}")
    else:
        _pipeline    = None
        _meta        = {}
        _model_ready = False
        _model_version = "python-heuristic-fallback-v1"
        print("[ML] WARNING: asd_model.pkl not found. Run train_model.py first!")
        print("[ML]          Falling back to heuristic sigmoid model.")

except ImportError:
    _pipeline    = None
    _meta        = {}
    _model_ready = False
    _model_version = "python-heuristic-fallback-v1"
    print("[ML] joblib not installed — using fallback model.")

# ── PDF generator ─────────────────────────────────────────────────────────────
try:
    from app.pdf_generator import generate_pdf_report
    _pdf_ready = True
except Exception as _pdf_err:
    _pdf_ready = False
    print(f"[PDF] PDF generator unavailable: {_pdf_err}")

app = FastAPI(title="ManasSaathi Python ML", version="1.0.0")

# In-memory session store (lives for duration of service process)
SESSION_WINDOWS: Dict[str, List["FrameInput"]] = {}
SESSION_DATA: Dict[str, Dict[str, Any]] = {}  # stores last result per session key
MAX_WINDOW = 45


# ── Pydantic models ────────────────────────────────────────────────────────────
class FrameInput(BaseModel):
    frame_index: int = 0
    eye_contact: float = Field(ge=0, le=100)
    attention_span: float = Field(ge=0, le=100)
    emotion_signals: float = Field(ge=0, le=100)
    gesture_analysis: float = Field(ge=0, le=100)
    confidence: float = Field(default=70, ge=0, le=100)
    image_base64: Optional[str] = None


class WindowRequest(BaseModel):
    session_key: Optional[str] = None
    frames: List[FrameInput]
    # Optional child info for report generation
    child_name: Optional[str] = None
    parent_name: Optional[str] = None
    parent_email: Optional[str] = None
    parent_phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None


class LiveRequest(BaseModel):
    session_key: str
    frame: FrameInput
    child_info: Optional[Dict[str, str]] = None


class ReportRequest(BaseModel):
    session_key: str
    child_name: Optional[str] = None
    parent_name: Optional[str] = None
    parent_email: Optional[str] = None
    parent_phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None


# ── Utilities ─────────────────────────────────────────────────────────────────
def clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return float(max(low, min(high, value)))


def sigmoid(value: float) -> float:
    return 1.0 / (1.0 + math.exp(-value))


def decode_image(image_base64: str) -> Optional[np.ndarray]:
    if not image_base64 or cv2 is None:
        return None
    raw = image_base64
    if "," in image_base64:
        raw = image_base64.split(",", 1)[1]
    try:
        payload = base64.b64decode(raw)
        arr = np.frombuffer(payload, dtype=np.uint8)
        image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return image
    except Exception:
        return None


def extract_cv_adjustments(frame: FrameInput) -> Dict[str, float]:
    """Extract behavioral features using MediaPipe CV, fall back to input values."""
    defaults = {
        "eye": frame.eye_contact,
        "attention": frame.attention_span,
        "emotion": frame.emotion_signals,
        "gesture": frame.gesture_analysis,
        "confidence": frame.confidence,
    }

    try:
        from app.ml_analyzer import analyze_frame
    except ImportError:
        return defaults

    if not frame.image_base64 or cv2 is None:
        return defaults

    image = decode_image(frame.image_base64)
    if image is None:
        return defaults

    return analyze_frame(image, {
        "eye_contact": frame.eye_contact,
        "attention_span": frame.attention_span,
        "emotion_signals": frame.emotion_signals,
        "gesture_analysis": frame.gesture_analysis,
        "confidence": frame.confidence,
    })


# ── Feature bridge: camera metrics → AQ-10 scale ─────────────────────────────
def camera_to_aq10(eye: float, attention: float, emotion: float, gesture: float) -> Dict[str, float]:
    """
    Maps camera behavioral scores (0-100) to AQ-10 style features (0-1).
    
    Mapping rationale (from AQ-10 questions for children):
    A1  "Responds when name called"          → eye_contact (high = responds)
    A2  "Social interaction"                  → attention (proxy)
    A3  "Non-verbal communication"            → gesture
    A4  "Pointing gestures"                  → gesture
    A5  "Pretend play"                        → composite
    A6  "Follows pointing"                    → attention
    A7  "Maintains eye contact"              → eye_contact
    A8  "Repetitive behaviour"               → gesture (inverted — stimming signal)
    A9  "Facial expression response"         → emotion
    A10 "Response to others' feelings"       → emotion
    
    ASD traits score 1 (concern), typical traits score 0.
    We INVERT camera scores because:
    - High eye_contact = typical → A1 = 0 (no concern)
    - Low eye_contact = concern  → A1 = 1
    """
    # Invert: high camera score = no ASD concern = AQ score 0
    def invert(v: float) -> float:
        return clamp(1.0 - (v / 100.0), 0.0, 1.0)

    eye_inv = invert(eye)
    att_inv = invert(attention)
    emo_inv = invert(emotion)
    ges_inv = invert(gesture)

    return {
        "A1_Score": eye_inv,                              # Eye contact when called
        "A2_Score": att_inv,                              # Social ease
        "A3_Score": ges_inv,                              # Non-verbal gestures
        "A4_Score": ges_inv,                              # Pointing
        "A5_Score": (att_inv + ges_inv) / 2,             # Pretend play (composite)
        "A6_Score": att_inv,                              # Follows pointing
        "A7_Score": eye_inv,                              # Maintains eye contact
        "A8_Score": min(1.0, ges_inv * 1.2),             # Repetitive behaviour (stimming)
        "A9_Score": emo_inv,                              # Facial expression response
        "A10_Score": emo_inv,                             # Response to emotions
        "aq_total": eye_inv*2 + att_inv*2 + emo_inv*2 + ges_inv*2 + (att_inv + ges_inv),
        "has_jaundice": 0.0,   # Unknown from camera — default typical
        "family_autism": 0.0,  # Unknown from camera — default typical
        "gender_m": 0.5,       # Unknown from camera — neutral
        "age_norm": 0.4,       # Unknown from camera — assume ~7 years
    }


def run_model(eye: float, attention: float, emotion: float, gesture: float) -> Dict[str, Any]:
    """
    Runs either the trained RandomForest model or heuristic fallback.
    Returns: risk_score (0-100), risk_label, aq_scores
    """
    aq_features = camera_to_aq10(eye, attention, emotion, gesture)

    if _model_ready and _pipeline is not None:
        try:
            feature_names = _meta.get("feature_names", list(aq_features.keys()))
            X = np.array([[aq_features.get(f, 0.0) for f in feature_names]])
            proba = _pipeline.predict_proba(X)[0]
            # Index 1 = ASD positive class probability
            asd_prob = float(proba[1]) if len(proba) > 1 else float(proba[0])
            risk_score = int(round(clamp(asd_prob * 100, 1, 99)))
            used_model = _model_version
        except Exception as model_err:
            print(f"[ML] Model predict failed: {model_err} — using heuristic fallback")
            risk_score, used_model = _heuristic_score(eye, attention, emotion, gesture)
    else:
        risk_score, used_model = _heuristic_score(eye, attention, emotion, gesture)

    if risk_score >= 65:
        risk_label = "high"
    elif risk_score >= 35:
        risk_label = "moderate"
    else:
        risk_label = "low"

    return {
        "risk_score": risk_score,
        "risk_label": risk_label,
        "model_version": used_model,
        "aq_scores": {k: round(v, 3) for k, v in aq_features.items() if k.startswith("A")},
    }


def _heuristic_score(eye: float, attention: float, emotion: float, gesture: float) -> tuple[int, str]:
    """Sigmoid fallback when model not loaded."""
    linear = -4.1 + 0.038 * (100 - eye) + 0.041 * (100 - attention) + 0.028 * (100 - emotion) + 0.031 * (100 - gesture)
    prob = clamp(sigmoid(linear) * 100.0, 1.0, 99.0)
    return int(round(prob)), "python-heuristic-fallback-v1"


def _build_recommendations(risk_label: str, eye: float, attention: float) -> List[str]:
    recs: List[str] = []
    if eye < 40:
        recs.append("Low eye contact observed — include structured face-to-face play activities daily.")
    if attention < 40:
        recs.append("Attention drift detected — consider occupational therapy evaluation.")
    if risk_label == "high":
        recs += [
            "Schedule a developmental pediatrician appointment within 2 weeks.",
            "Request formal ASD evaluation (ADOS-2) from a specialist.",
            "Contact National Trust helpline: 1800-11-4515 (India, toll-free).",
        ]
    elif risk_label == "moderate":
        recs += [
            "Repeat screening in 2 weeks to track behavioral trends.",
            "Discuss observations with your child's pediatrician.",
            "Encourage structured social interaction and joint attention activities.",
        ]
    else:
        recs += [
            "Continue regular developmental monitoring.",
            "Re-screen if you notice changes in communication, eye contact, or social behavior.",
        ]
    recs.append("This is a screening tool — results must be confirmed by a clinical professional.")
    return recs


def score_frames(frames: List[FrameInput]) -> Dict[str, Any]:
    if not frames:
        raise ValueError("frames must not be empty")

    adjusted = [extract_cv_adjustments(frame) for frame in frames]

    eye       = float(np.mean([item["eye"] for item in adjusted]))
    attention = float(np.mean([item["attention"] for item in adjusted]))
    emotion   = float(np.mean([item["emotion"] for item in adjusted]))
    gesture   = float(np.mean([item["gesture"] for item in adjusted]))
    confidence = float(np.mean([item["confidence"] for item in adjusted]))

    result = run_model(eye, attention, emotion, gesture)

    return {
        "success": True,
        "model_version": result["model_version"],
        "risk_score": result["risk_score"],
        "risk_label": result["risk_label"],
        "feature_averages": {
            "eye_contact": int(round(eye)),
            "attention_span": int(round(attention)),
            "emotion_signals": int(round(emotion)),
            "gesture_analysis": int(round(gesture)),
            "confidence": int(round(confidence)),
        },
        "aq_scores": result["aq_scores"],
        "recommendations": _build_recommendations(result["risk_label"], eye, attention),
        "policy": "Screening support only. Not a medical diagnosis.",
        "dataset": "UCI ASD Screening Children Dataset (ID: 419)" if _model_ready else "Heuristic fallback",
    }


# ══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "ok": True,
        "service": "manassaathi-python-ml",
        "opencv": cv2 is not None,
        "model_ready": _model_ready,
        "model_version": _model_version,
        "pdf_ready": _pdf_ready,
        "dataset": "UCI ASD Screening Children (ID: 419)" if _model_ready else "N/A",
        "test_accuracy": f"{_meta.get('accuracy', 0):.1%}" if _model_ready else "N/A",
        "cv_roc_auc": f"{_meta.get('cv_auc_mean', _meta.get('roc_auc', 0)):.3f}" if _model_ready else "N/A",
        "test_roc_auc": f"{_meta.get('roc_auc', 0):.3f}" if _model_ready else "N/A",
    }


@app.post("/predict/window")
def predict_window(payload: WindowRequest) -> Dict[str, Any]:
    result = score_frames(payload.frames)
    result["window_size"] = len(payload.frames)
    if payload.session_key:
        result["session_key"] = payload.session_key
        # Store session data for report generation
        SESSION_DATA[payload.session_key] = {
            **result,
            "child_name": payload.child_name or "Unknown",
            "parent_name": payload.parent_name or "—",
            "parent_email": payload.parent_email or "—",
            "parent_phone": payload.parent_phone or "—",
            "city": payload.city or "—",
            "state": payload.state or "—",
            "session_date": datetime.now().strftime("%d %B %Y, %I:%M %p"),
            "session_id": payload.session_key,
        }
    return result


@app.post("/predict/live")
def predict_live(payload: LiveRequest) -> Dict[str, Any]:
    session_key = payload.session_key.strip()
    if not session_key:
        raise ValueError("session_key is required")

    history = SESSION_WINDOWS.get(session_key, [])
    history.append(payload.frame)
    history = history[-MAX_WINDOW:]
    SESSION_WINDOWS[session_key] = history

    result = score_frames(history)
    result["window_size"] = len(history)
    result["session_key"] = session_key

    # Store latest session data (with child info if provided)
    child_info = payload.child_info or {}
    SESSION_DATA[session_key] = {
        **result,
        "child_name": child_info.get("childName", SESSION_DATA.get(session_key, {}).get("child_name", "Unknown")),
        "parent_name": child_info.get("parentName", SESSION_DATA.get(session_key, {}).get("parent_name", "—")),
        "parent_email": child_info.get("parentEmail", SESSION_DATA.get(session_key, {}).get("parent_email", "—")),
        "parent_phone": child_info.get("parentPhone", SESSION_DATA.get(session_key, {}).get("parent_phone", "—")),
        "city": child_info.get("city", SESSION_DATA.get(session_key, {}).get("city", "—")),
        "state": child_info.get("state", SESSION_DATA.get(session_key, {}).get("state", "—")),
        "session_date": datetime.now().strftime("%d %B %Y, %I:%M %p"),
        "session_id": session_key,
    }

    return result


@app.post("/report/generate")
def generate_report(payload: ReportRequest) -> Response:
    """
    Generates a PDF screening report for a session.
    Returns raw PDF bytes with application/pdf content type.
    """
    if not _pdf_ready:
        raise HTTPException(status_code=503, detail="PDF generator is not available. Install reportlab.")

    session_key = payload.session_key.strip()
    stored = SESSION_DATA.get(session_key, {})

    session_data = {
        "child_name":     payload.child_name or stored.get("child_name", "Unknown"),
        "parent_name":    payload.parent_name or stored.get("parent_name", "—"),
        "parent_email":   payload.parent_email or stored.get("parent_email", "—"),
        "parent_phone":   payload.parent_phone or stored.get("parent_phone", "—"),
        "city":           payload.city or stored.get("city", "—"),
        "state":          payload.state or stored.get("state", "—"),
        "session_id":     session_key,
        "session_date":   stored.get("session_date", datetime.now().strftime("%d %B %Y, %I:%M %p")),
        "risk_score":     stored.get("risk_score", 0),
        "risk_label":     stored.get("risk_label", "low"),
        "feature_averages": stored.get("feature_averages", {}),
        "recommendations":  stored.get("recommendations", []),
        "model_version":    stored.get("model_version", _model_version),
        "aq_scores":        stored.get("aq_scores", {}),
    }

    try:
        pdf_bytes = generate_pdf_report(session_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")

    child_name_safe = session_data["child_name"].replace(" ", "_")
    date_safe = datetime.now().strftime("%Y%m%d")
    filename = f"ManasSaathi_Report_{child_name_safe}_{date_safe}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/report/session/{session_key}")
def get_session_data(session_key: str) -> Dict[str, Any]:
    """Returns stored session result data (for frontend report page)."""
    data = SESSION_DATA.get(session_key)
    if not data:
        raise HTTPException(status_code=404, detail="Session not found or expired.")
    return {"success": True, **data}
