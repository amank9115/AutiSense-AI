"""
Automated Retraining Triggers for ML Service.

Monitors model health and triggers retraining when conditions are met:
- Time-based: Model age exceeds threshold
- Performance-based: Drift detected or accuracy degraded
- Volume-based: Prediction count exceeds threshold
- Manual: Admin-initiated retraining

Features:
- Configurable thresholds
- Throttling to prevent excessive retraining
- Webhook notifications
- Integration with drift detector and model registry
"""

from __future__ import annotations

import json
import os
import subprocess
import threading
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

import structlog

logger = structlog.get_logger()


class TriggerType(str, Enum):
    """Types of retraining triggers."""
    TIME_BASED = "time_based"
    PERFORMANCE_BASED = "performance_based"
    VOLUME_BASED = "volume_based"
    DRIFT_BASED = "drift_based"
    MANUAL = "manual"


class TriggerStatus(str, Enum):
    """Status of a trigger event."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    THROTTLED = "throttled"


@dataclass
class TriggerConfig:
    """Configuration for retraining triggers."""
    # Time-based triggers
    max_model_age_days: int = 30
    check_interval_hours: int = 6

    # Performance-based triggers
    min_accuracy: float = 0.80
    min_roc_auc: float = 0.85
    max_drift_severity: str = "medium"  # none, low, medium, high

    # Volume-based triggers
    max_predictions_before_retrain: int = 10000

    # Throttling
    min_retrain_interval_hours: int = 24
    max_retrains_per_week: int = 3

    # Notifications
    webhook_url: Optional[str] = None
    webhook_headers: Dict[str, str] = field(default_factory=dict)

    # Training script
    training_script_path: str = "train_model.py"
    training_timeout_minutes: int = 60


@dataclass
class TriggerEvent:
    """Represents a retraining trigger event."""
    trigger_type: TriggerType
    reason: str
    status: TriggerStatus
    timestamp: str
    details: Dict[str, Any] = field(default_factory=dict)
    training_run_id: Optional[str] = None
    error: Optional[str] = None


class RetrainingTriggerSystem:
    """
    Automated retraining trigger system.

    Monitors model health and triggers retraining when configured thresholds
    are exceeded.
    """

    def __init__(
        self,
        config: TriggerConfig,
        model_registry,
        drift_detector,
        prediction_history,
    ):
        self.config = config
        self.registry = model_registry
        self.drift_detector = drift_detector
        self.prediction_history = prediction_history

        self._events: List[TriggerEvent] = []
        self._training_in_progress = False
        self._training_lock = threading.Lock()
        self._last_retrain_time: Optional[datetime] = None
        self._retrain_count_this_week = 0
        self._week_start = datetime.now()

        # Background monitoring thread
        self._monitor_thread: Optional[threading.Thread] = None
        self._stop_monitoring = threading.Event()

    def _validate_script_path(self, script_path: str) -> str:
        """Validate and resolve training script path to prevent command injection.

        Ensures:
        - Path contains no shell metacharacters
        - Path resolves to a file within the application directory
        - File has .py extension
        - File exists and is readable

        Raises:
            ValueError: If path is invalid or potentially malicious
        """
        # Check for shell metacharacters that could enable injection
        dangerous_chars = {'$', '`', ';', '|', '&', '>', '<', '\n', '\r', '(', ')'}
        if any(char in script_path for char in dangerous_chars):
            raise ValueError(f"Invalid script path: contains dangerous characters")

        # Check for path traversal attempts
        if '..' in script_path or script_path.startswith(('/', '\\')):
            raise ValueError(f"Invalid script path: path traversal not allowed")

        # Only allow .py files
        if not script_path.endswith('.py'):
            raise ValueError(f"Invalid script path: only .py files allowed")

        # Resolve to absolute path within the application directory
        app_dir = Path(__file__).parent.resolve()
        resolved_path = (app_dir / script_path).resolve()

        # Ensure resolved path is within application directory
        try:
            resolved_path.relative_to(app_dir)
        except ValueError:
            raise ValueError(f"Invalid script path: must be within application directory")

        # Check file exists
        if not resolved_path.is_file():
            raise ValueError(f"Script not found: {script_path}")

        return str(resolved_path)

    def start_monitoring(self) -> None:
        """Start background monitoring thread."""
        if self._monitor_thread and self._monitor_thread.is_alive():
            logger.warning("monitoring_already_running")
            return

        self._stop_monitoring.clear()
        self._monitor_thread = threading.Thread(
            target=self._monitoring_loop,
            daemon=True
        )
        self._monitor_thread.start()

        logger.info("retraining_monitoring_started",
            check_interval_hours=self.config.check_interval_hours
        )

    def stop_monitoring(self) -> None:
        """Stop background monitoring thread."""
        self._stop_monitoring.set()
        if self._monitor_thread:
            self._monitor_thread.join(timeout=5)
        logger.info("retraining_monitoring_stopped")

    def _monitoring_loop(self) -> None:
        """Background loop that checks triggers periodically."""
        while not self._stop_monitoring.is_set():
            try:
                self.check_triggers()
            except Exception as e:
                logger.error("trigger_check_failed", error=str(e))

            # Sleep for check interval
            self._stop_monitoring.wait(
                self.config.check_interval_hours * 3600
            )

    def check_triggers(self) -> List[TriggerEvent]:
        """
        Check all trigger conditions.

        Returns:
            List of trigger events that fired
        """
        events = []

        # Check time-based trigger
        time_event = self._check_time_based_trigger()
        if time_event:
            events.append(time_event)

        # Check performance-based trigger
        perf_event = self._check_performance_trigger()
        if perf_event:
            events.append(perf_event)

        # Check volume-based trigger
        volume_event = self._check_volume_trigger()
        if volume_event:
            events.append(volume_event)

        # Check drift-based trigger
        drift_event = self._check_drift_trigger()
        if drift_event:
            events.append(drift_event)

        # Process events (trigger retraining if any fired)
        for event in events:
            self._process_trigger_event(event)

        return events

    def _check_time_based_trigger(self) -> Optional[TriggerEvent]:
        """Check if model age exceeds threshold."""
        prod_model = self.registry.get_production()

        if not prod_model:
            return None

        registered_at = prod_model.get("registered_at")
        if not registered_at:
            return None

        model_age = datetime.now() - datetime.fromisoformat(registered_at)
        age_days = model_age.days

        if age_days > self.config.max_model_age_days:
            return TriggerEvent(
                trigger_type=TriggerType.TIME_BASED,
                reason=f"Model age ({age_days} days) exceeds threshold ({self.config.max_model_age_days} days)",
                status=TriggerStatus.PENDING,
                timestamp=datetime.now().isoformat(),
                details={
                    "model_age_days": age_days,
                    "threshold_days": self.config.max_model_age_days,
                    "model_version": prod_model["version"],
                }
            )

        return None

    def _check_performance_trigger(self) -> Optional[TriggerEvent]:
        """Check if model performance has degraded."""
        prod_model = self.registry.get_production()

        if not prod_model:
            return None

        metadata = prod_model.get("metadata", {})
        accuracy = metadata.get("accuracy", 1.0)
        roc_auc = metadata.get("roc_auc", 1.0)

        reasons = []

        if accuracy < self.config.min_accuracy:
            reasons.append(
                f"Accuracy ({accuracy:.2%}) below threshold ({self.config.min_accuracy:.2%})"
            )

        if roc_auc < self.config.min_roc_auc:
            reasons.append(
                f"ROC-AUC ({roc_auc:.3f}) below threshold ({self.config.min_roc_auc:.3f})"
            )

        if reasons:
            return TriggerEvent(
                trigger_type=TriggerType.PERFORMANCE_BASED,
                reason="; ".join(reasons),
                status=TriggerStatus.PENDING,
                timestamp=datetime.now().isoformat(),
                details={
                    "accuracy": accuracy,
                    "roc_auc": roc_auc,
                    "accuracy_threshold": self.config.min_accuracy,
                    "roc_auc_threshold": self.config.min_roc_auc,
                    "model_version": prod_model["version"],
                }
            )

        return None

    def _check_volume_trigger(self) -> Optional[TriggerEvent]:
        """Check if prediction volume exceeds threshold."""
        prod_model = self.registry.get_production()

        if not prod_model:
            return None

        prediction_count = prod_model.get("prediction_count", 0)

        if prediction_count > self.config.max_predictions_before_retrain:
            return TriggerEvent(
                trigger_type=TriggerType.VOLUME_BASED,
                reason=f"Prediction count ({prediction_count}) exceeds threshold ({self.config.max_predictions_before_retrain})",
                status=TriggerStatus.PENDING,
                timestamp=datetime.now().isoformat(),
                details={
                    "prediction_count": prediction_count,
                    "threshold": self.config.max_predictions_before_retrain,
                    "model_version": prod_model["version"],
                }
            )

        return None

    def _check_drift_trigger(self) -> Optional[TriggerEvent]:
        """Check if drift has been detected."""
        # Get drift analysis from prediction history
        drift_analysis = self.prediction_history.detect_drift()

        if not drift_analysis.get("drift_detected"):
            return None

        # Check severity threshold
        drift_indicators = drift_analysis.get("drift_indicators", [])
        severity_order = ["none", "low", "medium", "high", "critical"]
        max_severity_idx = severity_order.index(self.config.max_drift_severity)

        for indicator in drift_indicators:
            # If any indicator severity exceeds threshold, trigger
            if indicator in ["low", "medium", "high", "critical"]:
                indicator_idx = severity_order.index(indicator)
                if indicator_idx >= max_severity_idx:
                    return TriggerEvent(
                        trigger_type=TriggerType.DRIFT_BASED,
                        reason=f"Drift detected with severity {indicator}",
                        status=TriggerStatus.PENDING,
                        timestamp=datetime.now().isoformat(),
                        details={
                            "drift_indicators": drift_indicators,
                            "warnings": drift_analysis.get("warnings", []),
                        }
                    )

        return None

    def _process_trigger_event(self, event: TriggerEvent) -> None:
        """Process a trigger event (throttle check, initiate training)."""
        # Check throttling
        if not self._can_retrain():
            event.status = TriggerStatus.THROTTLED
            self._events.append(event)
            logger.warning("retraining_throttled",
                trigger_type=event.trigger_type.value,
                reason=event.reason
            )
            return

        # Check if training already in progress
        with self._training_lock:
            if self._training_in_progress:
                event.status = TriggerStatus.THROTTLED
                self._events.append(event)
                logger.warning("training_already_in_progress")
                return

            self._training_in_progress = True

        # Initiate training
        self._trigger_training(event)

    def _can_retrain(self) -> bool:
        """Check if retraining is allowed (throttling)."""
        now = datetime.now()

        # Check minimum interval
        if self._last_retrain_time:
            elapsed = now - self._last_retrain_time
            if elapsed < timedelta(hours=self.config.min_retrain_interval_hours):
                return False

        # Check weekly limit
        week_ago = now - timedelta(days=7)
        if self._week_start < week_ago:
            # Reset weekly counter
            self._week_start = now
            self._retrain_count_this_week = 0

        if self._retrain_count_this_week >= self.config.max_retrains_per_week:
            return False

        return True

    def _trigger_training(self, event: TriggerEvent) -> None:
        """Execute training pipeline."""
        event.status = TriggerStatus.RUNNING
        self._events.append(event)

        logger.info("retraining_triggered",
            trigger_type=event.trigger_type.value,
            reason=event.reason
        )

        try:
            # Run training script with path validation to prevent command injection
            script_path = self._validate_script_path(self.config.training_script_path)
            result = subprocess.run(
                ["python", script_path],
                capture_output=True,
                text=True,
                timeout=self.config.training_timeout_minutes * 60,
                cwd=os.path.dirname(__file__)
            )

            if result.returncode == 0:
                event.status = TriggerStatus.COMPLETED
                self._last_retrain_time = datetime.now()
                self._retrain_count_this_week += 1

                logger.info("retraining_completed",
                    trigger_type=event.trigger_type.value
                )

                # Send notification
                self._send_notification(event)

            else:
                event.status = TriggerStatus.FAILED
                event.error = result.stderr

                logger.error("retraining_failed",
                    trigger_type=event.trigger_type.value,
                    error=result.stderr
                )

        except subprocess.TimeoutExpired:
            event.status = TriggerStatus.FAILED
            event.error = f"Training timed out after {self.config.training_timeout_minutes} minutes"

            logger.error("retraining_timeout",
                trigger_type=event.trigger_type.value
            )

        except Exception as e:
            event.status = TriggerStatus.FAILED
            event.error = str(e)

            logger.error("retraining_error",
                trigger_type=event.trigger_type.value,
                error=str(e)
            )

        finally:
            with self._training_lock:
                self._training_in_progress = False

    def manual_trigger(self, reason: str = "Manual trigger") -> TriggerEvent:
        """
        Manually trigger retraining.

        Args:
            reason: Reason for manual trigger

        Returns:
            Trigger event
        """
        event = TriggerEvent(
            trigger_type=TriggerType.MANUAL,
            reason=reason,
            status=TriggerStatus.PENDING,
            timestamp=datetime.now().isoformat(),
            details={"manual": True}
        )

        self._process_trigger_event(event)

        return event

    def _send_notification(self, event: TriggerEvent) -> None:
        """Send webhook notification."""
        if not self.config.webhook_url:
            return

        try:
            import requests

            payload = {
                "event_type": "retraining_completed",
                "trigger_type": event.trigger_type.value,
                "reason": event.reason,
                "timestamp": event.timestamp,
                "status": event.status.value,
            }

            requests.post(
                self.config.webhook_url,
                json=payload,
                headers=self.config.webhook_headers,
                timeout=10
            )

            logger.info("notification_sent", webhook_url=self.config.webhook_url)

        except Exception as e:
            logger.error("notification_failed", error=str(e))

    def get_events(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent trigger events."""
        events = self._events[-limit:]
        return [
            {
                "trigger_type": e.trigger_type.value,
                "reason": e.reason,
                "status": e.status.value,
                "timestamp": e.timestamp,
                "details": e.details,
                "error": e.error,
            }
            for e in events
        ]

    def get_status(self) -> Dict[str, Any]:
        """Get current status of the trigger system."""
        return {
            "monitoring_active": self._monitor_thread.is_alive() if self._monitor_thread else False,
            "training_in_progress": self._training_in_progress,
            "last_retrain": self._last_retrain_time.isoformat() if self._last_retrain_time else None,
            "retrains_this_week": self._retrain_count_this_week,
            "total_events": len(self._events),
            "config": {
                "max_model_age_days": self.config.max_model_age_days,
                "min_accuracy": self.config.min_accuracy,
                "min_roc_auc": self.config.min_roc_auc,
                "max_predictions": self.config.max_predictions_before_retrain,
                "min_retrain_interval_hours": self.config.min_retrain_interval_hours,
            }
        }


# Global trigger system instance
_trigger_system: Optional[RetrainingTriggerSystem] = None


def get_trigger_system() -> Optional[RetrainingTriggerSystem]:
    """Get the global trigger system instance."""
    return _trigger_system


def initialize_trigger_system(
    config: TriggerConfig,
    model_registry,
    drift_detector,
    prediction_history,
) -> RetrainingTriggerSystem:
    """
    Initialize the global trigger system.

    Args:
        config: Trigger configuration
        model_registry: Model registry instance
        drift_detector: Drift detector instance
        prediction_history: Prediction history tracker

    Returns:
        Initialized trigger system
    """
    global _trigger_system

    _trigger_system = RetrainingTriggerSystem(
        config=config,
        model_registry=model_registry,
        drift_detector=drift_detector,
        prediction_history=prediction_history,
    )

    logger.info("trigger_system_initialized")

    return _trigger_system
