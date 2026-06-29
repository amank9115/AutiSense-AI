"""
Adaptive Screening Protocols
Dynamically adjusts screening modules based on child's responses.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum
import random

class ModuleType(Enum):
    CALIBRATION = "calibration"
    EYE_CONTACT = "eye_contact"
    JOINT_ATTENTION = "joint_attention"
    NAME_RESPONSE = "name_response"
    FACIAL_EXPRESSION = "facial_expression"
    EMOTION_RECOGNITION = "emotion_recognition"
    GESTURE_ANALYSIS = "gesture_analysis"

class DifficultyLevel(Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

@dataclass
class ScreeningModule:
    """A single screening module with configurable parameters."""
    id: str
    type: ModuleType
    name: str
    description: str
    duration_seconds: int
    difficulty: DifficultyLevel
    required: bool
    dependencies: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type.value,
            "name": self.name,
            "description": self.description,
            "duration_seconds": self.duration_seconds,
            "difficulty": self.difficulty.value,
            "required": self.required,
            "dependencies": self.dependencies,
        }

# Base module definitions
BASE_MODULES: List[ScreeningModule] = [
    ScreeningModule(
        id="calibration",
        type=ModuleType.CALIBRATION,
        name="Camera Calibration",
        description="Position the child comfortably in front of the camera",
        duration_seconds=5,
        difficulty=DifficultyLevel.EASY,
        required=True,
        dependencies=[],
    ),
    ScreeningModule(
        id="eye_contact_basic",
        type=ModuleType.EYE_CONTACT,
        name="Eye Contact Assessment",
        description="Observe natural eye contact patterns",
        duration_seconds=10,
        difficulty=DifficultyLevel.EASY,
        required=True,
        dependencies=["calibration"],
    ),
    ScreeningModule(
        id="joint_attention",
        type=ModuleType.JOINT_ATTENTION,
        name="Joint Attention Test",
        description="Point to objects and observe if child follows",
        duration_seconds=10,
        difficulty=DifficultyLevel.MEDIUM,
        required=True,
        dependencies=["calibration"],
    ),
    ScreeningModule(
        id="name_response",
        type=ModuleType.NAME_RESPONSE,
        name="Name Response Test",
        description="Call the child's name and observe response",
        duration_seconds=10,
        difficulty=DifficultyLevel.EASY,
        required=True,
        dependencies=["calibration"],
    ),
    ScreeningModule(
        id="facial_expression",
        type=ModuleType.FACIAL_EXPRESSION,
        name="Expression Response",
        description="Make facial expressions and observe response",
        duration_seconds=10,
        difficulty=DifficultyLevel.MEDIUM,
        required=False,
        dependencies=["eye_contact_basic"],
    ),
    ScreeningModule(
        id="emotion_advanced",
        type=ModuleType.EMOTION_RECOGNITION,
        name="Advanced Emotion Test",
        description="Extended emotion recognition assessment",
        duration_seconds=15,
        difficulty=DifficultyLevel.HARD,
        required=False,
        dependencies=["facial_expression"],
    ),
    ScreeningModule(
        id="gesture_repeat",
        type=ModuleType.GESTURE_ANALYSIS,
        name="Gesture Observation",
        description="Monitor for repetitive gestures or stimming",
        duration_seconds=15,
        difficulty=DifficultyLevel.MEDIUM,
        required=False,
        dependencies=["calibration"],
    ),
]

class AdaptiveProtocolEngine:
    """
    Manages adaptive screening protocols.
    Selects and orders modules based on child's real-time responses.
    """
    
    def __init__(self, base_modules: List[ScreeningModule] = None):
        self.all_modules = base_modules or BASE_MODULES
        self._completed_modules: List[str] = []
        self._current_metrics: Dict[str, float] = {}
        self._module_history: List[Dict[str, Any]] = []
        
    def get_initial_protocol(self) -> List[ScreeningModule]:
        """Get the initial screening protocol (required modules only)."""
        return [m for m in self.all_modules if m.required]
    
    def get_next_module(
        self,
        current_metrics: Dict[str, float],
        completed_module_id: str
    ) -> Optional[ScreeningModule]:
        """
        Determine the next module based on current performance.
        
        Args:
            current_metrics: Current behavioral metrics (eye_contact, attention, etc.)
            completed_module_id: ID of the just-completed module
            
        Returns:
            Next module to run, or None if screening is complete
        """
        self._completed_modules.append(completed_module_id)
        self._current_metrics = current_metrics
        
        # Record module completion
        self._module_history.append({
            "module_id": completed_module_id,
            "metrics": current_metrics.copy(),
        })
        
        # Get remaining modules
        remaining = [
            m for m in self.all_modules
            if m.id not in self._completed_modules
            and all(d in self._completed_modules for d in m.dependencies)
        ]
        
        if not remaining:
            return None
        
        # Adaptive selection based on metrics
        attention = current_metrics.get("attention", 50)
        eye_contact = current_metrics.get("eye_contact", 50)
        emotion = current_metrics.get("emotion", 50)
        
        # If attention is low, prioritize shorter/easier modules
        if attention < 40:
            easy_modules = [m for m in remaining if m.difficulty == DifficultyLevel.EASY]
            if easy_modules:
                return random.choice(easy_modules)
        
        # If eye contact is good, we can try more advanced social modules
        if eye_contact > 60:
            social_modules = [
                m for m in remaining
                if m.type in [ModuleType.JOINT_ATTENTION, ModuleType.FACIAL_EXPRESSION]
            ]
            if social_modules:
                return social_modules[0]
        
        # If emotion signals are low, include emotion-focused modules
        if emotion < 40:
            emotion_modules = [
                m for m in remaining
                if m.type in [ModuleType.FACIAL_EXPRESSION, ModuleType.EMOTION_RECOGNITION]
            ]
            if emotion_modules:
                return emotion_modules[0]
        
        # Default: return first available module
        return remaining[0]
    
    def should_extend_module(
        self,
        module_id: str,
        elapsed_seconds: int,
        current_metrics: Dict[str, float]
    ) -> bool:
        """
        Determine if current module should be extended.
        
        Args:
            module_id: Current module ID
            elapsed_seconds: Time elapsed in current module
            current_metrics: Current behavioral metrics
            
        Returns:
            True if module should be extended
        """
        module = next((m for m in self.all_modules if m.id == module_id), None)
        if not module:
            return False
        
        attention = current_metrics.get("attention", 50)
        confidence = current_metrics.get("confidence", 70)
        
        # Extend if:
        # 1. Attention is still high and we haven't reached 2x duration
        # 2. Confidence is low and we need more data
        if attention > 60 and elapsed_seconds < module.duration_seconds * 2:
            return True
        
        if confidence < 50 and elapsed_seconds < module.duration_seconds * 1.5:
            return True
        
        return False
    
    def get_adaptive_suggestion(self) -> Optional[str]:
        """Get a suggestion for the parent based on session progress."""
        if not self._current_metrics:
            return None
        
        attention = self._current_metrics.get("attention", 50)
        eye_contact = self._current_metrics.get("eye_contact", 50)
        
        if attention < 35 and len(self._completed_modules) < 3:
            return "Consider taking a short break. The child's attention is drifting."
        
        if eye_contact < 30:
            return "Try making more eye-level contact with the child."
        
        if attention > 70:
            return "Great focus! Consider adding optional modules for more detailed assessment."
        
        return None
    
    def get_protocol_summary(self) -> Dict[str, Any]:
        """Get summary of the adaptive protocol execution."""
        return {
            "completed_modules": len(self._completed_modules),
            "total_modules": len(self.all_modules),
            "module_history": self._module_history,
            "final_metrics": self._current_metrics,
        }
    
    def reset(self):
        """Reset engine for a new screening session."""
        self._completed_modules = []
        self._current_metrics = {}
        self._module_history = []


# Global instance
_protocol_engine: Optional[AdaptiveProtocolEngine] = None

def get_protocol_engine() -> AdaptiveProtocolEngine:
    """Get or create global protocol engine instance."""
    global _protocol_engine
    if _protocol_engine is None:
        _protocol_engine = AdaptiveProtocolEngine()
    return _protocol_engine
