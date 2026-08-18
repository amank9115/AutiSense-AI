from __future__ import annotations

import base64
import json
import logging
import math
import os
import re
import sqlite3
import sys
import time
from datetime import datetime
from pathlib import Path as PathlibPath
from typing import Any, Dict, List, Optional

import numpy as np
from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form, Depends, Security
from fastapi.security import APIKeyHeader
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
import structlog

# ── Add ai-engine to Python path for imports ───────────────────────────────────
AI_ENGINE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ai-engine"))
if AI_ENGINE_PATH not in sys.path:
    sys.path.insert(0, AI_ENGINE_PATH)

# ── Structured Logging Setup ──────────────────────────────────────────────────
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer() if os.getenv("LOG_FORMAT", "console") == "console"
        else structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(
        logging.getLogger().level if hasattr(logging.getLogger(), 'level') else 20
    ),
)

logger = structlog.get_logger()

# ── Prometheus Metrics ────────────────────────────────────────────────────────
from app.metrics import (
    MetricsTracker,
    PredictionMetrics,
    ModelMetrics,
    SessionMetrics,
    get_metrics,
    get_content_type,
)

try:
    import cv2  # type: ignore
except Exception:
    cv2 = None

# ── Load trained model ────────────────────────────────────────────────────────
try:
    import joblib

    _MODEL_PATH    = os.path.join(os.path.dirname(__file__), "asd_model.pkl")
    _META_PATH     = os.path.join(os.path.dirname(__file__), "asd_metadata.pkl")
    _MODELS_DIR    = os.path.join(os.path.dirname(__file__), "models")
    _MODEL_LOAD_TIME = time.time()

    if os.path.exists(_MODEL_PATH):
        try:
            _pipeline  = joblib.load(_MODEL_PATH)
            _meta      = joblib.load(_META_PATH) if os.path.exists(_META_PATH) else {}
            _model_ready = True
            _model_version = _meta.get("model_version", "manassaathi-rf-uci-asd-v1")

            # Update Prometheus metrics
            ModelMetrics.set_model_info(
                version=_model_version,
                accuracy=_meta.get("accuracy"),
                roc_auc=_meta.get("roc_auc")
            )
            ModelMetrics.record_reload("success")

            logger.info("model_loaded",
                path=_MODEL_PATH,
                version=_model_version,
                accuracy=_meta.get("accuracy"),
                roc_auc=_meta.get("roc_auc")
            )
        except Exception as load_err:
            # File exists but is corrupt/incompatible — surface this loudly rather
            # than silently pretending the trained model is available.
            _pipeline    = None
            _meta        = {}
            _model_ready = False
            _model_version = "python-heuristic-fallback-v1"

            ModelMetrics.record_reload("failure")

            logger.error("model_load_failed",
                path=_MODEL_PATH,
                error=str(load_err),
                fallback="heuristic"
            )
    else:
        _pipeline    = None
        _meta        = {}
        _model_ready = False
        _model_version = "python-heuristic-fallback-v1"
        logger.warning("model_not_found",
            path=_MODEL_PATH,
            fallback="heuristic",
            hint="Run train_model.py first"
        )

except ImportError:
    _pipeline    = None
    _meta        = {}
    _model_ready = False
    _model_version = "python-heuristic-fallback-v1"
    logger.error("joblib_not_installed", fallback="heuristic")

# ── PDF generator ─────────────────────────────────────────────────────────────
try:
    from app.pdf_generator import generate_pdf_report
    _pdf_ready = True
except Exception as _pdf_err:
    _pdf_ready = False
    logger.warning("pdf_generator_unavailable", error=str(_pdf_err))

# ── Session Store (Redis with in-memory fallback) ───────────────────────────────
from app.session_store import session_store, session_windows, get_redis_status

# ── Phase 3: Model Registry, Drift Detector, Retraining, Experiments ─────────────
from app.model_registry import get_registry, ModelStage
from app.drift_detector import get_drift_detector, DriftSeverity
from app.retraining_triggers import get_trigger_system, TriggerConfig, initialize_trigger_system
from app.experiment_manager import get_experiment_manager, initialize_experiment_manager

app = FastAPI(
    title="ManasSaathi Python ML",
    version="2.0.0",
    description="Unified ML service with model registry, drift detection, A/B testing, and video processing"
)

# Initialize Phase 3 components
_model_registry = get_registry()
_experiment_manager = initialize_experiment_manager(model_registry=_model_registry)


# ── Middleware for Metrics ─────────────────────────────────────────────────────
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    """Track request metrics for all endpoints."""
    # Skip metrics endpoint itself to avoid recursion
    if request.url.path == "/metrics":
        return await call_next(request)

    start_time = time.time()
    response = await call_next(request)
    latency = time.time() - start_time

    # Record metrics
    from app.metrics import REQUEST_LATENCY, REQUESTS_TOTAL
    REQUEST_LATENCY.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(latency)
    REQUESTS_TOTAL.labels(
        method=request.method,
        endpoint=request.url.path,
        status_code=response.status_code
    ).inc()

    return response

# CORS middleware for frontend / backend connection. Restrict to known origins
# by default; override via ML_ALLOWED_ORIGINS (comma-separated) when deploying.
_allowed_origins = [
    o.strip()
    for o in os.getenv(
        "ML_ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:4000,http://127.0.0.1:4000",
    ).split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ── Admin API Key Authentication ───────────────────────────────────────────────
# Admin endpoints require ML_ADMIN_API_KEY environment variable to be set
# This prevents unauthorized access to sensitive model management operations
_API_KEY_HEADER = APIKeyHeader(name="X-Admin-API-Key", auto_error=False)

def get_admin_api_key(api_key: str = Security(_API_KEY_HEADER)) -> str:
    """Validate admin API key for protected endpoints.

    Raises HTTPException if ML_ADMIN_API_KEY is not configured or key is invalid.
    """
    expected_key = os.getenv("ML_ADMIN_API_KEY")
    if not expected_key:
        raise HTTPException(
            status_code=503,
            detail="Admin API key not configured. Set ML_ADMIN_API_KEY environment variable."
        )
    if not api_key or api_key != expected_key:
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing admin API key. Include X-Admin-API-Key header."
        )
    return api_key


# Session configuration
MAX_WINDOW = 45
SESSION_TTL_SECONDS = int(os.getenv("SESSION_TTL_SECONDS", "3600"))  # default 1 hour

# Session storage: Redis-backed store for session data, in-memory for frame windows
# session_store: Redis-backed with automatic in-memory fallback for session data
# SESSION_WINDOWS: In-memory frame history (transient, doesn't need persistence)
SESSION_WINDOWS: Dict[str, List["FrameInput"]] = {}


# ── TTL Session Cleanup ───────────────────────────────────────────────────────
import threading

def _cleanup_expired_sessions() -> None:
    """Background task to clean up expired sessions."""
    while True:
        try:
            time.sleep(300)  # Run every 5 minutes
            # Use session_store's cleanup method (handles both Redis and in-memory)
            expired_count = session_store.cleanup_expired()
            if expired_count > 0:
                logger.info("session_cleanup",
                    expired_count=expired_count,
                    active_sessions=session_store.count()
                )
                SessionMetrics.record_expired(expired_count)
        except Exception as e:
            logger.error("session_cleanup_error", error=str(e))


# Start cleanup thread on module load
_cleanup_thread = threading.Thread(target=_cleanup_expired_sessions, daemon=True)
_cleanup_thread.start()


def _touch_session(session_key: str) -> None:
    """Update session last access timestamp."""
    session_store.touch(session_key)


# ── Pydantic models ────────────────────────────────────────────────────────────
import re
from typing import Annotated


class FrameInput(BaseModel):
    frame_index: int = Field(default=0, ge=0, description="Frame sequence number")
    eye_contact: float = Field(ge=0, le=100, description="Eye contact score (0-100)")
    attention_span: float = Field(ge=0, le=100, description="Attention span score (0-100)")
    emotion_signals: float = Field(ge=0, le=100, description="Emotion signals score (0-100)")
    gesture_analysis: float = Field(ge=0, le=100, description="Gesture analysis score (0-100)")
    confidence: float = Field(default=70, ge=0, le=100, description="Confidence score (0-100)")
    image_base64: Optional[str] = Field(default=None, description="Optional base64-encoded image for CV analysis")

    @field_validator('image_base64')
    @classmethod
    def validate_base64(cls, v: Optional[str]) -> Optional[str]:
        """Validate that image_base64 is valid base64 if provided."""
        if v is None:
            return v

        # Remove data URL prefix if present
        raw = v.split(",", 1)[1] if "," in v else v

        # Check it's valid base64 characters
        if not re.match(r'^[A-Za-z0-9+/]*={0,2}$', raw):
            raise ValueError('image_base64 must be valid base64 encoded string')

        # Check reasonable size (max ~10MB decoded)
        if len(raw) * 3 // 4 > 10 * 1024 * 1024:
            raise ValueError('image_base64 payload too large (max 10MB decoded)')

        return v


class WindowRequest(BaseModel):
    session_key: Optional[str] = Field(default=None, min_length=1, max_length=255)
    frames: List[FrameInput] = Field(min_length=1, max_length=1000, description="List of frames to analyze (1-1000)")
    # Optional child info for report generation
    child_name: Optional[str] = Field(default=None, max_length=200)
    parent_name: Optional[str] = Field(default=None, max_length=200)
    parent_email: Optional[str] = Field(default=None, max_length=255)
    parent_phone: Optional[str] = Field(default=None, max_length=50)
    city: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=100)

    @field_validator('session_key')
    @classmethod
    def validate_session_key(cls, v: Optional[str]) -> Optional[str]:
        """Validate session key is not empty/whitespace."""
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError('session_key cannot be empty or whitespace only')
        return v

    @field_validator('parent_email')
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        """Basic email validation."""
        if v is None:
            return v
        v = v.strip()
        if v and not re.match(r'^[^@]+@[^@]+\.[^@]+$', v):
            raise ValueError('parent_email must be a valid email address')
        return v

    @field_validator('parent_phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        """Basic phone validation (allows various formats)."""
        if v is None:
            return v
        v = v.strip()
        # Allow digits, spaces, dashes, parentheses, plus sign
        if v and not re.match(r'^[\d\s\-\(\)\+]+$', v):
            raise ValueError('parent_phone must contain only valid phone number characters')
        return v


class LiveRequest(BaseModel):
    session_key: str = Field(min_length=1, max_length=255, description="Unique session identifier")
    frame: FrameInput
    child_info: Optional[Dict[str, str]] = None

    @field_validator('session_key')
    @classmethod
    def validate_session_key(cls, v: str) -> str:
        """Validate session key is not empty/whitespace."""
        v = v.strip()
        if not v:
            raise ValueError('session_key cannot be empty or whitespace only')
        return v


class ReportRequest(BaseModel):
    session_key: str = Field(min_length=1, max_length=255)
    child_name: Optional[str] = Field(default=None, max_length=200)
    parent_name: Optional[str] = Field(default=None, max_length=200)
    parent_email: Optional[str] = Field(default=None, max_length=255)
    parent_phone: Optional[str] = Field(default=None, max_length=50)
    city: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=100)
    # DB-sourced data — overrides stale in-memory SESSION_DATA when provided
    risk_score: Optional[float] = Field(default=None, ge=0, le=100)
    risk_label: Optional[str] = Field(default=None, pattern='^(low|moderate|high)$')
    feature_averages: Optional[Dict[str, float]] = None
    recommendations: Optional[List[str]] = None
    model_version: Optional[str] = Field(default=None, max_length=255)

    @field_validator('session_key')
    @classmethod
    def validate_session_key(cls, v: str) -> str:
        """Validate session key is not empty/whitespace."""
        v = v.strip()
        if not v:
            raise ValueError('session_key cannot be empty or whitespace only')
        return v

    @field_validator('parent_email')
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        """Basic email validation."""
        if v is None:
            return v
        v = v.strip()
        if v and not re.match(r'^[^@]+@[^@]+\.[^@]+$', v):
            raise ValueError('parent_email must be a valid email address')
        return v


# ── Utilities ─────────────────────────────────────────────────────────────────
def clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return float(max(low, min(high, value)))


# ── Prediction History for Drift Detection ─────────────────────────────────────
class PredictionHistory:
    """Track recent predictions for drift detection."""

    def __init__(self, max_size: int = 1000):
        self.max_size = max_size
        self.predictions: List[Dict[str, Any]] = []

    def add(self, risk_score: int, risk_label: str, confidence: float, model_version: str):
        """Add a prediction to history."""
        self.predictions.append({
            "risk_score": risk_score,
            "risk_label": risk_label,
            "confidence": confidence,
            "model_version": model_version,
            "timestamp": time.time()
        })
        # Keep only last N predictions
        if len(self.predictions) > self.max_size:
            self.predictions = self.predictions[-self.max_size:]

    def get_statistics(self, window: int = 100) -> Dict[str, Any]:
        """Calculate statistics over recent predictions."""
        if not self.predictions:
            return {
                "count": 0,
                "message": "No predictions recorded yet"
            }

        recent = self.predictions[-window:]
        risk_scores = [p["risk_score"] for p in recent]
        confidences = [p["confidence"] for p in recent]

        # Risk label distribution
        label_counts = {"low": 0, "moderate": 0, "high": 0}
        for p in recent:
            label_counts[p["risk_label"]] = label_counts.get(p["risk_label"], 0) + 1

        return {
            "count": len(recent),
            "risk_score_mean": round(np.mean(risk_scores), 2) if risk_scores else 0,
            "risk_score_std": round(np.std(risk_scores), 2) if len(risk_scores) > 1 else 0,
            "confidence_mean": round(np.mean(confidences), 2) if confidences else 0,
            "confidence_std": round(np.std(confidences), 2) if len(confidences) > 1 else 0,
            "label_distribution": label_counts,
            "label_distribution_pct": {
                k: round(v / len(recent) * 100, 1) if recent else 0
                for k, v in label_counts.items()
            }
        }

    def detect_drift(self, baseline_accuracy: float = 0.85) -> Dict[str, Any]:
        """Detect potential model drift."""
        stats = self.get_statistics(window=100)

        if stats["count"] < 10:
            return {
                "drift_detected": False,
                "message": "Insufficient data for drift detection",
                "recommendations": []
            }

        drift_indicators = []
        warnings = []

        # Check confidence drop
        if stats["confidence_mean"] < 50:
            drift_indicators.append("low_confidence")
            warnings.append("Average confidence below 50% - inputs may be out of distribution")

        # Check risk score distribution
        # Expected: roughly 30% low, 40% moderate, 30% high for screening population
        label_pct = stats["label_distribution_pct"]
        if label_pct["high"] > 60:
            drift_indicators.append("high_risk_bias")
            warnings.append("Unusually high proportion of high-risk predictions")
        elif label_pct["low"] > 80:
            drift_indicators.append("low_risk_bias")
            warnings.append("Unusually high proportion of low-risk predictions")

        # Check risk score variance (very low variance might indicate stuck predictions)
        if stats["risk_score_std"] < 5:
            drift_indicators.append("low_variance")
            warnings.append("Very low variance in risk scores - predictions may be stuck")

        return {
            "drift_detected": len(drift_indicators) > 0,
            "drift_indicators": drift_indicators,
            "warnings": warnings,
            "statistics": stats,
            "recommendations": [
                "Review recent predictions for anomalies",
                "Check input data quality",
                "Consider model retraining if drift persists"
            ] if drift_indicators else []
        }


# Global prediction history
_prediction_history = PredictionHistory()


def sigmoid(value: float) -> float:
    value = max(-500.0, min(500.0, value))
    return 1.0 / (1.0 + math.exp(-value))


MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB cap on a single decoded frame


def decode_image(image_base64: str) -> Optional[np.ndarray]:
    if not image_base64 or cv2 is None:
        return None
    raw = image_base64
    if "," in image_base64:
        raw = image_base64.split(",", 1)[1]
    # Reject oversized payloads before allocating. base64 inflates bytes ~4/3,
    # so compare the decoded-size estimate against the cap.
    if len(raw) * 3 // 4 > MAX_IMAGE_BYTES:
        print("[ML] decode_image: payload exceeds size cap, skipping frame")
        return None
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

    def safe_mean(key: str, fallback: float = 50.0) -> float:
        values = [item[key] for item in adjusted if item.get(key) is not None]
        finite = [v for v in values if isinstance(v, (int, float)) and math.isfinite(v)]
        if not finite:
            return fallback
        return clamp(float(np.mean(finite)))

    eye        = safe_mean("eye")
    attention  = safe_mean("attention")
    emotion    = safe_mean("emotion")
    gesture    = safe_mean("gesture")
    confidence = safe_mean("confidence", fallback=70.0)

    result = run_model(eye, attention, emotion, gesture)

    return {
        "success": True,
        "model_version": result["model_version"],
        "risk_score": result["risk_score"],
        "risk_label": result["risk_label"],
        "low_confidence": confidence < 50,
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
        "model_age_hours": round((time.time() - _MODEL_LOAD_TIME) / 3600, 2) if _model_ready else None,
        "active_sessions": session_store.count(),
        "redis_status": get_redis_status(),
        "dataset": "UCI ASD Screening Children (ID: 419)" if _model_ready else "N/A",
        "test_accuracy": f"{_meta.get('accuracy', 0):.1%}" if _model_ready else "N/A",
        "cv_roc_auc": f"{_meta.get('cv_auc_mean', _meta.get('roc_auc', 0)):.3f}" if _model_ready else "N/A",
        "test_roc_auc": f"{_meta.get('roc_auc', 0):.3f}" if _model_ready else "N/A",
    }


@app.get("/health/detailed")
def health_detailed() -> Dict[str, Any]:
    """Detailed health check with performance metrics."""
    return {
        **health(),
        "metrics": {
            "total_predictions": getattr(app.state, "prediction_count", 0),
            "avg_confidence_last_100": getattr(app.state, "recent_confidences", []),
        },
        "model": {
            "path": _MODEL_PATH,
            "meta": _meta,
        },
        "sessions": {
            "active": session_store.count(),
            "with_windows": len(SESSION_WINDOWS),
            "ttl_seconds": SESSION_TTL_SECONDS,
        }
    }


@app.get("/health/drift")
def health_drift() -> Dict[str, Any]:
    """
    Model drift detection and performance analysis.

    Analyzes recent predictions to detect:
    - Distribution shifts in risk scores
    - Confidence degradation
    - Prediction patterns that may indicate model staleness

    Returns drift indicators and recommendations for model maintenance.
    """
    # Model age analysis
    model_age_hours = (time.time() - _MODEL_LOAD_TIME) / 3600 if _model_ready else None
    model_age_days = model_age_hours / 24 if model_age_hours else None

    # Staleness indicators
    staleness_level = "fresh"
    staleness_message = "Model is recently trained"
    staleness_recommendations = []

    if model_age_days is not None:
        if model_age_days > 90:
            staleness_level = "critical"
            staleness_message = "Model is over 90 days old - retraining strongly recommended"
            staleness_recommendations = [
                "Schedule immediate model retraining",
                "Review model performance metrics",
                "Consider using a more recent model version from registry"
            ]
        elif model_age_days > 60:
            staleness_level = "warning"
            staleness_message = "Model is over 60 days old - consider retraining"
            staleness_recommendations = [
                "Plan model retraining within 2 weeks",
                "Monitor prediction quality closely"
            ]
        elif model_age_days > 30:
            staleness_level = "info"
            staleness_message = "Model is over 30 days old - monitor for performance changes"
            staleness_recommendations = [
                "Review recent prediction distributions",
                "Consider scheduling model refresh"
            ]

    # Get drift analysis
    drift_analysis = _prediction_history.detect_drift(
        baseline_accuracy=_meta.get("accuracy", 0.85)
    )

    # Prediction volume
    prediction_stats = _prediction_history.get_statistics()

    # Combined health assessment
    health_status = "healthy"
    if staleness_level in ["critical", "warning"] or drift_analysis.get("drift_detected"):
        health_status = "attention_required"

    return {
        "status": health_status,
        "model": {
            "version": _model_version,
            "age_hours": round(model_age_hours, 2) if model_age_hours else None,
            "age_days": round(model_age_days, 2) if model_age_days else None,
            "staleness_level": staleness_level,
            "staleness_message": staleness_message,
            "baseline_accuracy": _meta.get("accuracy"),
            "baseline_roc_auc": _meta.get("roc_auc"),
        },
        "predictions": {
            "total_count": getattr(app.state, "prediction_count", 0),
            "recent_statistics": prediction_stats,
        },
        "drift_analysis": drift_analysis,
        "recommendations": list(set(
            staleness_recommendations + drift_analysis.get("recommendations", [])
        )),
        "sessions": {
            "active": session_store.count(),
        }
    }


@app.post("/admin/reload-model")
async def reload_model(
    version: Optional[str] = None,
    api_key: str = Depends(get_admin_api_key)
) -> Dict[str, Any]:
    """
    Reload model without restarting service.

    Requires X-Admin-API-Key header with valid ML_ADMIN_API_KEY.

    Args:
        version: Optional specific model version to load (e.g., "v20240601_abc123")
                 If not provided, loads the latest model from app/asd_model.pkl
    """
    global _pipeline, _meta, _model_ready, _model_version, _MODEL_LOAD_TIME

    logger.info("model_reload_requested", version=version)

    try:
        if version:
            # Load specific versioned model
            model_path = os.path.join(_MODELS_DIR, f"asd_model_{version}.pkl")
            meta_path = os.path.join(_MODELS_DIR, f"asd_metadata_{version}.pkl")
        else:
            # Load latest model
            model_path = _MODEL_PATH
            meta_path = _META_PATH

        if not os.path.exists(model_path):
            raise HTTPException(status_code=404, detail=f"Model not found: {model_path}")

        _pipeline = joblib.load(model_path)
        _meta = joblib.load(meta_path) if os.path.exists(meta_path) else {}
        _model_ready = True
        _model_version = _meta.get("model_version", "unknown")
        _MODEL_LOAD_TIME = time.time()

        logger.info("model_reload_success",
            path=model_path,
            version=_model_version,
            accuracy=_meta.get("accuracy"),
            roc_auc=_meta.get("roc_auc")
        )

        return {
            "status": "success",
            "model_version": _model_version,
            "accuracy": _meta.get("accuracy"),
            "roc_auc": _meta.get("roc_auc"),
            "loaded_at": datetime.now().isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("model_reload_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Model reload failed: {e}")


@app.get("/admin/models")
def list_models() -> Dict[str, Any]:
    """List all available model versions."""
    import json

    models = []

    # Check versioned models directory
    if os.path.exists(_MODELS_DIR):
        for f in os.listdir(_MODELS_DIR):
            if f.startswith("asd_model_") and f.endswith(".pkl"):
                version = f.replace("asd_model_", "").replace(".pkl", "")
                meta_file = f.replace("asd_model_", "asd_metadata_")
                meta_path = os.path.join(_MODELS_DIR, meta_file)

                meta = {}
                if os.path.exists(meta_path):
                    try:
                        meta = joblib.load(meta_path)
                    except Exception:
                        pass

                models.append({
                    "version": version,
                    "path": os.path.join(_MODELS_DIR, f),
                    "accuracy": meta.get("accuracy"),
                    "roc_auc": meta.get("roc_auc"),
                    "created_at": meta.get("trained_at"),
                    "is_current": version in _model_version,
                })

    # Check registry
    registry_path = os.path.join(_MODELS_DIR, "registry.json")
    registry = []
    if os.path.exists(registry_path):
        try:
            with open(registry_path, "r") as f:
                registry = json.load(f)
        except Exception:
            pass

    return {
        "current_model": _model_version,
        "models": models,
        "registry": registry,
    }


# ══════════════════════════════════════════════════════════════════════════════
# PROMETHEUS METRICS ENDPOINT
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/metrics")
def metrics():
    """Prometheus metrics endpoint for monitoring."""
    # Update model age before serving metrics
    if _model_ready:
        ModelMetrics.update_model_age(_MODEL_LOAD_TIME)

    # Update session count
    SessionMetrics.set_active_count(session_store.count())

    return Response(
        content=get_metrics(),
        media_type=get_content_type()
    )


@app.post("/predict/window")
def predict_window(payload: WindowRequest) -> Dict[str, Any]:
    start_time = time.time()

    result = score_frames(payload.frames)
    result["window_size"] = len(payload.frames)

    if payload.session_key:
        result["session_key"] = payload.session_key
        # Store session data for report generation (Redis-backed)
        session_store.set(payload.session_key, {
            **result,
            "child_name": payload.child_name or "Unknown",
            "parent_name": payload.parent_name or "—",
            "parent_email": payload.parent_email or "—",
            "parent_phone": payload.parent_phone or "—",
            "city": payload.city or "—",
            "state": payload.state or "—",
            "session_date": datetime.now().strftime("%d %B %Y, %I:%M %p"),
            "session_id": payload.session_key,
        })
        SessionMetrics.record_created()

    latency_ms = round((time.time() - start_time) * 1000, 2)

    # Record Prometheus metrics
    PredictionMetrics.record_prediction(
        endpoint="predict_window",
        risk_score=result["risk_score"],
        risk_label=result["risk_label"],
        confidence=result["feature_averages"].get("confidence", 70),
        model_version=result["model_version"]
    )

    # Record to prediction history for drift detection
    _prediction_history.add(
        risk_score=result["risk_score"],
        risk_label=result["risk_label"],
        confidence=result["feature_averages"].get("confidence", 70),
        model_version=result["model_version"]
    )

    logger.info("prediction_window",
        session_key=payload.session_key,
        window_size=len(payload.frames),
        risk_score=result["risk_score"],
        risk_label=result["risk_label"],
        model_version=result["model_version"],
        latency_ms=latency_ms
    )

    # Track prediction count
    if not hasattr(app.state, "prediction_count"):
        app.state.prediction_count = 0
    app.state.prediction_count += 1

    return result


@app.post("/predict/live")
def predict_live(payload: LiveRequest) -> Dict[str, Any]:
    start_time = time.time()

    session_key = payload.session_key.strip()
    if not session_key:
        raise ValueError("session_key is required")

    history = SESSION_WINDOWS.get(session_key, [])
    history.append(payload.frame)
    history = history[-MAX_WINDOW:]
    SESSION_WINDOWS[session_key] = history
    _touch_session(session_key)

    result = score_frames(history)
    result["window_size"] = len(history)
    result["session_key"] = session_key

    # Store latest session data (with child info if provided)
    child_info = payload.child_info or {}
    existing_session = session_store.get(session_key) or {}
    session_store.set(session_key, {
        **result,
        "child_name": child_info.get("childName", existing_session.get("child_name", "Unknown")),
        "parent_name": child_info.get("parentName", existing_session.get("parent_name", "—")),
        "parent_email": child_info.get("parentEmail", existing_session.get("parent_email", "—")),
        "parent_phone": child_info.get("parentPhone", existing_session.get("parent_phone", "—")),
        "city": child_info.get("city", existing_session.get("city", "—")),
        "state": child_info.get("state", existing_session.get("state", "—")),
        "session_date": datetime.now().strftime("%d %B %Y, %I:%M %p"),
        "session_id": session_key,
    })

    latency_ms = round((time.time() - start_time) * 1000, 2)

    # Record Prometheus metrics
    PredictionMetrics.record_prediction(
        endpoint="predict_live",
        risk_score=result["risk_score"],
        risk_label=result["risk_label"],
        confidence=result["feature_averages"].get("confidence", 70),
        model_version=result["model_version"]
    )

    # Record to prediction history for drift detection
    _prediction_history.add(
        risk_score=result["risk_score"],
        risk_label=result["risk_label"],
        confidence=result["feature_averages"].get("confidence", 70),
        model_version=result["model_version"]
    )

    logger.info("prediction_live",
        session_key=session_key,
        window_size=len(history),
        risk_score=result["risk_score"],
        risk_label=result["risk_label"],
        model_version=result["model_version"],
        latency_ms=latency_ms
    )

    # Track prediction count
    if not hasattr(app.state, "prediction_count"):
        app.state.prediction_count = 0
    app.state.prediction_count += 1

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
    stored = session_store.get(session_key) or {}
    _touch_session(session_key)  # Keep session alive when report is requested

    session_data = {
        "child_name":       payload.child_name or stored.get("child_name", "Unknown"),
        "parent_name":      payload.parent_name or stored.get("parent_name", "—"),
        "parent_email":     payload.parent_email or stored.get("parent_email", "—"),
        "parent_phone":     payload.parent_phone or stored.get("parent_phone", "—"),
        "city":             payload.city or stored.get("city", "—"),
        "state":            payload.state or stored.get("state", "—"),
        "session_id":       session_key,
        "session_date":     stored.get("session_date", datetime.now().strftime("%d %B %Y, %I:%M %p")),
        # DB-sourced values take priority over in-memory cache
        "risk_score":       payload.risk_score if payload.risk_score is not None else stored.get("risk_score", 0),
        "risk_label":       payload.risk_label or stored.get("risk_label", "low"),
        "feature_averages": payload.feature_averages if payload.feature_averages is not None else stored.get("feature_averages", {}),
        "recommendations":  payload.recommendations if payload.recommendations is not None else stored.get("recommendations", []),
        "model_version":    payload.model_version or stored.get("model_version", _model_version),
        "aq_scores":        stored.get("aq_scores", {}),
    }

    try:
        pdf_bytes = generate_pdf_report(session_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")

    MAX_PDF_BYTES = 10 * 1024 * 1024  # 10 MB
    if len(pdf_bytes) > MAX_PDF_BYTES:
        raise HTTPException(status_code=500, detail="Generated PDF exceeds the 10 MB size limit")

    # Sanitize the child name for use in a filename: keep alphanumerics, dashes
    # and underscores only, preventing header injection / path traversal.
    raw_name = session_data["child_name"] or "child"
    child_name_safe = re.sub(r"[^A-Za-z0-9_-]", "_", raw_name.replace(" ", "_"))[:60]
    if not child_name_safe:
        child_name_safe = "child"
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
    data = session_store.get(session_key)
    if not data:
        raise HTTPException(status_code=404, detail="Session not found or expired.")
    _touch_session(session_key)  # Keep session alive when accessed
    return {"success": True, **data}


# ════════════════════════════════════════════════════════════════════════════════
# PHASE 3: MODEL REGISTRY ENDPOINTS
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/admin/registry/stats")
def registry_stats() -> Dict[str, Any]:
    """Get model registry statistics."""
    return _model_registry.stats()


@app.get("/admin/registry/models")
def registry_list_models(
    stage: Optional[str] = None,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """List all registered models, optionally filtered by stage."""
    if stage:
        try:
            stage_enum = ModelStage(stage)
            return _model_registry.list_all(stage=stage_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid stage: {stage}")
    return _model_registry.list_all()[:limit]


@app.get("/admin/registry/models/{version}")
def registry_get_model(version: str) -> Dict[str, Any]:
    """Get a specific model version."""
    model = _model_registry.get(version)
    if not model:
        raise HTTPException(status_code=404, detail=f"Model version {version} not found")
    return model


@app.post("/admin/registry/models/{version}/promote")
def registry_promote_model(
    version: str,
    api_key: str = Depends(get_admin_api_key)
) -> Dict[str, Any]:
    """Promote a model to production.

    Requires X-Admin-API-Key header with valid ML_ADMIN_API_KEY.
    """
    try:
        result = _model_registry.promote(version)

        # Update Prometheus metrics
        ModelMetrics.set_model_info(
            version=version,
            accuracy=result["metadata"].get("accuracy"),
            roc_auc=result["metadata"].get("roc_auc")
        )
        ModelMetrics.record_reload("success")

        logger.info("model_promoted_via_api", version=version)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/admin/registry/models/{version}/demote")
def registry_demote_model(
    version: str,
    api_key: str = Depends(get_admin_api_key)
) -> Dict[str, Any]:
    """Demote a staging model to archived.

    Requires X-Admin-API-Key header with valid ML_ADMIN_API_KEY.
    """
    try:
        return _model_registry.demote(version)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/admin/registry/rollback")
def registry_rollback(
    steps: int = 1,
    api_key: str = Depends(get_admin_api_key)
) -> Dict[str, Any]:
    """Rollback to a previous production model.

    Requires X-Admin-API-Key header with valid ML_ADMIN_API_KEY.
    """
    result = _model_registry.rollback(steps=steps)
    if not result:
        raise HTTPException(status_code=404, detail="No archived models available for rollback")

    # Update Prometheus metrics
    ModelMetrics.set_model_info(
        version=result["version"],
        accuracy=result["metadata"].get("accuracy"),
        roc_auc=result["metadata"].get("roc_auc")
    )

    logger.info("model_rollback_via_api", steps=steps, new_version=result["version"])
    return result


@app.get("/admin/registry/compare/{version_a}/{version_b}")
def registry_compare_models(version_a: str, version_b: str) -> Dict[str, Any]:
    """Compare two model versions."""
    try:
        return _model_registry.compare(version_a, version_b)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/admin/registry/models/{version}")
def registry_delete_model(
    version: str,
    api_key: str = Depends(get_admin_api_key)
) -> Dict[str, Any]:
    """Delete a model from the registry (cannot delete production models).

    Requires X-Admin-API-Key header with valid ML_ADMIN_API_KEY.
    """
    deleted = _model_registry.delete(version)
    if not deleted:
        raise HTTPException(status_code=400, detail="Cannot delete model (not found or is production)")
    return {"status": "deleted", "version": version}


# ════════════════════════════════════════════════════════════════════════════════
# PHASE 3: DRIFT DETECTION ENDPOINTS
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/admin/drift/status")
def drift_status() -> Dict[str, Any]:
    """Get drift detector status and baseline statistics."""
    detector = get_drift_detector()
    return {
        "baselines_configured": len(detector._baselines),
        "baseline_stats": detector.export_baselines(),
    }


@app.post("/admin/drift/analyze")
def drift_analyze(data: Dict[str, List[float]]) -> Dict[str, Any]:
    """
    Analyze drift for provided features.

    Request body: {"feature_name": [values...], ...}
    """
    detector = get_drift_detector()

    # Convert to numpy arrays
    current_data = {
        name: np.array(values)
        for name, values in data.items()
    }

    return detector.detect_multivariate_drift(current_data)


# ════════════════════════════════════════════════════════════════════════════════
# PHASE 3: A/B TESTING EXPERIMENT ENDPOINTS
# ════════════════════════════════════════════════════════════════════════════════

class ExperimentCreateRequest(BaseModel):
    """Request to create a new experiment."""
    name: str = Field(min_length=1, max_length=200)
    description: str = ""
    routing_strategy: str = "random"
    variants: List[Dict[str, Any]]
    metadata: Optional[Dict[str, Any]] = None


@app.post("/admin/experiments")
def experiment_create(payload: ExperimentCreateRequest) -> Dict[str, Any]:
    """Create a new A/B testing experiment."""
    try:
        experiment = _experiment_manager.create_experiment(
            name=payload.name,
            variants=payload.variants,
            routing_strategy=payload.routing_strategy,
            description=payload.description,
            metadata=payload.metadata,
        )
        return experiment.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/admin/experiments")
def experiment_list(status: Optional[str] = None) -> List[Dict[str, Any]]:
    """List all experiments."""
    from app.experiment_manager import ExperimentStatus

    status_enum = None
    if status:
        try:
            status_enum = ExperimentStatus(status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    return _experiment_manager.list_experiments(status=status_enum)


@app.get("/admin/experiments/{experiment_id}")
def experiment_get(experiment_id: str) -> Dict[str, Any]:
    """Get experiment details."""
    experiment = _experiment_manager.get_experiment(experiment_id)
    if not experiment:
        raise HTTPException(status_code=404, detail=f"Experiment {experiment_id} not found")

    metrics = _experiment_manager.get_experiment_metrics(experiment_id)

    return {
        **experiment.to_dict(),
        "metrics": metrics,
    }


@app.post("/admin/experiments/{experiment_id}/start")
def experiment_start(experiment_id: str) -> Dict[str, Any]:
    """Start an experiment."""
    try:
        experiment = _experiment_manager.start_experiment(experiment_id)
        return experiment.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/admin/experiments/{experiment_id}/pause")
def experiment_pause(experiment_id: str) -> Dict[str, Any]:
    """Pause an experiment."""
    try:
        experiment = _experiment_manager.pause_experiment(experiment_id)
        return experiment.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


class ExperimentEndRequest(BaseModel):
    """Request to end an experiment."""
    winner: Optional[str] = None
    promote_winner: bool = False


@app.post("/admin/experiments/{experiment_id}/end")
def experiment_end(experiment_id: str, payload: ExperimentEndRequest) -> Dict[str, Any]:
    """End an experiment and optionally promote winner."""
    try:
        result = _experiment_manager.end_experiment(
            experiment_id=experiment_id,
            winner=payload.winner,
            promote_winner=payload.promote_winner
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


class ExperimentTrafficRequest(BaseModel):
    """Request to update traffic allocation."""
    allocations: Dict[str, float]


@app.put("/admin/experiments/{experiment_id}/traffic")
def experiment_update_traffic(experiment_id: str, payload: ExperimentTrafficRequest) -> Dict[str, Any]:
    """Update traffic allocation for experiment variants."""
    try:
        experiment = _experiment_manager.update_traffic(
            experiment_id=experiment_id,
            variant_allocations=payload.allocations
        )
        return experiment.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/admin/experiments/{experiment_id}/analyze")
def experiment_analyze(experiment_id: str) -> Dict[str, Any]:
    """Get statistical analysis of experiment results."""
    try:
        return _experiment_manager.analyze_experiment(experiment_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ════════════════════════════════════════════════════════════════════════════════
# PHASE 3: AUTOMATED RETRAINING ENDPOINTS
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/admin/retraining/status")
def retraining_status() -> Dict[str, Any]:
    """Get retraining trigger system status."""
    trigger_system = get_trigger_system()
    if not trigger_system:
        return {"status": "not_initialized", "message": "Retraining system not initialized"}
    return trigger_system.get_status()


@app.get("/admin/retraining/events")
def retraining_events(limit: int = 50) -> List[Dict[str, Any]]:
    """Get recent retraining trigger events."""
    trigger_system = get_trigger_system()
    if not trigger_system:
        return []
    return trigger_system.get_events(limit=limit)


@app.post("/admin/retraining/trigger")
def retraining_trigger(reason: str = "Manual trigger via API") -> Dict[str, Any]:
    """Manually trigger model retraining."""
    trigger_system = get_trigger_system()
    if not trigger_system:
        raise HTTPException(status_code=503, detail="Retraining system not initialized")

    event = trigger_system.manual_trigger(reason=reason)
    return {
        "trigger_type": event.trigger_type.value,
        "reason": event.reason,
        "status": event.status.value,
        "timestamp": event.timestamp,
    }


@app.post("/admin/retraining/start")
def retraining_start_monitoring() -> Dict[str, Any]:
    """Start the background retraining monitor."""
    trigger_system = get_trigger_system()
    if not trigger_system:
        raise HTTPException(status_code=503, detail="Retraining system not initialized")

    trigger_system.start_monitoring()
    return {"status": "monitoring_started"}


@app.post("/admin/retraining/stop")
def retraining_stop_monitoring() -> Dict[str, Any]:
    """Stop the background retraining monitor."""
    trigger_system = get_trigger_system()
    if not trigger_system:
        raise HTTPException(status_code=503, detail="Retraining system not initialized")

    trigger_system.stop_monitoring()
    return {"status": "monitoring_stopped"}


# ════════════════════════════════════════════════════════════════════════════════
# MERGED FROM AI-ENGINE: WEBCAM & VIDEO PROCESSING
# ════════════════════════════════════════════════════════════════════════════════

import sqlite3
from pathlib import Path as PathlibPath
from fastapi import UploadFile, File, Form

# Initialize SQLite database for doctor cases (merged from ai-engine)
DB_PATH = PathlibPath(__file__).parent.parent / "ai-engine" / "doctor_cases.db"
UPLOAD_DIR = PathlibPath(__file__).parent.parent / "ai-engine" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def init_doctor_cases_db() -> None:
    """Initialize SQLite database for doctor cases."""
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS doctor_cases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                child_name TEXT NOT NULL,
                session_date TEXT NOT NULL,
                risk_score TEXT NOT NULL,
                metrics_json TEXT NOT NULL
            )
        """)
        conn.commit()
    finally:
        conn.close()


def save_doctor_case(child_name: str, metrics: Dict[str, Any]) -> None:
    """Save a doctor case to SQLite."""
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(
            "INSERT INTO doctor_cases (child_name, session_date, risk_score, metrics_json) VALUES (?, ?, ?, ?)",
            (
                child_name,
                datetime.utcnow().isoformat(timespec="seconds") + "Z",
                str(metrics.get("risk_score", "low")),
                json.dumps(metrics),
            ),
        )
        conn.commit()
    finally:
        conn.close()


# Initialize singletons for webcam processing (lazy loaded)
_camera_stream = None
_behavior_analyzer = None
_emotion_detector = None
_last_webcam_inference_time = 0.0
_last_webcam_metrics: Dict[str, Any] = {
    "eye_contact": 0,
    "attention_level": 0,
    "movement": 0,
    "emotion": "neutral",
    "risk_score": "low",
    "risk_value": 0,
    "policy": "Behavioral indicators only. Not a medical diagnosis.",
    "face_detected": False,
    "landmarks": [],
}


def _get_camera_stream():
    """Get or create camera stream singleton."""
    global _camera_stream
    if _camera_stream is None and cv2 is not None:
        try:
            from ai_engine.camera_stream import CameraStream
            _camera_stream = CameraStream(0)
        except Exception as e:
            logger.error("camera_init_failed", error=str(e))
    return _camera_stream


def _get_behavior_analyzer():
    """Get or create behavior analyzer singleton."""
    global _behavior_analyzer
    if _behavior_analyzer is None:
        try:
            from ai_engine.behavior_analysis import BehaviorAnalyzer
            _behavior_analyzer = BehaviorAnalyzer()
        except Exception as e:
            logger.error("behavior_analyzer_init_failed", error=str(e))
    return _behavior_analyzer


def _get_emotion_detector():
    """Get or create emotion detector singleton."""
    global _emotion_detector
    if _emotion_detector is None:
        try:
            from ai_engine.emotion_detection import EmotionDetector
            _emotion_detector = EmotionDetector(interval_sec=1.0)
        except Exception as e:
            logger.error("emotion_detector_init_failed", error=str(e))
    return _emotion_detector


def _analyze_single_frame(frame_bgr, frame_rgb) -> Dict[str, Any]:
    """Analyze a single frame for behavioral indicators."""
    behavior = _get_behavior_analyzer()
    emotion = _get_emotion_detector()

    if behavior is None:
        return {
            **_last_webcam_metrics,
            "face_detected": False,
            "landmarks": [],
            "message": "Behavior analyzer not initialized.",
        }

    face = behavior.analyze_face(frame_rgb)

    if not face["face_detected"]:
        return {
            **_last_webcam_metrics,
            "face_detected": False,
            "landmarks": [],
            "message": "No face detected in frame.",
        }

    emotion_result = emotion.analyze(frame_bgr) if emotion else {"emotion": "neutral", "confidence": 0.5}

    from ai_engine.metrics_engine import compute_behavior_metrics
    metrics = compute_behavior_metrics(
        eye_contact=face["eye_contact_score"],
        attention_level=face["attention_score"],
        movement_score=face["movement_score"],
        emotion=str(emotion_result["emotion"]),
    )

    return {
        **metrics,
        "face_detected": True,
        "landmarks": face["landmarks"],
        "bbox": face["bbox"],
        "emotion_confidence": emotion_result.get("confidence", 0.5),
        "timestamp": datetime.utcnow().isoformat(timespec="seconds") + "Z",
    }


def _process_video_file(video_path: PathlibPath) -> Dict[str, Any]:
    """Process an uploaded video file."""
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError("Unable to open uploaded video.")

    fps = cap.get(cv2.CAP_PROP_FPS)
    fps = fps if fps and fps > 0 else 24.0
    step = max(1, int(round(fps)))  # ~1 frame per second

    frames_processed = 0
    metrics_batch: List[Dict[str, Any]] = []
    frame_idx = 0

    try:
        while True:
            ok, frame_bgr = cap.read()
            if not ok:
                break

            if frame_idx % step == 0:
                frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
                result = _analyze_single_frame(frame_bgr, frame_rgb)
                metrics_batch.append(result)
                frames_processed += 1

            frame_idx += 1
    finally:
        cap.release()

    if not metrics_batch:
        raise RuntimeError("No valid frames were processed.")

    # Aggregate metrics
    def mean_of(key: str) -> int:
        vals = [float(item.get(key, 0)) for item in metrics_batch]
        return int(round(sum(vals) / max(len(vals), 1)))

    avg_eye = mean_of("eye_contact")
    avg_attention = mean_of("attention_level")
    avg_movement = mean_of("movement")

    # Dominant emotion
    emotion_votes: Dict[str, int] = {}
    for item in metrics_batch:
        emo = str(item.get("emotion", "neutral"))
        emotion_votes[emo] = emotion_votes.get(emo, 0) + 1
    dominant_emotion = max(emotion_votes, key=emotion_votes.get) if emotion_votes else "neutral"

    from ai_engine.metrics_engine import compute_behavior_metrics
    summary = compute_behavior_metrics(
        eye_contact=avg_eye,
        attention_level=avg_attention,
        movement_score=avg_movement,
        emotion=dominant_emotion,
    )

    summary.update({
        "frames_processed": frames_processed,
        "samples": metrics_batch,
    })
    return summary


@app.get("/camera/analyze-frame")
def analyze_frame_webcam() -> Dict[str, Any]:
    """
    Analyze a single frame from the webcam.

    Real-time webcam frame analysis with rate limiting (1 second interval).
    Returns eye contact, attention, movement, emotion, and risk scores.
    """
    global _last_webcam_inference_time, _last_webcam_metrics

    now = time.time()
    if now - _last_webcam_inference_time < 1.0:
        return _last_webcam_metrics

    camera = _get_camera_stream()
    if camera is None:
        raise HTTPException(status_code=503, detail="Camera not available. Check OpenCV installation and camera permissions.")

    frame_bgr, frame_rgb = camera.read_frame()
    if frame_bgr is None or frame_rgb is None:
        raise HTTPException(status_code=500, detail="Unable to capture frame from webcam.")

    result = _analyze_single_frame(frame_bgr, frame_rgb)
    _last_webcam_metrics = result
    _last_webcam_inference_time = now

    return result


@app.post("/camera/upload-video")
async def upload_video(
    video: UploadFile = File(...),
    child_name: str = Form(default="Unknown Child")
) -> Dict[str, Any]:
    """
    Upload and process a video file for batch analysis.

    Accepts multipart/form-data with a video file and optional child name.
    Processes the video at ~1 frame per second and returns aggregated metrics.
    Results are stored in SQLite for doctor review.
    """
    if not video.filename:
        raise HTTPException(status_code=400, detail="Empty filename.")

    # Save uploaded file
    timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    filename = f"{timestamp}-{video.filename}"
    safe_path = UPLOAD_DIR / filename

    content = await video.read()
    with open(safe_path, "wb") as f:
        f.write(content)

    try:
        summary = _process_video_file(safe_path)
        save_doctor_case(child_name, summary)

        return {
            "success": True,
            "child_name": child_name,
            "file": filename,
            "metrics": summary,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/doctor/cases")
def list_doctor_cases() -> List[Dict[str, Any]]:
    """
    List all doctor cases from SQLite.

    Returns cases ordered by most recent first.
    Each case includes child name, session date, risk score, and full metrics.
    """
    if not DB_PATH.exists():
        return []

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute(
            "SELECT id, child_name, session_date, risk_score, metrics_json FROM doctor_cases ORDER BY id DESC"
        ).fetchall()
    finally:
        conn.close()

    cases = []
    for row in rows:
        cases.append({
            "id": row["id"],
            "child_name": row["child_name"],
            "session_date": row["session_date"],
            "risk_score": row["risk_score"],
            "metrics": json.loads(row["metrics_json"]),
        })

    return cases


# Initialize SQLite on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database and singletons on startup."""
    init_doctor_cases_db()
    logger.info("sqlite_initialized", path=str(DB_PATH))
