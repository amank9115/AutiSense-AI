from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import mediapipe as mp
import numpy as np


LEFT_EYE = [33, 133, 159, 145]
RIGHT_EYE = [362, 263, 386, 374]
NOSE_TIP = 1


@dataclass
class FaceState:
    center_x: float
    center_y: float


class BehaviorAnalyzer:
    """Face + landmark + gaze/attention estimation using MediaPipe."""

    def __init__(self) -> None:
        self.face_detection = mp.solutions.face_detection.FaceDetection(
            model_selection=0,
            min_detection_confidence=0.5,
        )
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self.previous_state: Optional[FaceState] = None

    @staticmethod
    def _to_px(landmark, width: int, height: int) -> Tuple[float, float]:
        return float(landmark.x * width), float(landmark.y * height)

    def analyze_face(self, frame_rgb) -> Dict:
        height, width, _ = frame_rgb.shape

        detection_result = self.face_detection.process(frame_rgb)
        mesh_result = self.face_mesh.process(frame_rgb)

        face_detected = bool(
            detection_result.detections and mesh_result.multi_face_landmarks
        )
        if not face_detected:
            self.previous_state = None
            return {
                "face_detected": False,
                "landmarks": [],
                "bbox": None,
                "eye_contact_score": 0,
                "attention_score": 0,
                "movement_score": 0,
            }

        detection = detection_result.detections[0]
        bbox = detection.location_data.relative_bounding_box
        x = max(0, int(bbox.xmin * width))
        y = max(0, int(bbox.ymin * height))
        w = max(1, int(bbox.width * width))
        h = max(1, int(bbox.height * height))

        face_landmarks = mesh_result.multi_face_landmarks[0].landmark
        points: List[Dict[str, float]] = []
        for idx in range(len(face_landmarks)):
            px, py = self._to_px(face_landmarks[idx], width, height)
            points.append({"id": idx, "x": round(px, 2), "y": round(py, 2)})

        eye_contact = self.estimate_eye_contact(face_landmarks, width, height)
        attention = self.estimate_attention((x, y, w, h), eye_contact, width, height)
        movement = self.estimate_movement((x, y, w, h), width, height)

        return {
            "face_detected": True,
            "landmarks": points,
            "bbox": {"x": x, "y": y, "width": w, "height": h},
            "eye_contact_score": int(round(eye_contact)),
            "attention_score": int(round(attention)),
            "movement_score": int(round(movement)),
        }

    def estimate_eye_contact(self, landmarks, width: int, height: int) -> float:
        left = np.array([self._to_px(landmarks[idx], width, height) for idx in LEFT_EYE])
        right = np.array([self._to_px(landmarks[idx], width, height) for idx in RIGHT_EYE])
        nose = np.array(self._to_px(landmarks[NOSE_TIP], width, height))

        left_center = left.mean(axis=0)
        right_center = right.mean(axis=0)
        eye_center = (left_center + right_center) / 2.0

        dx = abs(nose[0] - eye_center[0]) / max(width, 1)
        dy = abs(nose[1] - eye_center[1]) / max(height, 1)

        # Lower offset generally means child is facing camera.
        score = 100.0 - (dx * 260.0 + dy * 180.0)
        return float(np.clip(score, 0, 100))

    def estimate_attention(self, bbox: Tuple[int, int, int, int], eye_contact: float, width: int, height: int) -> float:
        x, y, w, h = bbox
        cx = x + w / 2.0
        cy = y + h / 2.0

        nx = abs(cx - width / 2.0) / max(width / 2.0, 1)
        ny = abs(cy - height / 2.0) / max(height / 2.0, 1)
        centered = 100.0 - (nx * 70.0 + ny * 30.0)

        # Fuse with eye contact for final attention.
        attention = 0.65 * centered + 0.35 * eye_contact
        return float(np.clip(attention, 0, 100))

    def estimate_movement(self, bbox: Tuple[int, int, int, int], width: int, height: int) -> float:
        x, y, w, h = bbox
        cx = (x + w / 2.0) / max(width, 1)
        cy = (y + h / 2.0) / max(height, 1)
        current = FaceState(center_x=cx, center_y=cy)

        if not self.previous_state:
            self.previous_state = current
            return 0.0

        dx = abs(current.center_x - self.previous_state.center_x)
        dy = abs(current.center_y - self.previous_state.center_y)
        self.previous_state = current

        movement = (dx + dy) * 500.0
        return float(np.clip(movement, 0, 100))
