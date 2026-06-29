"""
Prometheus metrics for ML service monitoring.
Tracks predictions, latency, model performance, and system health.
"""

from __future__ import annotations

import time
from typing import List

from prometheus_client import Counter, Histogram, Gauge, Info, generate_latest, CONTENT_TYPE_LATEST

# ── Prediction Metrics ──────────────────────────────────────────────────────────
PREDICTIONS_TOTAL = Counter(
    'ml_predictions_total',
    'Total number of predictions made',
    ['endpoint', 'risk_label', 'model_version']
)

PREDICTIONS_LATENCY = Histogram(
    'ml_prediction_latency_seconds',
    'Prediction latency in seconds',
    ['endpoint'],
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0]
)

PREDICTIONS_CONFIDENCE = Histogram(
    'ml_prediction_confidence',
    'Prediction confidence scores',
    ['endpoint'],
    buckets=[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
)

PREDICTIONS_RISK_SCORE = Histogram(
    'ml_prediction_risk_score',
    'Distribution of risk scores',
    ['endpoint'],
    buckets=[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
)

# ── Model Metrics ───────────────────────────────────────────────────────────────
MODEL_INFO = Info(
    'ml_model',
    'Information about the current model'
)

MODEL_AGE_SECONDS = Gauge(
    'ml_model_age_seconds',
    'Age of the current model in seconds since load'
)

MODEL_RELOADS = Counter(
    'ml_model_reloads_total',
    'Number of times the model has been reloaded',
    ['status']  # success, failure
)

MODEL_ACCURACY = Gauge(
    'ml_model_accuracy',
    'Model accuracy on test set'
)

MODEL_ROC_AUC = Gauge(
    'ml_model_roc_auc',
    'Model ROC-AUC score on test set'
)

# ── Session Metrics ─────────────────────────────────────────────────────────────
SESSIONS_ACTIVE = Gauge(
    'ml_sessions_active',
    'Number of active sessions'
)

SESSIONS_CREATED = Counter(
    'ml_sessions_created_total',
    'Total sessions created'
)

SESSIONS_EXPIRED = Counter(
    'ml_sessions_expired_total',
    'Total sessions expired and cleaned up'
)

# ── CV Processing Metrics ───────────────────────────────────────────────────────
CV_PROCESSED_FRAMES = Counter(
    'ml_cv_frames_processed_total',
    'Total frames processed by computer vision',
    ['endpoint', 'face_detected']
)

CV_PROCESSING_LATENCY = Histogram(
    'ml_cv_processing_latency_seconds',
    'Computer vision processing latency',
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5]
)

# ── Error Metrics ───────────────────────────────────────────────────────────────
ERRORS_TOTAL = Counter(
    'ml_errors_total',
    'Total number of errors',
    ['endpoint', 'error_type']
)

VALIDATION_ERRORS = Counter(
    'ml_validation_errors_total',
    'Total validation errors',
    ['field']
)

# ── Request Metrics ─────────────────────────────────────────────────────────────
REQUESTS_TOTAL = Counter(
    'ml_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)

REQUEST_LATENCY = Histogram(
    'ml_request_latency_seconds',
    'HTTP request latency',
    ['method', 'endpoint'],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)


# ── Helper Classes ──────────────────────────────────────────────────────────────
class MetricsTracker:
    """Context manager for tracking request/prediction latency."""

    def __init__(self, endpoint: str, method: str = "POST"):
        self.endpoint = endpoint
        self.method = method
        self.start_time = time.time()
        self.risk_label = None
        self.confidence = None

    def set_result(self, risk_label: str = None, confidence: float = None):
        """Set prediction result for metrics."""
        self.risk_label = risk_label
        self.confidence = confidence

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        latency = time.time() - self.start_time

        # Record latency
        REQUEST_LATENCY.labels(method=self.method, endpoint=self.endpoint).observe(latency)
        PREDICTIONS_LATENCY.labels(endpoint=self.endpoint).observe(latency)

        # Record request
        status_code = 500 if exc_type else 200
        REQUESTS_TOTAL.labels(method=self.method, endpoint=self.endpoint, status_code=status_code).inc()

        if exc_type:
            ERRORS_TOTAL.labels(endpoint=self.endpoint, error_type=exc_type.__name__).inc()

        return False  # Don't suppress exceptions


class PredictionMetrics:
    """Track metrics for a single prediction."""

    @staticmethod
    def record_prediction(
        endpoint: str,
        risk_score: int,
        risk_label: str,
        confidence: float,
        model_version: str
    ):
        """Record all metrics for a prediction."""
        PREDICTIONS_TOTAL.labels(
            endpoint=endpoint,
            risk_label=risk_label,
            model_version=model_version
        ).inc()

        PREDICTIONS_RISK_SCORE.labels(endpoint=endpoint).observe(risk_score)
        PREDICTIONS_CONFIDENCE.labels(endpoint=endpoint).observe(confidence)

    @staticmethod
    def record_cv_frame(endpoint: str, face_detected: bool, latency: float):
        """Record CV processing metrics."""
        CV_PROCESSED_FRAMES.labels(
            endpoint=endpoint,
            face_detected=str(face_detected).lower()
        ).inc()
        CV_PROCESSING_LATENCY.observe(latency)


class ModelMetrics:
    """Track model-related metrics."""

    @staticmethod
    def set_model_info(version: str, accuracy: float = None, roc_auc: float = None):
        """Update model info gauge."""
        MODEL_INFO.info({
            'version': version,
            'accuracy': str(accuracy) if accuracy else 'unknown',
            'roc_auc': str(roc_auc) if roc_auc else 'unknown',
        })

        if accuracy is not None:
            MODEL_ACCURACY.set(accuracy)
        if roc_auc is not None:
            MODEL_ROC_AUC.set(roc_auc)

    @staticmethod
    def update_model_age(load_time: float):
        """Update model age gauge."""
        MODEL_AGE_SECONDS.set(time.time() - load_time)

    @staticmethod
    def record_reload(status: str):
        """Record model reload attempt."""
        MODEL_RELOADS.labels(status=status).inc()


class SessionMetrics:
    """Track session metrics."""

    @staticmethod
    def set_active_count(count: int):
        """Update active sessions gauge."""
        SESSIONS_ACTIVE.set(count)

    @staticmethod
    def record_created():
        """Record new session."""
        SESSIONS_CREATED.inc()

    @staticmethod
    def record_expired(count: int = 1):
        """Record expired sessions."""
        SESSIONS_EXPIRED.inc(count)


def get_metrics() -> bytes:
    """Generate Prometheus metrics output."""
    return generate_latest()


def get_content_type() -> str:
    """Get Prometheus metrics content type."""
    return CONTENT_TYPE_LATEST
