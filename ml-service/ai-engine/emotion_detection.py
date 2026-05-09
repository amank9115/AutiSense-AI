from __future__ import annotations

import time
from typing import Dict, Optional


class EmotionDetector:
    """DeepFace wrapper with fallback if dependency/model is unavailable."""

    def __init__(self, interval_sec: float = 1.5) -> None:
        self.interval_sec = interval_sec
        self.last_run = 0.0
        self.last_result: Dict[str, object] = {"emotion": "neutral", "confidence": 0.5}

        try:
            from deepface import DeepFace  # type: ignore

            self._deepface = DeepFace
            self.enabled = True
        except Exception:
            self._deepface = None
            self.enabled = False

    def analyze(self, frame_bgr) -> Dict[str, object]:
        now = time.time()
        if now - self.last_run < self.interval_sec:
            return self.last_result

        self.last_run = now

        if not self.enabled:
            self.last_result = {"emotion": "neutral", "confidence": 0.45}
            return self.last_result

        try:
            result = self._deepface.analyze(
                img_path=frame_bgr,
                actions=["emotion"],
                enforce_detection=False,
                detector_backend="opencv",
                silent=True,
            )
            item = result[0] if isinstance(result, list) else result
            dominant = str(item.get("dominant_emotion", "neutral"))
            emotions = item.get("emotion", {}) or {}
            confidence = float(emotions.get(dominant, 0.0)) / 100.0
            self.last_result = {
                "emotion": dominant,
                "confidence": round(max(0.0, min(1.0, confidence)), 3),
            }
            return self.last_result
        except Exception:
            self.last_result = {"emotion": "neutral", "confidence": 0.4}
            return self.last_result
