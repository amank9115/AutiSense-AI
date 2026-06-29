"""
A/B Testing Infrastructure for ML Service.

Enables model comparison through controlled experiments:
- Route traffic between model variants
- Collect performance metrics per variant
- Statistical significance analysis
- Gradual rollout capabilities

Use Cases:
- Compare new model against production (champion/challenger)
- Gradual rollout of new model (canary deployment)
- Feature impact analysis
- Model performance comparison

Integration:
- Uses Model Registry for model versions
- Exports metrics to Prometheus per variant
- Logs to structured logging
"""

from __future__ import annotations

import json
import math
import os
import threading
import time
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple
import hashlib

import numpy as np
import structlog

logger = structlog.get_logger()


class ExperimentStatus(str, Enum):
    """Status of an experiment."""
    DRAFT = "draft"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class RoutingStrategy(str, Enum):
    """Traffic routing strategy."""
    RANDOM = "random"  # Random assignment
    USER_BASED = "user_based"  # Consistent per user/session
    PERCENTAGE = "percentage"  # Simple percentage split


@dataclass
class ExperimentVariant:
    """A model variant in an experiment."""
    name: str
    model_version: str
    traffic_percentage: float
    description: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "model_version": self.model_version,
            "traffic_percentage": self.traffic_percentage,
            "description": self.description,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ExperimentVariant":
        return cls(
            name=data["name"],
            model_version=data["model_version"],
            traffic_percentage=data["traffic_percentage"],
            description=data.get("description", ""),
        )


@dataclass
class ExperimentConfig:
    """Configuration for an A/B test experiment."""
    experiment_id: str
    name: str
    description: str
    status: ExperimentStatus
    variants: List[ExperimentVariant]
    routing_strategy: RoutingStrategy
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat())
    metadata: Dict[str, Any] = field(default_factory=dict)

    def validate(self) -> Tuple[bool, List[str]]:
        """Validate experiment configuration."""
        errors = []

        # Check traffic percentages sum to 100
        total_traffic = sum(v.traffic_percentage for v in self.variants)
        if abs(total_traffic - 100.0) > 0.01:
            errors.append(f"Traffic percentages must sum to 100, got {total_traffic}")

        # Check at least 2 variants
        if len(self.variants) < 2:
            errors.append("Experiment must have at least 2 variants")

        # Check variant names are unique
        names = [v.name for v in self.variants]
        if len(names) != len(set(names)):
            errors.append("Variant names must be unique")

        # Check all percentages are positive
        for v in self.variants:
            if v.traffic_percentage <= 0:
                errors.append(f"Variant {v.name} has invalid traffic percentage")

        return len(errors) == 0, errors

    def to_dict(self) -> Dict[str, Any]:
        return {
            "experiment_id": self.experiment_id,
            "name": self.name,
            "description": self.description,
            "status": self.status.value,
            "variants": [v.to_dict() for v in self.variants],
            "routing_strategy": self.routing_strategy.value,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ExperimentConfig":
        return cls(
            experiment_id=data["experiment_id"],
            name=data["name"],
            description=data.get("description", ""),
            status=ExperimentStatus(data["status"]),
            variants=[ExperimentVariant.from_dict(v) for v in data["variants"]],
            routing_strategy=RoutingStrategy(data.get("routing_strategy", "random")),
            start_time=data.get("start_time"),
            end_time=data.get("end_time"),
            created_at=data.get("created_at", datetime.now().isoformat()),
            updated_at=data.get("updated_at", datetime.now().isoformat()),
            metadata=data.get("metadata", {}),
        )


@dataclass
class VariantMetrics:
    """Metrics collected for a single variant."""
    variant_name: str
    prediction_count: int = 0
    total_latency_ms: float = 0.0
    risk_scores: List[int] = field(default_factory=list)
    confidence_scores: List[float] = field(default_factory=list)
    latencies: List[float] = field(default_factory=list)

    def add_prediction(
        self,
        risk_score: int,
        confidence: float,
        latency_ms: float
    ) -> None:
        """Record a prediction."""
        self.prediction_count += 1
        self.risk_scores.append(risk_score)
        self.confidence_scores.append(confidence)
        self.latencies.append(latency_ms)
        self.total_latency_ms += latency_ms

        # Keep only last 1000 for memory efficiency
        if len(self.risk_scores) > 1000:
            self.risk_scores = self.risk_scores[-1000:]
            self.confidence_scores = self.confidence_scores[-1000:]
            self.latencies = self.latencies[-1000:]

    def get_statistics(self) -> Dict[str, Any]:
        """Calculate statistics for this variant."""
        if self.prediction_count == 0:
            return {"count": 0}

        return {
            "count": self.prediction_count,
            "avg_latency_ms": round(np.mean(self.latencies), 2) if self.latencies else 0,
            "p50_latency_ms": round(np.percentile(self.latencies, 50), 2) if self.latencies else 0,
            "p95_latency_ms": round(np.percentile(self.latencies, 95), 2) if self.latencies else 0,
            "avg_risk_score": round(np.mean(self.risk_scores), 2) if self.risk_scores else 0,
            "avg_confidence": round(np.mean(self.confidence_scores), 2) if self.confidence_scores else 0,
        }


class TrafficRouter:
    """Routes traffic to experiment variants."""

    def __init__(self, strategy: RoutingStrategy = RoutingStrategy.RANDOM):
        self.strategy = strategy
        self._random = np.random.RandomState(42)

    def route(
        self,
        variants: List[ExperimentVariant],
        session_key: Optional[str] = None
    ) -> ExperimentVariant:
        """
        Determine which variant should handle a request.

        Args:
            variants: List of variants with traffic percentages
            session_key: Optional session key for consistent routing

        Returns:
            Selected variant
        """
        if self.strategy == RoutingStrategy.USER_BASED and session_key:
            # Hash-based consistent routing
            hash_value = int(hashlib.md5(session_key.encode()).hexdigest(), 16)
            percentage = (hash_value % 10000) / 100.0
        else:
            # Random routing
            percentage = self._random.uniform(0, 100)

        # Find variant based on cumulative percentage
        cumulative = 0.0
        for variant in variants:
            cumulative += variant.traffic_percentage
            if percentage <= cumulative:
                return variant

        # Fallback to last variant
        return variants[-1]


class StatisticalAnalyzer:
    """Statistical analysis for experiment comparison."""

    @staticmethod
    def t_test(
        sample_a: List[float],
        sample_b: List[float],
        alpha: float = 0.05
    ) -> Dict[str, Any]:
        """
        Perform two-sample t-test.

        Returns whether the difference is statistically significant.
        """
        if len(sample_a) < 2 or len(sample_b) < 2:
            return {
                "significant": False,
                "p_value": None,
                "message": "Insufficient samples for t-test",
            }

        try:
            from scipy import stats

            t_stat, p_value = stats.ttest_ind(sample_a, sample_b)

            return {
                "significant": p_value < alpha,
                "p_value": float(p_value),
                "t_statistic": float(t_stat),
                "alpha": alpha,
                "sample_a_size": len(sample_a),
                "sample_b_size": len(sample_b),
                "sample_a_mean": float(np.mean(sample_a)),
                "sample_b_mean": float(np.mean(sample_b)),
                "difference": float(np.mean(sample_b) - np.mean(sample_a)),
            }
        except Exception as e:
            return {
                "significant": False,
                "error": str(e),
            }

    @staticmethod
    def chi_square_test(
        observed_a: Dict[str, int],
        observed_b: Dict[str, int],
        alpha: float = 0.05
    ) -> Dict[str, Any]:
        """
        Perform chi-square test for categorical distributions.

        Useful for comparing risk label distributions.
        """
        try:
            from scipy import stats

            # Get all categories
            categories = set(observed_a.keys()) | set(observed_b.keys())

            # Build contingency table
            counts_a = [observed_a.get(c, 0) for c in sorted(categories)]
            counts_b = [observed_b.get(c, 0) for c in sorted(categories)]

            chi2, p_value, dof, expected = stats.chi2_contingency([counts_a, counts_b])

            return {
                "significant": p_value < alpha,
                "p_value": float(p_value),
                "chi2_statistic": float(chi2),
                "degrees_of_freedom": dof,
                "alpha": alpha,
            }
        except Exception as e:
            return {
                "significant": False,
                "error": str(e),
            }


class ExperimentManager:
    """
    Manages A/B testing experiments.

    Features:
    - Create and manage experiments
    - Route traffic to variants
    - Collect metrics per variant
    - Statistical analysis
    - Integration with model registry
    """

    def __init__(
        self,
        storage_path: str = None,
        model_registry=None,
    ):
        if storage_path is None:
            storage_path = os.path.join(
                os.path.dirname(__file__),
                "experiments.json"
            )

        self.storage_path = Path(storage_path)
        self.registry = model_registry
        self.router = TrafficRouter()

        self._experiments: Dict[str, ExperimentConfig] = {}
        self._metrics: Dict[str, Dict[str, VariantMetrics]] = {}
        self._lock = threading.RLock()

        # Load existing experiments
        self._load_experiments()

    def _load_experiments(self) -> None:
        """Load experiments from storage."""
        if not self.storage_path.exists():
            return

        try:
            with open(self.storage_path, "r") as f:
                data = json.load(f)

            for exp_data in data.get("experiments", []):
                exp = ExperimentConfig.from_dict(exp_data)
                self._experiments[exp.experiment_id] = exp

                # Initialize metrics
                self._metrics[exp.experiment_id] = {
                    v.name: VariantMetrics(variant_name=v.name)
                    for v in exp.variants
                }

            logger.info("experiments_loaded", count=len(self._experiments))

        except Exception as e:
            logger.error("experiments_load_failed", error=str(e))

    def _save_experiments(self) -> None:
        """Save experiments to storage."""
        data = {
            "experiments": [
                exp.to_dict() for exp in self._experiments.values()
            ],
            "updated_at": datetime.now().isoformat(),
        }

        temp_path = self.storage_path.with_suffix(".tmp")
        with open(temp_path, "w") as f:
            json.dump(data, f, indent=2)

        import shutil
        shutil.move(str(temp_path), str(self.storage_path))

    def create_experiment(
        self,
        name: str,
        variants: List[Dict[str, Any]],
        routing_strategy: str = "random",
        description: str = "",
        metadata: Dict[str, Any] = None,
    ) -> ExperimentConfig:
        """
        Create a new experiment.

        Args:
            name: Experiment name
            variants: List of variant configs with name, model_version, traffic_percentage
            routing_strategy: "random" or "user_based"
            description: Experiment description
            metadata: Additional metadata

        Returns:
            Created experiment configuration
        """
        with self._lock:
            experiment_id = f"exp_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

            exp_variants = [
                ExperimentVariant(
                    name=v["name"],
                    model_version=v["model_version"],
                    traffic_percentage=v["traffic_percentage"],
                    description=v.get("description", ""),
                )
                for v in variants
            ]

            experiment = ExperimentConfig(
                experiment_id=experiment_id,
                name=name,
                description=description,
                status=ExperimentStatus.DRAFT,
                variants=exp_variants,
                routing_strategy=RoutingStrategy(routing_strategy),
                metadata=metadata or {},
            )

            # Validate
            valid, errors = experiment.validate()
            if not valid:
                raise ValueError(f"Invalid experiment config: {'; '.join(errors)}")

            self._experiments[experiment_id] = experiment

            # Initialize metrics
            self._metrics[experiment_id] = {
                v.name: VariantMetrics(variant_name=v.name)
                for v in exp_variants
            }

            self._save_experiments()

            logger.info("experiment_created",
                experiment_id=experiment_id,
                name=name,
                variants=[v.name for v in exp_variants]
            )

            return experiment

    def start_experiment(self, experiment_id: str) -> ExperimentConfig:
        """Start an experiment (begin routing traffic)."""
        with self._lock:
            if experiment_id not in self._experiments:
                raise ValueError(f"Experiment {experiment_id} not found")

            experiment = self._experiments[experiment_id]

            if experiment.status != ExperimentStatus.DRAFT:
                raise ValueError(f"Cannot start experiment in {experiment.status} status")

            experiment.status = ExperimentStatus.RUNNING
            experiment.start_time = datetime.now().isoformat()
            experiment.updated_at = datetime.now().isoformat()

            self._save_experiments()

            logger.info("experiment_started", experiment_id=experiment_id)

            return experiment

    def pause_experiment(self, experiment_id: str) -> ExperimentConfig:
        """Pause an experiment."""
        with self._lock:
            if experiment_id not in self._experiments:
                raise ValueError(f"Experiment {experiment_id} not found")

            experiment = self._experiments[experiment_id]
            experiment.status = ExperimentStatus.PAUSED
            experiment.updated_at = datetime.now().isoformat()

            self._save_experiments()

            logger.info("experiment_paused", experiment_id=experiment_id)

            return experiment

    def end_experiment(
        self,
        experiment_id: str,
        winner: Optional[str] = None,
        promote_winner: bool = False
    ) -> Dict[str, Any]:
        """
        End an experiment.

        Args:
            experiment_id: Experiment to end
            winner: Name of winning variant (optional)
            promote_winner: Whether to promote winner to production

        Returns:
            Experiment summary with analysis
        """
        with self._lock:
            if experiment_id not in self._experiments:
                raise ValueError(f"Experiment {experiment_id} not found")

            experiment = self._experiments[experiment_id]
            experiment.status = ExperimentStatus.COMPLETED
            experiment.end_time = datetime.now().isoformat()
            experiment.updated_at = datetime.now().isoformat()

            # Get final metrics
            metrics = self.get_experiment_metrics(experiment_id)

            # Promote winner if requested
            promoted = False
            if winner and promote_winner and self.registry:
                winner_variant = next(
                    (v for v in experiment.variants if v.name == winner),
                    None
                )
                if winner_variant:
                    try:
                        self.registry.promote(winner_variant.model_version)
                        promoted = True
                        logger.info("winner_promoted",
                            experiment_id=experiment_id,
                            variant=winner,
                            model_version=winner_variant.model_version
                        )
                    except Exception as e:
                        logger.error("promotion_failed", error=str(e))

            self._save_experiments()

            result = {
                "experiment": experiment.to_dict(),
                "metrics": metrics,
                "winner": winner,
                "promoted": promoted,
            }

            logger.info("experiment_ended",
                experiment_id=experiment_id,
                winner=winner,
                promoted=promoted
            )

            return result

    def update_traffic(
        self,
        experiment_id: str,
        variant_allocations: Dict[str, float]
    ) -> ExperimentConfig:
        """
        Update traffic allocation for variants.

        Args:
            experiment_id: Experiment to update
            variant_allocations: Dict mapping variant name to new percentage

        Returns:
            Updated experiment configuration
        """
        with self._lock:
            if experiment_id not in self._experiments:
                raise ValueError(f"Experiment {experiment_id} not found")

            experiment = self._experiments[experiment_id]

            for variant in experiment.variants:
                if variant.name in variant_allocations:
                    variant.traffic_percentage = variant_allocations[variant.name]

            # Validate new allocation
            valid, errors = experiment.validate()
            if not valid:
                raise ValueError(f"Invalid traffic allocation: {'; '.join(errors)}")

            experiment.updated_at = datetime.now().isoformat()
            self._save_experiments()

            logger.info("traffic_updated",
                experiment_id=experiment_id,
                allocations=variant_allocations
            )

            return experiment

    def route_request(
        self,
        experiment_id: str,
        session_key: Optional[str] = None
    ) -> Tuple[ExperimentVariant, str]:
        """
        Route a request to a variant.

        Args:
            experiment_id: Active experiment
            session_key: Optional session key for consistent routing

        Returns:
            Tuple of (variant, model_version to use)
        """
        if experiment_id not in self._experiments:
            raise ValueError(f"Experiment {experiment_id} not found")

        experiment = self._experiments[experiment_id]

        if experiment.status != ExperimentStatus.RUNNING:
            # Use first variant (typically control/production)
            return experiment.variants[0], experiment.variants[0].model_version

        variant = self.router.route(experiment.variants, session_key)

        return variant, variant.model_version

    def record_prediction(
        self,
        experiment_id: str,
        variant_name: str,
        risk_score: int,
        confidence: float,
        latency_ms: float
    ) -> None:
        """Record a prediction for metrics collection."""
        if experiment_id not in self._metrics:
            return

        if variant_name not in self._metrics[experiment_id]:
            return

        self._metrics[experiment_id][variant_name].add_prediction(
            risk_score=risk_score,
            confidence=confidence,
            latency_ms=latency_ms
        )

    def get_experiment_metrics(
        self,
        experiment_id: str
    ) -> Dict[str, Any]:
        """Get metrics for an experiment."""
        if experiment_id not in self._experiments:
            raise ValueError(f"Experiment {experiment_id} not found")

        if experiment_id not in self._metrics:
            return {}

        experiment = self._experiments[experiment_id]
        metrics = {}

        for variant in experiment.variants:
            if variant.name in self._metrics[experiment_id]:
                metrics[variant.name] = self._metrics[experiment_id][variant.name].get_statistics()

        return metrics

    def analyze_experiment(
        self,
        experiment_id: str
    ) -> Dict[str, Any]:
        """
        Perform statistical analysis on experiment results.

        Compares variants and determines if differences are significant.
        """
        if experiment_id not in self._experiments:
            raise ValueError(f"Experiment {experiment_id} not found")

        experiment = self._experiments[experiment_id]

        if experiment_id not in self._metrics:
            return {"message": "No metrics collected yet"}

        # Get metrics for all variants
        variant_metrics = self._metrics[experiment_id]
        variants = list(variant_metrics.keys())

        if len(variants) < 2:
            return {"message": "Need at least 2 variants for comparison"}

        # Compare first two variants (typically control vs treatment)
        control = variant_metrics[variants[0]]
        treatment = variant_metrics[variants[1]]

        analysis = {
            "experiment_id": experiment_id,
            "variants": variants,
            "control": variants[0],
            "treatment": variants[1],
            "metrics_comparison": {
                "control": control.get_statistics(),
                "treatment": treatment.get_statistics(),
            },
        }

        # Statistical tests
        if control.latencies and treatment.latencies:
            analysis["latency_test"] = StatisticalAnalyzer.t_test(
                control.latencies,
                treatment.latencies
            )

        if control.risk_scores and treatment.risk_scores:
            analysis["risk_score_test"] = StatisticalAnalyzer.t_test(
                [float(s) for s in control.risk_scores],
                [float(s) for s in treatment.risk_scores]
            )

        # Recommendation
        if analysis.get("latency_test", {}).get("significant"):
            control_latency = np.mean(control.latencies) if control.latencies else 0
            treatment_latency = np.mean(treatment.latencies) if treatment.latencies else 0

            if control_latency < treatment_latency:
                analysis["recommendation"] = f"{variants[0]} has significantly lower latency"
            else:
                analysis["recommendation"] = f"{variants[1]} has significantly lower latency"
        else:
            analysis["recommendation"] = "No significant difference detected yet"

        return analysis

    def list_experiments(
        self,
        status: Optional[ExperimentStatus] = None
    ) -> List[Dict[str, Any]]:
        """List all experiments."""
        experiments = list(self._experiments.values())

        if status:
            experiments = [e for e in experiments if e.status == status]

        return [
            {
                "experiment_id": e.experiment_id,
                "name": e.name,
                "status": e.status.value,
                "variants": [v.name for v in e.variants],
                "start_time": e.start_time,
                "end_time": e.end_time,
            }
            for e in experiments
        ]

    def get_experiment(self, experiment_id: str) -> Optional[ExperimentConfig]:
        """Get experiment by ID."""
        return self._experiments.get(experiment_id)

    def get_active_experiments(self) -> List[ExperimentConfig]:
        """Get all currently running experiments."""
        return [
            e for e in self._experiments.values()
            if e.status == ExperimentStatus.RUNNING
        ]


# Global experiment manager instance
_experiment_manager: Optional[ExperimentManager] = None


def get_experiment_manager() -> ExperimentManager:
    """Get the global experiment manager instance."""
    global _experiment_manager

    if _experiment_manager is None:
        _experiment_manager = ExperimentManager()

    return _experiment_manager


def initialize_experiment_manager(
    storage_path: str = None,
    model_registry=None,
) -> ExperimentManager:
    """Initialize the global experiment manager."""
    global _experiment_manager

    _experiment_manager = ExperimentManager(
        storage_path=storage_path,
        model_registry=model_registry,
    )

    logger.info("experiment_manager_initialized")

    return _experiment_manager
