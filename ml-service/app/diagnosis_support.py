"""
Differential Diagnosis Support Module
Provides AI-assisted diagnostic suggestions based on screening patterns.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum
import math

class DiagnosisCategory(Enum):
    ASD = "autism_spectrum_disorder"
    ADHD = "attention_deficit_hyperactivity_disorder"
    SPD = "sensory_processing_disorder"
    LANGUAGE_DELAY = "language_development_delay"
    SOCIAL_COMMUNICATION = "social_communication_disorder"
    TYPICAL_DEVELOPMENT = "typical_development"

@dataclass
class DiagnosisSuggestion:
    """A potential diagnosis with supporting evidence."""
    category: DiagnosisCategory
    probability: float  # 0-1
    confidence: float   # 0-1
    supporting_factors: List[str]
    conflicting_factors: List[str]
    recommendations: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "category": self.category.value,
            "category_name": self._get_display_name(),
            "probability": round(self.probability, 3),
            "confidence": round(self.confidence, 3),
            "supporting_factors": self.supporting_factors,
            "conflicting_factors": self.conflicting_factors,
            "recommendations": self.recommendations,
        }
    
    def _get_display_name(self) -> str:
        names = {
            DiagnosisCategory.ASD: "Autism Spectrum Disorder",
            DiagnosisCategory.ADHD: "ADHD",
            DiagnosisCategory.SPD: "Sensory Processing Disorder",
            DiagnosisCategory.LANGUAGE_DELAY: "Language Development Delay",
            DiagnosisCategory.SOCIAL_COMMUNICATION: "Social Communication Disorder",
            DiagnosisCategory.TYPICAL_DEVELOPMENT: "Typical Development",
        }
        return names.get(self.category, self.category.value)

class DifferentialDiagnosisEngine:
    """
    Analyzes screening patterns to suggest potential diagnoses.
    
    IMPORTANT: This is a screening support tool only.
    All suggestions must be validated by qualified clinicians.
    """
    
    # Key indicators for each diagnosis
    INDICATORS = {
        DiagnosisCategory.ASD: {
            "primary": [
                ("eye_contact", 35, 0.3),      # (metric, threshold, weight)
                ("joint_attention", 40, 0.25),
                ("social_response", 45, 0.25),
                ("repetitive_behavior", 60, 0.2),
            ],
            "secondary": [
                ("communication", 50, 0.15),
                ("sensory_sensitivity", 55, 0.1),
            ],
        },
        DiagnosisCategory.ADHD: {
            "primary": [
                ("attention_span", 35, 0.35),
                ("impulsivity", 50, 0.25),
                ("hyperactivity", 55, 0.2),
            ],
            "secondary": [
                ("focus_variability", 60, 0.1),
            ],
        },
        DiagnosisCategory.SPD: {
            "primary": [
                ("sensory_seeking", 60, 0.3),
                ("sensory_avoiding", 60, 0.3),
                ("sensory_sensitivity", 55, 0.25),
            ],
        },
        DiagnosisCategory.LANGUAGE_DELAY: {
            "primary": [
                ("verbal_communication", 40, 0.35),
                ("language_comprehension", 45, 0.3),
                ("vocabulary", 50, 0.2),
            ],
        },
    }
    
    def analyze(
        self,
        metrics: Dict[str, float],
        session_history: List[Dict[str, float]] = None,
        child_age_months: int = None,
    ) -> List[DiagnosisSuggestion]:
        """
        Generate differential diagnosis suggestions.
        
        Args:
            metrics: Current session behavioral metrics
            session_history: Previous session metrics for trend analysis
            child_age_months: Child's age in months for age-appropriate expectations
            
        Returns:
            List of diagnosis suggestions sorted by probability
        """
        suggestions: List[DiagnosisSuggestion] = []
        
        # Analyze each potential diagnosis
        for category in DiagnosisCategory:
            if category == DiagnosisCategory.TYPICAL_DEVELOPMENT:
                continue
                
            suggestion = self._analyze_category(
                category, metrics, session_history, child_age_months
            )
            if suggestion and suggestion.probability > 0.1:
                suggestions.append(suggestion)
        
        # Calculate typical development probability
        typical_prob = self._calculate_typical_probability(metrics, suggestions)
        if typical_prob > 0.1:
            suggestions.append(DiagnosisSuggestion(
                category=DiagnosisCategory.TYPICAL_DEVELOPMENT,
                probability=typical_prob,
                confidence=0.7,
                supporting_factors=["All behavioral metrics within typical range"],
                conflicting_factors=[],
                recommendations=["Continue regular developmental monitoring"],
            ))
        
        # Sort by probability
        suggestions.sort(key=lambda s: s.probability, reverse=True)
        
        return suggestions[:5]  # Return top 5 suggestions
    
    def _analyze_category(
        self,
        category: DiagnosisCategory,
        metrics: Dict[str, float],
        session_history: List[Dict[str, float]] = None,
        child_age_months: int = None,
    ) -> Optional[DiagnosisSuggestion]:
        """Analyze metrics for a specific diagnosis category."""
        indicators = self.INDICATORS.get(category, {})
        if not indicators:
            return None
        
        supporting_factors: List[str] = []
        conflicting_factors: List[str] = []
        total_weight = 0.0
        matched_weight = 0.0
        
        # Check primary indicators
        for metric_name, threshold, weight in indicators.get("primary", []):
            metric_value = metrics.get(metric_name, 50)
            total_weight += weight
            
            if metric_value < threshold:
                matched_weight += weight
                supporting_factors.append(
                    f"Below-threshold {metric_name.replace('_', ' ')} ({metric_value:.0f}% vs expected {threshold}%)"
                )
            else:
                conflicting_factors.append(
                    f"Normal {metric_name.replace('_', ' ')} ({metric_value:.0f}%)"
                )
        
        # Check secondary indicators
        for metric_name, threshold, weight in indicators.get("secondary", []):
            metric_value = metrics.get(metric_name, 50)
            total_weight += weight
            
            if metric_value < threshold:
                matched_weight += weight * 0.5  # Secondary indicators contribute less
        
        # Calculate probability
        probability = matched_weight / max(total_weight, 0.01)
        
        # Adjust based on trends if history available
        if session_history and len(session_history) > 1:
            trend_factor = self._calculate_trend_factor(metrics, session_history)
            probability *= (1 + trend_factor * 0.2)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(category, probability)
        
        return DiagnosisSuggestion(
            category=category,
            probability=min(1.0, probability),
            confidence=self._calculate_confidence(supporting_factors, conflicting_factors),
            supporting_factors=supporting_factors,
            conflicting_factors=conflicting_factors,
            recommendations=recommendations,
        )
    
    def _calculate_trend_factor(
        self,
        current: Dict[str, float],
        history: List[Dict[str, float]],
    ) -> float:
        """Calculate if metrics are improving or declining over time."""
        if not history:
            return 0.0
        
        # Simple trend: compare current to average of history
        avg_eye = sum(h.get("eye_contact", 50) for h in history) / len(history)
        avg_attention = sum(h.get("attention", 50) for h in history) / len(history)
        
        current_avg = (current.get("eye_contact", 50) + current.get("attention", 50)) / 2
        historical_avg = (avg_eye + avg_attention) / 2
        
        # Negative if declining (more concern), positive if improving
        return (current_avg - historical_avg) / 100
    
    def _calculate_typical_probability(
        self,
        metrics: Dict[str, float],
        suggestions: List[DiagnosisSuggestion],
    ) -> float:
        """Calculate probability of typical development."""
        if not suggestions:
            return 0.9
        
        # Inverse of highest atypical probability
        max_atypical = max(s.probability for s in suggestions)
        return max(0.1, 1.0 - max_atypical)
    
    def _calculate_confidence(
        self,
        supporting: List[str],
        conflicting: List[str],
    ) -> float:
        """Calculate confidence in the diagnosis suggestion."""
        total_factors = len(supporting) + len(conflicting)
        if total_factors == 0:
            return 0.3
        
        # More supporting factors = higher confidence
        # Conflicting factors reduce confidence
        ratio = len(supporting) / total_factors
        return min(0.9, max(0.3, ratio))
    
    def _generate_recommendations(
        self,
        category: DiagnosisCategory,
        probability: float,
    ) -> List[str]:
        """Generate actionable recommendations based on diagnosis."""
        base_recs = {
            DiagnosisCategory.ASD: [
                "Schedule comprehensive developmental evaluation with a specialist",
                "Consider ADOS-2 or similar standardized assessment",
                "Early intervention services may be beneficial",
                "Document observed behaviors for clinical review",
            ],
            DiagnosisCategory.ADHD: [
                "Detailed attention assessment recommended",
                "Consider behavioral observation in multiple settings",
                "Parent and teacher rating scales may be helpful",
            ],
            DiagnosisCategory.SPD: [
                "Occupational therapy evaluation recommended",
                "Sensory profile assessment may provide additional insights",
            ],
            DiagnosisCategory.LANGUAGE_DELAY: [
                "Speech-language pathology evaluation recommended",
                "Consider hearing screening if not recently completed",
            ],
            DiagnosisCategory.SOCIAL_COMMUNICATION: [
                "Speech-language evaluation for pragmatic language",
                "Social skills assessment may be beneficial",
            ],
        }
        
        recs = base_recs.get(category, ["Consult with a developmental specialist"])
        
        if probability > 0.7:
            recs = recs[:2]  # Prioritize top recommendations for high probability
        elif probability < 0.3:
            recs = ["Monitor and reassess in 3-6 months"] + recs
        
        return recs


# Global instance
_diagnosis_engine: Optional[DifferentialDiagnosisEngine] = None

def get_diagnosis_engine() -> DifferentialDiagnosisEngine:
    """Get or create global diagnosis engine instance."""
    global _diagnosis_engine
    if _diagnosis_engine is None:
        _diagnosis_engine = DifferentialDiagnosisEngine()
    return _diagnosis_engine
