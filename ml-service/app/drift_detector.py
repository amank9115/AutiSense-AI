"""
Statistical Data Drift Detection for ML Service.

Implements multiple statistical methods to detect distribution shifts:
- Population Stability Index (PSI)
- Kolmogorov-Smirnov Test
- Chi-Square Test (for categorical features)
- Jensen-Shannon Divergence

References:
- PSI: https://www.listendata.com/2015/05/population-stability-index.html
- KS Test: https://en.wikipedia.org/wiki/Kolmogorov%E2%80%93Smirnov_test
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import structlog

logger = structlog.get_logger()


class DriftSeverity(str, Enum):
    """Severity levels for drift detection."""
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class DriftResult:
    """Result of drift detection analysis."""
    feature_name: str
    method: str
    statistic: float
    p_value: Optional[float]
    severity: DriftSeverity
    message: str
    threshold: float


class DriftDetector:
    """
    Statistical drift detection for ML models.

    Compares recent data distributions against baseline (training) distributions.
    """

    def __init__(
        self,
        psi_threshold_low: float = 0.1,
        psi_threshold_medium: float = 0.25,
        psi_threshold_high: float = 0.5,
        ks_p_value_threshold: float = 0.05,
        js_threshold_low: float = 0.1,
        js_threshold_medium: float = 0.25,
        js_threshold_high: float = 0.5,
    ):
        """
        Initialize drift detector with thresholds.

        Args:
            psi_threshold_low: PSI threshold for low severity
            psi_threshold_medium: PSI threshold for medium severity
            psi_threshold_high: PSI threshold for high severity
            ks_p_value_threshold: P-value threshold for KS test
            js_threshold_low: Jensen-Shannon threshold for low severity
            js_threshold_medium: Jensen-Shannon threshold for medium severity
            js_threshold_high: Jensen-Shannon threshold for high severity
        """
        self.psi_thresholds = {
            DriftSeverity.LOW: psi_threshold_low,
            DriftSeverity.MEDIUM: psi_threshold_medium,
            DriftSeverity.HIGH: psi_threshold_high,
        }

        self.ks_p_value_threshold = ks_p_value_threshold

        self.js_thresholds = {
            DriftSeverity.LOW: js_threshold_low,
            DriftSeverity.MEDIUM: js_threshold_medium,
            DriftSeverity.HIGH: js_threshold_high,
        }

        # Store baseline distributions
        self._baselines: Dict[str, np.ndarray] = {}
        self._baseline_stats: Dict[str, Dict[str, float]] = {}

    def set_baseline(self, feature_name: str, values: np.ndarray) -> None:
        """
        Set baseline distribution for a feature.

        Should be called with training data during model initialization.

        Args:
            feature_name: Name of the feature
            values: Array of baseline values
        """
        values = np.array(values)
        self._baselines[feature_name] = values

        # Calculate and store baseline statistics
        self._baseline_stats[feature_name] = {
            "mean": float(np.mean(values)),
            "std": float(np.std(values)),
            "min": float(np.min(values)),
            "max": float(np.max(values)),
            "median": float(np.median(values)),
            "q25": float(np.percentile(values, 25)),
            "q75": float(np.percentile(values, 75)),
        }

        logger.info("baseline_set",
            feature=feature_name,
            n_samples=len(values),
            mean=self._baseline_stats[feature_name]["mean"]
        )

    def calculate_psi(
        self,
        baseline: np.ndarray,
        current: np.ndarray,
        buckets: int = 10
    ) -> Tuple[float, DriftSeverity]:
        """
        Calculate Population Stability Index (PSI).

        PSI measures how much a distribution has shifted from baseline.

        Interpretation:
        - PSI < 0.1: No significant shift (NONE)
        - 0.1 ≤ PSI < 0.25: Moderate shift (LOW)
        - 0.25 ≤ PSI < 0.5: Significant shift (MEDIUM)
        - PSI ≥ 0.5: Major shift (HIGH)

        Args:
            baseline: Baseline distribution values
            current: Current distribution values
            buckets: Number of bins for histogram

        Returns:
            Tuple of (PSI value, severity)
        """
        # Define bins based on baseline distribution
        _, bin_edges = np.histogram(baseline, bins=buckets)

        # Calculate distributions
        baseline_counts, _ = np.histogram(baseline, bins=bin_edges)
        current_counts, _ = np.histogram(current, bins=bin_edges)

        # Convert to percentages
        baseline_pct = baseline_counts / len(baseline)
        current_pct = current_counts / len(current)

        # Avoid division by zero
        baseline_pct = np.clip(baseline_pct, 0.0001, 1.0)
        current_pct = np.clip(current_pct, 0.0001, 1.0)

        # Calculate PSI
        psi = np.sum(
            (current_pct - baseline_pct) * np.log(current_pct / baseline_pct)
        )

        # Determine severity
        severity = DriftSeverity.NONE
        for sev in [DriftSeverity.HIGH, DriftSeverity.MEDIUM, DriftSeverity.LOW]:
            if psi >= self.psi_thresholds[sev]:
                severity = sev
                break

        return float(psi), severity

    def calculate_ks_test(
        self,
        baseline: np.ndarray,
        current: np.ndarray
    ) -> Tuple[float, float, DriftSeverity]:
        """
        Perform Kolmogorov-Smirnov test.

        Tests whether two samples are drawn from the same distribution.

        Args:
            baseline: Baseline distribution values
            current: Current distribution values

        Returns:
            Tuple of (KS statistic, p-value, severity)
        """
        from scipy import stats

        statistic, p_value = stats.ks_2samp(baseline, current)

        severity = DriftSeverity.NONE
        if p_value < self.ks_p_value_threshold:
            # P-value is low, distributions are different
            if statistic > 0.3:
                severity = DriftSeverity.HIGH
            elif statistic > 0.2:
                severity = DriftSeverity.MEDIUM
            else:
                severity = DriftSeverity.LOW

        return float(statistic), float(p_value), severity

    def calculate_jensen_shannon(
        self,
        baseline: np.ndarray,
        current: np.ndarray,
        buckets: int = 10
    ) -> Tuple[float, DriftSeverity]:
        """
        Calculate Jensen-Shannon Divergence.

        Symmetric measure of similarity between two probability distributions.

        Args:
            baseline: Baseline distribution values
            current: Current distribution values
            buckets: Number of bins for histogram

        Returns:
            Tuple of (JS divergence, severity)
        """
        # Define bins
        all_values = np.concatenate([baseline, current])
        bin_edges = np.linspace(np.min(all_values), np.max(all_values), buckets + 1)

        # Calculate distributions
        baseline_hist, _ = np.histogram(baseline, bins=bin_edges, density=True)
        current_hist, _ = np.histogram(current, bins=bin_edges, density=True)

        # Normalize to probability distributions
        baseline_hist = baseline_hist / baseline_hist.sum()
        current_hist = current_hist / current_hist.sum()

        # Add small epsilon to avoid log(0)
        eps = 1e-10
        baseline_hist = baseline_hist + eps
        current_hist = current_hist + eps

        # Calculate JS divergence
        m = 0.5 * (baseline_hist + current_hist)
        js = 0.5 * (
            np.sum(baseline_hist * np.log(baseline_hist / m)) +
            np.sum(current_hist * np.log(current_hist / m))
        )

        # Normalize to [0, 1]
        js = js / np.log(2)

        # Determine severity
        severity = DriftSeverity.NONE
        for sev in [DriftSeverity.HIGH, DriftSeverity.MEDIUM, DriftSeverity.LOW]:
            if js >= self.js_thresholds[sev]:
                severity = sev
                break

        return float(js), severity

    def detect_drift(
        self,
        feature_name: str,
        current_values: np.ndarray,
        methods: List[str] = None
    ) -> List[DriftResult]:
        """
        Detect drift for a single feature.

        Args:
            feature_name: Name of the feature to analyze
            current_values: Current distribution values
            methods: List of methods to use ('psi', 'ks', 'js')
                     Default: all methods

        Returns:
            List of drift results for each method
        """
        if feature_name not in self._baselines:
            logger.warning("no_baseline_for_feature", feature=feature_name)
            return []

        baseline = self._baselines[feature_name]
        current = np.array(current_values)

        if methods is None:
            methods = ['psi', 'ks', 'js']

        results = []

        # PSI
        if 'psi' in methods:
            psi_value, severity = self.calculate_psi(baseline, current)
            results.append(DriftResult(
                feature_name=feature_name,
                method="Population Stability Index",
                statistic=psi_value,
                p_value=None,
                severity=severity,
                message=f"PSI = {psi_value:.4f} ({severity.value} drift)",
                threshold=self.psi_thresholds.get(severity, 0)
            ))

        # KS Test
        if 'ks' in methods:
            try:
                ks_stat, p_value, severity = self.calculate_ks_test(baseline, current)
                results.append(DriftResult(
                    feature_name=feature_name,
                    method="Kolmogorov-Smirnov Test",
                    statistic=ks_stat,
                    p_value=p_value,
                    severity=severity,
                    message=f"KS statistic = {ks_stat:.4f}, p-value = {p_value:.4f}",
                    threshold=self.ks_p_value_threshold
                ))
            except Exception as e:
                logger.error("ks_test_failed", feature=feature_name, error=str(e))

        # Jensen-Shannon
        if 'js' in methods:
            js_value, severity = self.calculate_jensen_shannon(baseline, current)
            results.append(DriftResult(
                feature_name=feature_name,
                method="Jensen-Shannon Divergence",
                statistic=js_value,
                p_value=None,
                severity=severity,
                message=f"JS divergence = {js_value:.4f} ({severity.value} drift)",
                threshold=self.js_thresholds.get(severity, 0)
            ))

        return results

    def detect_multivariate_drift(
        self,
        current_data: Dict[str, np.ndarray],
        methods: List[str] = None
    ) -> Dict[str, Any]:
        """
        Detect drift across multiple features.

        Args:
            current_data: Dictionary mapping feature names to current values
            methods: List of methods to use

        Returns:
            Comprehensive drift analysis
        """
        all_results = []
        drift_detected = False
        max_severity = DriftSeverity.NONE

        for feature_name, current_values in current_data.items():
            results = self.detect_drift(feature_name, current_values, methods)
            all_results.extend(results)

            for result in results:
                if result.severity != DriftSeverity.NONE:
                    drift_detected = True
                    if result.severity.value > max_severity.value:
                        max_severity = result.severity

        # Aggregate results
        summary = {
            "drift_detected": drift_detected,
            "max_severity": max_severity.value,
            "features_analyzed": len(current_data),
            "features_with_drift": sum(
                1 for r in all_results if r.severity != DriftSeverity.NONE
            ),
            "total_tests": len(all_results),
            "results": [
                {
                    "feature": r.feature_name,
                    "method": r.method,
                    "statistic": r.statistic,
                    "p_value": r.p_value,
                    "severity": r.severity.value,
                    "message": r.message,
                }
                for r in all_results
            ],
            "recommendations": self._generate_recommendations(all_results),
        }

        return summary

    def _generate_recommendations(self, results: List[DriftResult]) -> List[str]:
        """Generate actionable recommendations based on drift results."""
        recommendations = []

        high_drift_features = [
            r.feature_name for r in results
            if r.severity in [DriftSeverity.HIGH, DriftSeverity.CRITICAL]
        ]

        if high_drift_features:
            recommendations.append(
                f"High drift detected in features: {', '.join(high_drift_features)}. "
                "Investigate data quality and consider model retraining."
            )

        medium_drift_features = [
            r.feature_name for r in results
            if r.severity == DriftSeverity.MEDIUM
        ]

        if medium_drift_features:
            recommendations.append(
                f"Moderate drift detected in features: {', '.join(medium_drift_features)}. "
                "Monitor closely and schedule model review."
            )

        if not recommendations:
            recommendations.append("No significant drift detected. Continue monitoring.")

        return recommendations

    def get_baseline_stats(self, feature_name: str) -> Optional[Dict[str, float]]:
        """Get baseline statistics for a feature."""
        return self._baseline_stats.get(feature_name)

    def export_baselines(self) -> Dict[str, Any]:
        """Export all baseline data for persistence."""
        return {
            "stats": self._baseline_stats,
            "sample_counts": {
                name: len(values)
                for name, values in self._baselines.items()
            },
        }

    def import_baselines(
        self,
        baseline_data: Dict[str, np.ndarray],
        stats: Optional[Dict[str, Dict[str, float]]] = None
    ) -> None:
        """
        Import baseline data.

        Args:
            baseline_data: Dictionary of feature name to baseline values
            stats: Optional pre-computed statistics
        """
        for feature_name, values in baseline_data.items():
            self.set_baseline(feature_name, values)

            if stats and feature_name in stats:
                self._baseline_stats[feature_name] = stats[feature_name]


# Global drift detector instance
_drift_detector: Optional[DriftDetector] = None


def get_drift_detector() -> DriftDetector:
    """Get the global drift detector instance."""
    global _drift_detector

    if _drift_detector is None:
        _drift_detector = DriftDetector()

    return _drift_detector


def initialize_drift_detector_from_training_data(
    training_data: Dict[str, np.ndarray]
) -> DriftDetector:
    """
    Initialize drift detector with training data.

    Should be called during model training or loading.

    Args:
        training_data: Dictionary mapping feature names to training values

    Returns:
        Initialized drift detector
    """
    global _drift_detector

    detector = DriftDetector()

    for feature_name, values in training_data.items():
        detector.set_baseline(feature_name, values)

    _drift_detector = detector

    logger.info("drift_detector_initialized",
        features=list(training_data.keys())
    )

    return detector
