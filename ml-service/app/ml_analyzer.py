import math
from typing import Dict, Any
import numpy as np

try:
    import cv2
    import mediapipe as mp
except ImportError:
    cv2 = None
    mp = None

if mp is not None and hasattr(mp, 'solutions'):
    mp_face_mesh = mp.solutions.face_mesh
    mp_hands = mp.solutions.hands
    
    # Initialize MediaPipe models once and reuse them
    face_mesh = mp_face_mesh.FaceMesh(
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    hands = mp_hands.Hands(
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
else:
    face_mesh = None
    hands = None


def clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return float(max(low, min(high, value)))

def calculate_distance(p1, p2) -> float:
    return math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2 + getattr(p1, 'z', 0)**2 - getattr(p2, 'z', 0)**2)

def analyze_frame(image: np.ndarray, frame_data: Dict[str, Any]) -> Dict[str, float]:
    """
    Analyzes an OpenCV image using Google MediaPipe to extract behavioral features.
    Fallback to the basic heuristics provided by `frame_data` if CV is unavailable or faces/hands aren't detected.
    """
    default_scores = {
        "eye": frame_data.get("eye_contact", 0.0),
        "attention": frame_data.get("attention_span", 0.0),
        "emotion": frame_data.get("emotion_signals", 0.0),
        "gesture": frame_data.get("gesture_analysis", 0.0),
        "confidence": frame_data.get("confidence", 70.0)
    }

    if cv2 is None or mp is None or image is None or face_mesh is None or hands is None:
        return default_scores

    h, w = image.shape[:2]
    # MediaPipe requires RGB images
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # 1. Process Face Mesh for Head Pose, Eye Contact, and Emotion
    face_results = face_mesh.process(image_rgb)
    
    # 2. Process Hands for Gesture / Stimming Analysis
    hand_results = hands.process(image_rgb)
    
    eye_score = 0.0
    attention_score = 0.0
    emotion_score = 0.0
    gesture_score = default_scores["gesture"]  # Start with heuristic
    cv_confidence = 0.0
    
    has_face = face_results.multi_face_landmarks is not None
    has_hands = hand_results.multi_hand_landmarks is not None
    
    if has_face:
        landmarks = face_results.multi_face_landmarks[0].landmark
        
        # --- 1A. ATTENTION SPAN (Head Pose Estimation) ---
        # A simple estimation of yaw and pitch using 2D projection of nose, chin, and eyes.
        nose = landmarks[1]
        left_eye_outer = landmarks[33]
        right_eye_outer = landmarks[263]
        chin = landmarks[152]
        
        # Calculate horizontal center of eyes
        eyes_center_x = (left_eye_outer.x + right_eye_outer.x) / 2.0
        
        # Yaw estimation: How aligned is the nose with the center of the eyes horizontally?
        yaw_offset = abs(nose.x - eyes_center_x)
        # Pitch estimation: Is the nose vertically aligned roughly correctly between eyes and chin?
        eyes_chin_dist = abs(chin.y - (left_eye_outer.y + right_eye_outer.y)/2)
        nose_eyes_dist = abs(nose.y - (left_eye_outer.y + right_eye_outer.y)/2)
        pitch_ratio = nose_eyes_dist / (eyes_chin_dist + 1e-6)
        
        # Ideal pitch ratio looking straight is roughly 0.4.
        pitch_offset = abs(pitch_ratio - 0.4)
        
        # Higher offset means looking away -> lower attention
        attention_score = clamp(100.0 - (yaw_offset * 1000.0 + pitch_offset * 200.0))
        
        
        # --- 1B. EYE CONTACT (Iris Tracking) ---
        # Mediapipe Face Mesh with refine_landmarks=True gives us accurate Iris tracking.
        # Left Iris: 474-477, Right Iris: 469-472
        # We can approximate gaze by comparing iris center to eye bounding box.
        left_iris = landmarks[473] # Center point
        right_iris = landmarks[468] # Center point
        
        # Left Eye bounds horizontally: 33 (outer), 133 (inner)
        left_eye_inner = landmarks[133]
        left_eye_width = abs(left_eye_outer.x - left_eye_inner.x) + 1e-6
        left_iris_ratio = (left_iris.x - left_eye_outer.x) / left_eye_width
        
        # Right Eye bounds horizontally: 362 (inner), 263 (outer)
        right_eye_inner = landmarks[362]
        right_eye_width = abs(right_eye_outer.x - right_eye_inner.x) + 1e-6
        # Note: Right eye outer is typically > inner in x coordinate
        right_iris_ratio = (right_eye_outer.x - right_iris.x) / right_eye_width
        
        # Ideal ratio is roughly 0.5 (iris in center of eye)
        avg_iris_ratio = (left_iris_ratio + right_iris_ratio) / 2.0
        gaze_offset = abs(avg_iris_ratio - 0.5)
        
        # If head is turned away (low attention), eye contact should also naturally drop
        # Combine base attention with gaze offset
        base_eye_score = clamp(100.0 - (gaze_offset * 300.0))
        eye_score = clamp((base_eye_score * 0.7) + (attention_score * 0.3))
        
        
        # --- 1C. EMOTION SIGNALS (Basic Facial Expressions) ---
        # Calculate mouth aspect ratio (MAR) and eye aspect ratio (EAR) as simple heuristics for engagement/expression
        mouth_top = landmarks[13]
        mouth_bottom = landmarks[14]
        mouth_left = landmarks[78]
        mouth_right = landmarks[308]
        
        mouth_width = calculate_distance(mouth_left, mouth_right)
        mouth_height = calculate_distance(mouth_top, mouth_bottom)
        mar = mouth_height / (mouth_width + 1e-6)
        
        # A neutral expression has a low MAR. High MAR = smiling, talking, or laughing (positive signals).
        # We map higher MAR loosely to higher expression/emotion signaling.
        # Autism screening often looks for flattened affect.
        expression_factor = clamp(mar * 300.0) 
        emotion_score = clamp(40.0 + expression_factor) # Base emotion of 40, boosted by expressions
        
        cv_confidence = 85.0
    else:
        # Fallback if no face is detected but image exists
        eye_score = default_scores["eye"] * 0.5
        attention_score = default_scores["attention"] * 0.5
        emotion_score = default_scores["emotion"] * 0.5
        cv_confidence = 30.0

    # --- 2. GESTURE ANALYSIS (Hand Tracking for Stimming) ---
    if has_hands and has_face:
        # Check if hands are near the face or acting repetitively (simplified as presence near face)
        face_center_y = (landmarks[10].y + landmarks[152].y) / 2.0 # Top of head + chin
        
        hand_near_face_count = 0
        for hand_lms in hand_results.multi_hand_landmarks:
            wrist = hand_lms.landmark[mp_hands.HandLandmark.WRIST]
            
            # If wrist is roughly vertically near or above the chin level
            if wrist.y < landmarks[152].y + 0.1:
                hand_near_face_count += 1
                
        if hand_near_face_count > 0:
             # Atypical repetitive hand movements (stimming) might be flagged by hand presence near face frequently
             # We inverse the score: high score = standard behavior, low score = potential autistic trait (stimming)
             gesture_score = clamp(default_scores["gesture"] * 0.6)
        else:
             gesture_score = clamp(default_scores["gesture"] * 1.1)
             
    elif has_hands:
        gesture_score = default_scores["gesture"]
        
    return {
        "eye": eye_score,
        "attention": attention_score,
        "emotion": emotion_score,
        "gesture": gesture_score,
        "confidence": clamp((default_scores["confidence"] * 0.3) + (cv_confidence * 0.7))
    }
