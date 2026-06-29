"""
Gaze Tracking Module for Autism Screening
Uses MediaPipe Face Mesh for precise eye gaze analysis.
"""

import math
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass
import numpy as np

try:
    import cv2
    import mediapipe as mp
except ImportError:
    cv2 = None
    mp = None

# MediaPipe Face Mesh landmark indices
LEFT_IRIS = [474, 475, 476, 477]  # Left iris landmarks
RIGHT_IRIS = [468, 469, 470, 471]  # Right iris landmarks
LEFT_EYE_OUTER = 33
LEFT_EYE_INNER = 133
RIGHT_EYE_OUTER = 263
RIGHT_EYE_INNER = 362
LEFT_EYE_TOP = 159
LEFT_EYE_BOTTOM = 145
RIGHT_EYE_TOP = 386
RIGHT_EYE_BOTTOM = 374

# Face orientation landmarks
NOSE_TIP = 1
FOREHEAD = 10
CHIN = 152

@dataclass
class GazeMetrics:
    """Container for gaze analysis results."""
    gaze_score: float  # 0-100, higher = better eye contact
    attention_score: float  # 0-100, higher = more focused
    gaze_direction: str  # "center", "left", "right", "up", "down"
    blink_rate: float  # Approximate blinks per minute
    gaze_stability: float  # 0-100, consistency of gaze
    confidence: float  # Detection confidence

class GazeAnalyzer:
    """Analyzes eye gaze patterns for behavioral screening."""
    
    def __init__(self):
        self.mp_face_mesh = None
        self.face_mesh = None
        self._previous_gaze = None
        self._gaze_history = []
        self._initialized = False
        
        if mp is not None and hasattr(mp, 'solutions'):
            self._initialize_mediapipe()
    
    def _initialize_mediapipe(self):
        """Initialize MediaPipe Face Mesh with iris refinement."""
        try:
            self.mp_face_mesh = mp.solutions.face_mesh
            self.face_mesh = self.mp_face_mesh.FaceMesh(
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
            self._initialized = True
        except Exception as e:
            print(f"[GazeAnalyzer] Failed to initialize MediaPipe: {e}")
            self._initialized = False
    
    def _calculate_iris_center(self, landmarks, iris_indices: list) -> Tuple[float, float]:
        """Calculate center of iris from landmarks."""
        x_sum, y_sum = 0.0, 0.0
        for idx in iris_indices:
            x_sum += landmarks[idx].x
            y_sum += landmarks[idx].y
        return x_sum / 4, y_sum / 4
    
    def _calculate_gaze_ratio(self, landmarks, iris_center: Tuple[float, float], 
                               eye_outer: int, eye_inner: int) -> float:
        """Calculate horizontal gaze ratio (0 = left, 0.5 = center, 1 = right)."""
        outer_x = landmarks[eye_outer].x
        inner_x = landmarks[eye_inner].x
        eye_width = abs(outer_x - inner_x) + 1e-6
        
        # Normalize iris position within eye bounds
        iris_x = iris_center[0]
        ratio = (iris_x - min(outer_x, inner_x)) / eye_width
        return max(0.0, min(1.0, ratio))
    
    def _calculate_vertical_gaze(self, landmarks, iris_center: Tuple[float, float],
                                  eye_top: int, eye_bottom: int) -> float:
        """Calculate vertical gaze ratio (0 = up, 0.5 = center, 1 = down)."""
        top_y = landmarks[eye_top].y
        bottom_y = landmarks[eye_bottom].y
        eye_height = abs(bottom_y - top_y) + 1e-6
        
        iris_y = iris_center[1]
        ratio = (iris_y - top_y) / eye_height
        return max(0.0, min(1.0, ratio))
    
    def _estimate_head_pose(self, landmarks) -> Tuple[float, float, float]:
        """Estimate head pose (yaw, pitch, roll) from facial landmarks."""
        # Get key points
        nose = landmarks[NOSE_TIP]
        left_eye = landmarks[LEFT_EYE_OUTER]
        right_eye = landmarks[RIGHT_EYE_OUTER]
        forehead = landmarks[FOREHEAD]
        chin = landmarks[CHIN]
        
        # Yaw (horizontal rotation)
        eyes_center_x = (left_eye.x + right_eye.x) / 2
        yaw = (nose.x - eyes_center_x) * 100  # Approximate degrees
        
        # Pitch (vertical rotation)
        eyes_y = (left_eye.y + right_eye.y) / 2
        face_height = abs(chin.y - forehead.y) + 1e-6
        nose_ratio = (nose.y - eyes_y) / face_height
        pitch = (nose_ratio - 0.35) * 100  # Normalized around 0.35
        
        # Roll (tilt)
        roll = math.atan2(right_eye.y - left_eye.y, right_eye.x - left_eye.x)
        roll = math.degrees(roll)
        
        return yaw, pitch, roll
    
    def _determine_gaze_direction(self, h_ratio: float, v_ratio: float) -> str:
        """Determine gaze direction from horizontal and vertical ratios."""
        h_thresh = 0.15
        v_thresh = 0.15
        
        h_dir = ""
        if h_ratio < 0.5 - h_thresh:
            h_dir = "left"
        elif h_ratio > 0.5 + h_thresh:
            h_dir = "right"
        
        v_dir = ""
        if v_ratio < 0.5 - v_thresh:
            v_dir = "up"
        elif v_ratio > 0.5 + v_thresh:
            v_dir = "down"
        
        if not h_dir and not v_dir:
            return "center"
        return f"{v_dir}{h_dir}".strip() or "center"
    
    def _calculate_gaze_stability(self, current_gaze: Tuple[float, float]) -> float:
        """Calculate gaze stability based on historical consistency."""
        if not self._previous_gaze:
            self._previous_gaze = current_gaze
            return 70.0
        
        h_diff = abs(current_gaze[0] - self._previous_gaze[0])
        v_diff = abs(current_gaze[1] - self._previous_gaze[1])
        
        # Lower difference = higher stability
        stability = 100.0 - (h_diff + v_diff) * 200
        stability = max(0.0, min(100.0, stability))
        
        # Update history for trend analysis
        self._gaze_history.append((current_gaze, stability))
        if len(self._gaze_history) > 30:  # Keep last 30 samples
            self._gaze_history.pop(0)
        
        self._previous_gaze = current_gaze
        return stability
    
    def analyze(self, image: np.ndarray) -> GazeMetrics:
        """
        Analyze gaze from an image frame.
        
        Args:
            image: BGR image from OpenCV
            
        Returns:
            GazeMetrics with gaze scores and direction
        """
        default = GazeMetrics(
            gaze_score=50.0,
            attention_score=50.0,
            gaze_direction="unknown",
            blink_rate=0.0,
            gaze_stability=50.0,
            confidence=0.0
        )
        
        if not self._initialized or image is None:
            return default
        
        try:
            # Convert to RGB for MediaPipe
            if image.ndim == 2:
                image_rgb = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
            elif image.shape[2] == 4:
                image_rgb = cv2.cvtColor(image, cv2.COLOR_BGRA2RGB)
            else:
                image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            results = self.face_mesh.process(image_rgb)
            
            if not results.multi_face_landmarks:
                return default
            
            landmarks = results.multi_face_landmarks[0].landmark
            
            # Calculate iris centers
            left_iris = self._calculate_iris_center(landmarks, LEFT_IRIS)
            right_iris = self._calculate_iris_center(landmarks, RIGHT_IRIS)
            
            # Calculate gaze ratios
            left_h_gaze = self._calculate_gaze_ratio(
                landmarks, left_iris, LEFT_EYE_OUTER, LEFT_EYE_INNER
            )
            right_h_gaze = self._calculate_gaze_ratio(
                landmarks, right_iris, RIGHT_EYE_OUTER, RIGHT_EYE_INNER
            )
            
            # Vertical gaze
            left_v_gaze = self._calculate_vertical_gaze(
                landmarks, left_iris, LEFT_EYE_TOP, LEFT_EYE_BOTTOM
            )
            right_v_gaze = self._calculate_vertical_gaze(
                landmarks, right_iris, RIGHT_EYE_TOP, RIGHT_EYE_BOTTOM
            )
            
            # Average gaze ratios
            h_gaze = (left_h_gaze + right_h_gaze) / 2
            v_gaze = (left_v_gaze + right_v_gaze) / 2
            
            # Estimate head pose
            yaw, pitch, roll = self._estimate_head_pose(landmarks)
            
            # Calculate gaze score (center gaze = high score)
            h_score = 100.0 - abs(h_gaze - 0.5) * 200
            v_score = 100.0 - abs(v_gaze - 0.5) * 200
            gaze_score = (h_score + v_score) / 2
            
            # Adjust attention based on head pose
            pose_penalty = abs(yaw) * 0.5 + abs(pitch) * 0.3
            attention_score = max(0, min(100, gaze_score - pose_penalty))
            
            # Determine gaze direction
            gaze_direction = self._determine_gaze_direction(h_gaze, v_gaze)
            
            # Calculate stability
            gaze_stability = self._calculate_gaze_stability((h_gaze, v_gaze))
            
            return GazeMetrics(
                gaze_score=max(0, min(100, gaze_score)),
                attention_score=max(0, min(100, attention_score)),
                gaze_direction=gaze_direction,
                blink_rate=0.0,  # Requires temporal analysis
                gaze_stability=gaze_stability,
                confidence=85.0
            )
            
        except Exception as e:
            print(f"[GazeAnalyzer] Error analyzing frame: {e}")
            return default
    
    def reset(self):
        """Reset analyzer state for new session."""
        self._previous_gaze = None
        self._gaze_history = []


# Global instance for reuse
_gaze_analyzer: Optional[GazeAnalyzer] = None

def get_gaze_analyzer() -> GazeAnalyzer:
    """Get or create global gaze analyzer instance."""
    global _gaze_analyzer
    if _gaze_analyzer is None:
        _gaze_analyzer = GazeAnalyzer()
    return _gaze_analyzer
