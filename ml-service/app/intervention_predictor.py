"""
Predictive Intervention Analytics
Predicts intervention success rates based on child profile and treatment history.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum
import math

class InterventionType(Enum):
    SPEECH_THERAPY = "speech_therapy"
    OCCUPATIONAL_THERAPY = "occupational_therapy"
    BEHAVIORAL_THERAPY = "behavioral_therapy"
    SOCIAL_SKILLS_TRAINING = "social_skills_training"
    EARLY_INTERVENTION = "early_intervention"
    PARENT_TRAINING = "parent_training"

@dataclass
class InterventionPrediction:
    """Prediction result for an intervention type."""
    intervention_type: InterventionType
    success_probability: float
    confidence: float
    time_to_improvement_weeks: int
    key_factors: List[str]
    recommendations: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "intervention_type": self.intervention_type.value,
            "success_probability": round(self.success_probability, 3),
            "confidence": round(self.confidence, 3),
            "time_to_improvement_weeks": self.time_to_improvement_weeks,
            "key_factors": self.key_factors,
            "recommendations": self.recommendations,
        }

@dataclass
class ChildProfile:
    """Child profile for prediction."""
    age_months: int
    risk_score: float
    risk_level: str
    primary_concerns: List[str]
    previous_interventions: List[str]
    family_history: bool
    session_count: int
    engagement_score: float

class InterventionPredictor:
    """
    Predicts intervention success rates using historical patterns.
    
    Uses a combination of:
    - Evidence-based effectiveness data
    - Age-appropriate intervention timing
    - Risk profile matching
    """
    
    # Evidence-based effectiveness rates by intervention type and age
    EFFECTIVENESS_DATA = {
        InterventionType.EARLY_INTERVENTION: {
            "optimal_age_range": (12, 36),
            "base_effectiveness": 0.85,
            "age_decay": 0.02,  # Effectiveness decay per month after optimal range
        },
        InterventionType.SPEECH_THERAPY: {
            "optimal_age_range": (18, 48),
            "base_effectiveness": 0.75,
            "age_decay": 0.01,
        },
        InterventionType.OCCUPATIONAL_THERAPY: {
            "optimal_age_range": (24, 72),
            "base_effectiveness": 0.70,
            "age_decay": 0.008,
        },
        InterventionType.BEHAVIORAL_THERAPY: {
            "optimal_age_range": (24, 84),
            "base_effectiveness": 0.78,
            "age_decay": 0.005,
        },
        InterventionType.SOCIAL_SKILLS_TRAINING: {
            "optimal_age_range": (36, 96),
            "base_effectiveness": 0.65,
            "age_decay": 0.003,
        },
        InterventionType.PARENT_TRAINING: {
            "optimal_age_range": (0, 120),  # Always beneficial
            "base_effectiveness": 0.80,
            "age_decay": 0.0,
        },
    }
    
    # Concern-to-intervention mapping
    CONCERN_MAPPING = {
        "communication": [InterventionType.SPEECH_THERAPY, InterventionType.EARLY_INTERVENTION],
        "social_interaction": [InterventionType.SOCIAL_SKILLS_TRAINING, InterventionType.BEHAVIORAL_THERAPY],
        "sensory": [InterventionType.OCCUPATIONAL_THERAPY],
        "repetitive_behavior": [InterventionType.BEHAVIORAL_THERAPY],
        "attention": [InterventionType.OCCUPATIONAL_THERAPY, InterventionType.BEHAVIORAL_THERAPY],
        "eye_contact": [InterventionType.EARLY_INTERVENTION, InterventionType.BEHAVIORAL_THERAPY],
        "joint_attention": [InterventionType.EARLY_INTERVENTION, InterventionType.BEHAVIORAL_THERAPY],
    }
    
    def predict_interventions(
        self,
        profile: ChildProfile,
    ) -> List[InterventionPrediction]:
        """
        Generate intervention predictions for a child profile.
        
        Args:
            profile: Child's profile with demographics and assessment data
            
        Returns:
            List of intervention predictions sorted by success probability
        """
        predictions: List[InterventionPrediction] = []
        
        # Get recommended interventions based on concerns
        recommended_types = self._get_recommended_interventions(profile)
        
        for intervention_type in recommended_types:
            prediction = self._predict_single_intervention(
                intervention_type, profile
            )
            if prediction:
                predictions.append(prediction)
        
        # Always recommend parent training
        if InterventionType.PARENT_TRAINING not in recommended_types:
            predictions.append(self._predict_single_intervention(
                InterventionType.PARENT_TRAINING, profile
            ))
        
        # Sort by success probability
        predictions.sort(key=lambda p: p.success_probability, reverse=True)
        
        return predictions
    
    def _get_recommended_interventions(
        self, profile: ChildProfile
    ) -> List[InterventionType]:
        """Determine recommended interventions based on concerns."""
        recommended = set()
        
        # Map concerns to interventions
        for concern in profile.primary_concerns:
            concern_lower = concern.lower().replace(" ", "_")
            if concern_lower in self.CONCERN_MAPPING:
                recommended.update(self.CONCERN_MAPPING[concern_lower])
        
        # Early intervention for high risk under 3 years
        if profile.age_months < 36 and profile.risk_score > 50:
            recommended.add(InterventionType.EARLY_INTERVENTION)
        
        # Remove already attempted interventions
        for prev in profile.previous_interventions:
            try:
                prev_type = InterventionType(prev)
                recommended.discard(prev_type)
            except ValueError:
                pass
        
        return list(recommended)
    
    def _predict_single_intervention(
        self,
        intervention_type: InterventionType,
        profile: ChildProfile,
    ) -> Optional[InterventionPrediction]:
        """Predict success for a single intervention type."""
        data = self.EFFECTIVENESS_DATA.get(intervention_type)
        if not data:
            return None
        
        # Base effectiveness
        base_prob = data["base_effectiveness"]
        
        # Age factor
        optimal_min, optimal_max = data["optimal_age_range"]
        if optimal_min <= profile.age_months <= optimal_max:
            age_factor = 1.0
        elif profile.age_months < optimal_min:
            age_factor = 0.85  # Too young, slightly reduced
        else:
            # Too old, apply decay
            months_over = profile.age_months - optimal_max
            age_factor = max(0.4, 1.0 - (months_over * data["age_decay"]))
        
        # Risk factor
        if profile.risk_level == "low":
            risk_factor = 1.1
        elif profile.risk_level == "high":
            risk_factor = 0.85
        else:
            risk_factor = 1.0
        
        # Engagement factor
        engagement_factor = 0.8 + (profile.engagement_score / 100) * 0.4
        
        # Family history factor
        family_factor = 0.9 if profile.family_history else 1.0
        
        # Session count factor (more data = better prediction)
        confidence = min(0.95, 0.5 + profile.session_count * 0.05)
        
        # Calculate final probability
        probability = base_prob * age_factor * risk_factor * engagement_factor * family_factor
        probability = max(0.1, min(0.95, probability))
        
        # Estimate time to improvement
        base_time = {
            InterventionType.EARLY_INTERVENTION: 12,
            InterventionType.SPEECH_THERAPY: 16,
            InterventionType.OCCUPATIONAL_THERAPY: 20,
            InterventionType.BEHAVIORAL_THERAPY: 24,
            InterventionType.SOCIAL_SKILLS_TRAINING: 20,
            InterventionType.PARENT_TRAINING: 8,
        }
        time_weeks = int(base_time.get(intervention_type, 16) * (1.1 - probability * 0.2))
        
        # Key factors
        key_factors = []
        if age_factor < 1.0:
            key_factors.append(f"Age outside optimal range for this intervention")
        if engagement_factor > 1.0:
            key_factors.append("Good engagement during screening")
        if profile.family_history:
            key_factors.append("Family history may affect response")
        if profile.risk_score > 60:
            key_factors.append("Higher risk profile requires intensive approach")
        if not key_factors:
            key_factors.append("Profile matches optimal intervention criteria")
        
        # Recommendations
        recommendations = self._generate_recommendations(
            intervention_type, profile, probability
        )
        
        return InterventionPrediction(
            intervention_type=intervention_type,
            success_probability=probability,
            confidence=confidence,
            time_to_improvement_weeks=time_weeks,
            key_factors=key_factors,
            recommendations=recommendations,
        )
    
    def _generate_recommendations(
        self,
        intervention_type: InterventionType,
        profile: ChildProfile,
        probability: float,
    ) -> List[str]:
        """Generate actionable recommendations."""
        base_recs = {
            InterventionType.EARLY_INTERVENTION: [
                "Begin as soon as possible - early intervention is most effective",
                "Consider 15-25 hours per week of structured intervention",
                "Include parent coaching as part of the program",
            ],
            InterventionType.SPEECH_THERAPY: [
                "Schedule 2-3 sessions per week initially",
                "Practice communication skills at home daily",
                "Consider augmentative communication tools if needed",
            ],
            InterventionType.OCCUPATIONAL_THERAPY: [
                "Focus on sensory integration and daily living skills",
                "Create a sensory diet for home use",
                "Include fine motor activities in daily routine",
            ],
            InterventionType.BEHAVIORAL_THERAPY: [
                "Consider ABA or similar structured approach",
                "Set clear, measurable goals",
                "Ensure consistency across all caregivers",
            ],
            InterventionType.SOCIAL_SKILLS_TRAINING: [
                "Start with one-on-one sessions before group settings",
                "Use structured social stories and role-play",
                "Practice skills in natural environments",
            ],
            InterventionType.PARENT_TRAINING: [
                "Attend regular parent coaching sessions",
                "Learn intervention strategies to use at home",
                "Join parent support groups for shared learning",
            ],
        }
        
        recs = base_recs.get(intervention_type, ["Consult with a specialist for guidance"])
        
        if probability < 0.6:
            recs = ["Consider combining with other interventions"] + recs
        
        return recs

    def get_intervention_comparison(
        self, profile: ChildProfile
    ) -> Dict[str, Any]:
        """
        Get a comparison of all intervention options.
        
        Returns:
            Dict with intervention comparisons and overall recommendation
        """
        predictions = self.predict_interventions(profile)
        
        return {
            "predictions": [p.to_dict() for p in predictions],
            "top_recommendation": predictions[0].intervention_type.value if predictions else None,
            "confidence_level": "high" if predictions and predictions[0].confidence > 0.8 else "moderate",
            "next_steps": [
                "Consult with developmental pediatrician",
                "Review predictions with clinical team",
                "Create intervention timeline based on priorities",
            ],
        }


# Global instance
_predictor: Optional[InterventionPredictor] = None

def get_intervention_predictor() -> InterventionPredictor:
    """Get or create global predictor instance."""
    global _predictor
    if _predictor is None:
        _predictor = InterventionPredictor()
    return _predictor
