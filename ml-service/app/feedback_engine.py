"""
Real-time Feedback Engine for Autism Screening
Provides immediate suggestions during screening sessions.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum
import time

class FeedbackType(Enum):
    ENCOURAGEMENT = "encouragement"
    SUGGESTION = "suggestion"
    ALERT = "alert"
    GUIDANCE = "guidance"

class FeedbackPriority(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    URGENT = 4

@dataclass
class FeedbackItem:
    """Single feedback item for the user."""
    type: FeedbackType
    priority: FeedbackPriority
    message: str
    action: Optional[str] = None
    timestamp: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type.value,
            "priority": self.priority.value,
            "message": self.message,
            "action": self.action,
            "timestamp": self.timestamp,
        }

class LiveFeedbackEngine:
    """
    Generates real-time feedback during screening sessions.
    Analyzes behavioral metrics and provides actionable suggestions.
    """
    
    # Thresholds for triggering feedback
    LOW_ATTENTION_THRESHOLD = 30.0
    HIGH_ATTENTION_THRESHOLD = 70.0
    LOW_EYE_CONTACT_THRESHOLD = 35.0
    HIGH_ENGAGEMENT_THRESHOLD = 75.0
    
    # Cooldown periods (in seconds) to prevent feedback spam
    FEEDBACK_COOLDOWN = {
        FeedbackType.ENCOURAGEMENT: 15,
        FeedbackType.SUGGESTION: 10,
        FeedbackType.ALERT: 5,
        FeedbackType.GUIDANCE: 20,
    }
    
    def __init__(self):
        self._last_feedback: Dict[FeedbackType, float] = {}
        self._session_start: float = 0
        self._frame_count: int = 0
        self._low_attention_frames: int = 0
        self._high_engagement_frames: int = 0
        
    def start_session(self):
        """Initialize a new screening session."""
        self._last_feedback = {}
        self._session_start = time.time()
        self._frame_count = 0
        self._low_attention_frames = 0
        self._high_engagement_frames = 0
    
    def analyze_frame(self, metrics: Dict[str, float]) -> Optional[FeedbackItem]:
        """
        Analyze frame metrics and generate feedback if needed.
        
        Args:
            metrics: Dict with eye_contact, attention, emotion, gesture scores
            
        Returns:
            FeedbackItem if feedback should be shown, None otherwise
        """
        self._frame_count += 1
        
        eye_contact = metrics.get("eye_contact", 50)
        attention = metrics.get("attention", 50)
        emotion = metrics.get("emotion", 50)
        gesture = metrics.get("gesture", 50)
        confidence = metrics.get("confidence", 70)
        
        # Track engagement patterns
        if attention < self.LOW_ATTENTION_THRESHOLD:
            self._low_attention_frames += 1
        if attention > self.HIGH_ENGAGEMENT_THRESHOLD and eye_contact > self.HIGH_ENGAGEMENT_THRESHOLD:
            self._high_engagement_frames += 1
        
        # Generate feedback based on current state
        
        # Check for sustained low attention
        if self._low_attention_frames > 10:
            return self._create_feedback(
                FeedbackType.SUGGESTION,
                FeedbackPriority.MEDIUM,
                "Child's attention has drifted. Try using their name or showing an interesting object.",
                "call_name"
            )
        
        # Check for good engagement
        if self._high_engagement_frames > 15:
            self._high_engagement_frames = 0  # Reset counter
            return self._create_feedback(
                FeedbackType.ENCOURAGEMENT,
                FeedbackPriority.LOW,
                "Great engagement! The child is maintaining good eye contact and attention."
            )
        
        # Low eye contact alert
        if eye_contact < self.LOW_EYE_CONTACT_THRESHOLD:
            return self._create_feedback(
                FeedbackType.GUIDANCE,
                FeedbackPriority.MEDIUM,
                "Try positioning yourself at the child's eye level to encourage eye contact.",
                "adjust_position"
            )
        
        # Positive emotional response
        if emotion > 70:
            return self._create_feedback(
                FeedbackType.ENCOURAGEMENT,
                FeedbackPriority.LOW,
                "Nice emotional expression detected! Continue the current activity."
            )
        
        # Repetitive gestures detected
        if gesture < 30 and confidence > 60:
            return self._create_feedback(
                FeedbackType.ALERT,
                FeedbackPriority.HIGH,
                "Repetitive hand movements detected. Note this observation for the session report.",
                "note_observation"
            )
        
        return None
    
    def get_session_summary(self) -> Dict[str, Any]:
        """Get summary feedback for the entire session."""
        duration = time.time() - self._session_start if self._session_start else 0
        
        return {
            "duration_seconds": round(duration, 1),
            "total_frames": self._frame_count,
            "low_attention_ratio": self._low_attention_frames / max(1, self._frame_count),
            "high_engagement_ratio": self._high_engagement_frames / max(1, self._frame_count),
            "feedback_generated": sum(1 for _ in self._last_feedback.values()),
        }
    
    def _create_feedback(
        self,
        feedback_type: FeedbackType,
        priority: FeedbackPriority,
        message: str,
        action: Optional[str] = None
    ) -> Optional[FeedbackItem]:
        """Create a feedback item if cooldown has passed."""
        current_time = time.time()
        
        # Check cooldown
        last_time = self._last_feedback.get(feedback_type, 0)
        cooldown = self.FEEDBACK_COOLDOWN.get(feedback_type, 10)
        
        if current_time - last_time < cooldown:
            return None
        
        self._last_feedback[feedback_type] = current_time
        
        return FeedbackItem(
            type=feedback_type,
            priority=priority,
            message=message,
            action=action,
            timestamp=current_time,
        )

    def reset(self):
        """Reset engine state for a new session."""
        self.start_session()


# Global instance
_feedback_engine: Optional[LiveFeedbackEngine] = None

def get_feedback_engine() -> LiveFeedbackEngine:
    """Get or create global feedback engine instance."""
    global _feedback_engine
    if _feedback_engine is None:
        _feedback_engine = LiveFeedbackEngine()
    return _feedback_engine
