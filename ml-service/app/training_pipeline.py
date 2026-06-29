"""
Training Pipeline DAG (Directed Acyclic Graph) for ML Service.

Defines a structured, reproducible training workflow with stages:
1. Data Validation - Check data quality and consistency
2. Feature Engineering - Transform and prepare features
3. Model Training - Train the model
4. Model Validation - Validate model performance
5. Model Registration - Register model to registry
6. Model Deployment - Deploy model to production (optional)

Each stage is:
- Idempotent: Can be run multiple times safely
- Independently testable: Can validate stage outputs
- Observable: Logs metrics and status at each step
- Recoverable: Can resume from failed stage
"""

from __future__ import annotations

import json
import os
import time
import traceback
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

import structlog

logger = structlog.get_logger()


class StageStatus(str, Enum):
    """Status of a pipeline stage."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class PipelineStatus(str, Enum):
    """Status of the entire pipeline."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class StageResult:
    """Result of a pipeline stage execution."""
    stage_name: str
    status: StageStatus
    start_time: str
    end_time: Optional[str] = None
    duration_seconds: Optional[float] = None
    output: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    metrics: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PipelineResult:
    """Result of the entire pipeline execution."""
    pipeline_id: str
    status: PipelineStatus
    start_time: str
    end_time: Optional[str] = None
    duration_seconds: Optional[float] = None
    stages: List[StageResult] = field(default_factory=list)
    artifacts: Dict[str, str] = field(default_factory=dict)
    error: Optional[str] = None


class PipelineStage(ABC):
    """Abstract base class for pipeline stages."""

    def __init__(self, name: str, description: str = ""):
        self.name = name
        self.description = description

    @abstractmethod
    def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the stage.

        Args:
            context: Pipeline context with data from previous stages

        Returns:
            Stage output to add to context
        """
        pass

    @abstractmethod
    def validate(self, context: Dict[str, Any]) -> bool:
        """
        Validate stage preconditions.

        Args:
            context: Current pipeline context

        Returns:
            True if stage can run, False to skip
        """
        pass

    def on_failure(self, context: Dict[str, Any], error: Exception) -> None:
        """Called when stage fails. Override for cleanup."""
        pass


class DataValidationStage(PipelineStage):
    """Validate input data quality and consistency."""

    def __init__(self, data_path: str):
        super().__init__(
            name="data_validation",
            description="Validate input data quality and consistency"
        )
        self.data_path = data_path

    def validate(self, context: Dict[str, Any]) -> bool:
        """Check if data file exists."""
        return os.path.exists(self.data_path)

    def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Validate data quality."""
        import pandas as pd

        logger.info("data_validation_start", path=self.data_path)

        # Load data
        df = pd.read_csv(self.data_path, na_values="?")

        # Validation checks
        checks = {
            "row_count": len(df),
            "column_count": len(df.columns),
            "missing_values": df.isnull().sum().sum(),
            "missing_percentage": round(df.isnull().sum().sum() / (len(df) * len(df.columns)) * 100, 2),
        }

        # Check target column
        target_col = "Class/ASD"
        if target_col in df.columns:
            checks["target_distribution"] = df[target_col].value_counts().to_dict()
            checks["class_balance"] = round(df[target_col].value_counts(normalize=True).min() * 100, 2)

        # Check for required columns
        required_cols = [f"A{i}_Score" for i in range(1, 11)]
        missing_cols = [col for col in required_cols if col not in df.columns]
        checks["missing_required_columns"] = missing_cols

        if missing_cols:
            raise ValueError(f"Missing required columns: {missing_cols}")

        logger.info("data_validation_complete", **checks)

        return {
            "data_path": self.data_path,
            "validation": checks,
            "dataframe": df,
        }


class FeatureEngineeringStage(PipelineStage):
    """Engineer features from raw data."""

    def __init__(self, output_path: Optional[str] = None):
        super().__init__(
            name="feature_engineering",
            description="Transform and prepare features"
        )
        self.output_path = output_path

    def validate(self, context: Dict[str, Any]) -> bool:
        """Check if data validation completed."""
        return "data_validation" in context

    def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Engineer features."""
        import numpy as np
        import pandas as pd

        logger.info("feature_engineering_start")

        df = context["data_validation"]["dataframe"]

        features = []
        feature_names = []

        for _, row in df.iterrows():
            feat = {}

            # AQ-10 scores (primary features)
            for i in range(1, 11):
                col = f"A{i}_Score"
                feat[col] = float(row.get(col, 0))

            # AQ-10 total score
            aq_cols = [f"A{i}_Score" for i in range(1, 11)]
            feat["aq_total"] = sum(feat.get(c, 0) for c in aq_cols)

            # Demographic features
            feat["has_jaundice"] = 1.0 if str(row.get("jaundice", "")).lower() == "yes" else 0.0
            feat["family_autism"] = 1.0 if str(row.get("austim", "")).lower() == "yes" else 0.0
            feat["gender_m"] = 1.0 if str(row.get("gender", "")).lower() == "m" else 0.0

            try:
                feat["age_norm"] = min(float(row.get("age", 7)) / 18.0, 1.0)
            except (ValueError, TypeError):
                feat["age_norm"] = 0.4

            features.append(feat)

        feature_df = pd.DataFrame(features).fillna(0.0)
        feature_names = feature_df.columns.tolist()

        # Encode labels
        target_col = "Class/ASD"
        raw_labels = df[target_col] if target_col in df.columns else df["Class/ASD"]
        labels = np.array([
            1 if str(v).upper() in ("YES", "1", "ASD") else 0
            for v in raw_labels
        ])

        logger.info("feature_engineering_complete",
            feature_count=len(feature_names),
            sample_count=len(features),
            positive_rate=labels.mean()
        )

        return {
            "features": feature_df.values,
            "labels": labels,
            "feature_names": feature_names,
            "feature_df": feature_df,
        }


class ModelTrainingStage(PipelineStage):
    """Train the ML model."""

    def __init__(
        self,
        model_type: str = "random_forest",
        hyperparams: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            name="model_training",
            description="Train the ML model"
        )
        self.model_type = model_type
        self.hyperparams = hyperparams or {}

    def validate(self, context: Dict[str, Any]) -> bool:
        """Check if features are prepared."""
        return "feature_engineering" in context

    def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Train the model."""
        import numpy as np
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.model_selection import cross_val_score, StratifiedKFold, train_test_split
        from sklearn.pipeline import Pipeline
        from sklearn.impute import SimpleImputer
        from sklearn.preprocessing import StandardScaler
        from sklearn.metrics import accuracy_score, roc_auc_score, classification_report

        logger.info("model_training_start", model_type=self.model_type)

        X = context["feature_engineering"]["features"]
        y = context["feature_engineering"]["labels"]
        feature_names = context["feature_engineering"]["feature_names"]

        # Train-test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        # Default hyperparameters
        default_params = {
            "n_estimators": 200,
            "max_depth": 8,
            "min_samples_split": 4,
            "min_samples_leaf": 2,
            "class_weight": "balanced",
            "random_state": 42,
            "n_jobs": -1,
        }
        params = {**default_params, **self.hyperparams}

        # Create pipeline
        pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="mean")),
            ("scaler", StandardScaler()),
            ("model", RandomForestClassifier(**params)),
        ])

        # Cross-validation
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_scores = cross_val_score(pipeline, X, y, cv=cv, scoring="roc_auc")

        # Train on full training data
        pipeline.fit(X_train, y_train)

        # Evaluate
        y_pred = pipeline.predict(X_test)
        y_proba = pipeline.predict_proba(X_test)[:, 1]

        accuracy = accuracy_score(y_test, y_pred)
        roc_auc = roc_auc_score(y_test, y_proba)

        # Feature importance
        rf_model = pipeline.named_steps["model"]
        importances = rf_model.feature_importances_
        feature_importance = dict(zip(feature_names, importances))

        metrics = {
            "accuracy": float(accuracy),
            "roc_auc": float(roc_auc),
            "cv_auc_mean": float(cv_scores.mean()),
            "cv_auc_std": float(cv_scores.std()),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
        }

        logger.info("model_training_complete", **metrics)

        return {
            "pipeline": pipeline,
            "metrics": metrics,
            "feature_importance": feature_importance,
            "X_test": X_test,
            "y_test": y_test,
            "y_pred": y_pred,
            "y_proba": y_proba,
        }


class ModelValidationStage(PipelineStage):
    """Validate model meets performance thresholds."""

    def __init__(
        self,
        min_accuracy: float = 0.75,
        min_roc_auc: float = 0.80
    ):
        super().__init__(
            name="model_validation",
            description="Validate model performance"
        )
        self.min_accuracy = min_accuracy
        self.min_roc_auc = min_roc_auc

    def validate(self, context: Dict[str, Any]) -> bool:
        """Check if model training completed."""
        return "model_training" in context

    def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Validate model performance."""
        metrics = context["model_training"]["metrics"]

        logger.info("model_validation_start",
            min_accuracy=self.min_accuracy,
            min_roc_auc=self.min_roc_auc
        )

        validations = []

        # Check accuracy
        if metrics["accuracy"] >= self.min_accuracy:
            validations.append({
                "check": "accuracy",
                "passed": True,
                "value": metrics["accuracy"],
                "threshold": self.min_accuracy,
            })
        else:
            validations.append({
                "check": "accuracy",
                "passed": False,
                "value": metrics["accuracy"],
                "threshold": self.min_accuracy,
            })

        # Check ROC-AUC
        if metrics["roc_auc"] >= self.min_roc_auc:
            validations.append({
                "check": "roc_auc",
                "passed": True,
                "value": metrics["roc_auc"],
                "threshold": self.min_roc_auc,
            })
        else:
            validations.append({
                "check": "roc_auc",
                "passed": False,
                "value": metrics["roc_auc"],
                "threshold": self.min_roc_auc,
            })

        all_passed = all(v["passed"] for v in validations)

        if not all_passed:
            failed = [v["check"] for v in validations if not v["passed"]]
            raise ValueError(f"Model validation failed for: {', '.join(failed)}")

        logger.info("model_validation_complete", all_passed=all_passed)

        return {
            "validations": validations,
            "all_passed": all_passed,
        }


class ModelRegistrationStage(PipelineStage):
    """Register model to the model registry."""

    def __init__(self, registry, stage: str = "staging"):
        super().__init__(
            name="model_registration",
            description="Register model to registry"
        )
        self.registry = registry
        self.stage = stage

    def validate(self, context: Dict[str, Any]) -> bool:
        """Check if model validation passed."""
        return "model_validation" in context and context["model_validation"]["all_passed"]

    def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Register the model."""
        import joblib
        from datetime import datetime

        logger.info("model_registration_start")

        pipeline = context["model_training"]["pipeline"]
        metrics = context["model_training"]["metrics"]
        feature_names = context["feature_engineering"]["feature_names"]

        # Generate version
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        version = f"v{timestamp}"

        # Save model files
        model_dir = Path(os.path.dirname(__file__)) / "models"
        model_dir.mkdir(parents=True, exist_ok=True)

        model_path = model_dir / f"asd_model_{version}.pkl"
        metadata_path = model_dir / f"asd_metadata_{version}.pkl"

        joblib.dump(pipeline, model_path)
        joblib.dump({
            "model_version": version,
            "feature_names": feature_names,
            "trained_at": datetime.now().isoformat(),
            **metrics,
        }, metadata_path)

        # Register to registry
        from app.model_registry import ModelStage

        stage_enum = ModelStage.STAGING if self.stage == "staging" else ModelStage.PRODUCTION

        entry = self.registry.register(
            version=version,
            model_path=str(model_path),
            metadata=metrics,
            stage=stage_enum
        )

        logger.info("model_registration_complete", version=version)

        return {
            "version": version,
            "model_path": str(model_path),
            "metadata_path": str(metadata_path),
            "registry_entry": entry,
        }


class TrainingPipeline:
    """
    Training pipeline orchestrator.

    Manages execution of pipeline stages with:
    - Sequential stage execution
    - Stage validation
    - Error handling and recovery
    - Metrics tracking
    - Result persistence
    """

    def __init__(
        self,
        name: str = "default",
        stages: List[PipelineStage] = None,
        artifact_dir: str = None
    ):
        self.name = name
        self.stages = stages or []
        self.artifact_dir = Path(artifact_dir or os.path.join(
            os.path.dirname(__file__),
            "pipeline_runs"
        ))
        self.artifact_dir.mkdir(parents=True, exist_ok=True)

        self._context: Dict[str, Any] = {}
        self._result: Optional[PipelineResult] = None

    def add_stage(self, stage: PipelineStage) -> "TrainingPipeline":
        """Add a stage to the pipeline."""
        self.stages.append(stage)
        return self

    def run(self, resume_from: Optional[str] = None) -> PipelineResult:
        """
        Execute the pipeline.

        Args:
            resume_from: Optional stage name to resume from

        Returns:
            Pipeline execution result
        """
        pipeline_id = f"run_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        result = PipelineResult(
            pipeline_id=pipeline_id,
            status=PipelineStatus.RUNNING,
            start_time=datetime.now().isoformat(),
        )

        logger.info("pipeline_start",
            pipeline_id=pipeline_id,
            stages=[s.name for s in self.stages]
        )

        # Load previous context if resuming
        if resume_from:
            self._load_context(pipeline_id)

        skip_until = resume_from is not None

        for stage in self.stages:
            # Skip stages until resume point
            if skip_until:
                if stage.name == resume_from:
                    skip_until = False
                else:
                    continue

            stage_result = self._execute_stage(stage)

            result.stages.append(stage_result)

            if stage_result.status == StageStatus.FAILED:
                result.status = PipelineStatus.FAILED
                result.error = stage_result.error
                result.end_time = datetime.now().isoformat()
                result.duration_seconds = (
                    datetime.fromisoformat(result.end_time) -
                    datetime.fromisoformat(result.start_time)
                ).total_seconds()

                # Save result for recovery
                self._save_result(result)

                logger.error("pipeline_failed",
                    pipeline_id=pipeline_id,
                    stage=stage.name,
                    error=stage_result.error
                )

                return result

        # All stages completed
        result.status = PipelineStatus.COMPLETED
        result.end_time = datetime.now().isoformat()
        result.duration_seconds = (
            datetime.fromisoformat(result.end_time) -
            datetime.fromisoformat(result.start_time)
        ).total_seconds()

        # Save final result
        self._save_result(result)

        logger.info("pipeline_complete",
            pipeline_id=pipeline_id,
            duration_seconds=result.duration_seconds
        )

        self._result = result
        return result

    def _execute_stage(self, stage: PipelineStage) -> StageResult:
        """Execute a single stage."""
        stage_result = StageResult(
            stage_name=stage.name,
            status=StageStatus.RUNNING,
            start_time=datetime.now().isoformat(),
        )

        logger.info("stage_start", stage=stage.name)

        try:
            # Validate preconditions
            if not stage.validate(self._context):
                stage_result.status = StageStatus.SKIPPED
                stage_result.end_time = datetime.now().isoformat()
                stage_result.duration_seconds = 0

                logger.info("stage_skipped", stage=stage.name)

                return stage_result

            # Execute stage
            output = stage.execute(self._context)

            # Store output in context
            self._context[stage.name] = output

            stage_result.status = StageStatus.COMPLETED
            stage_result.output = {k: str(v) for k, v in output.items() if not callable(v)}

            # Extract metrics if available
            if isinstance(output, dict) and "metrics" in output:
                stage_result.metrics = output["metrics"]

        except Exception as e:
            stage_result.status = StageStatus.FAILED
            stage_result.error = f"{type(e).__name__}: {str(e)}"

            # Call failure handler
            stage.on_failure(self._context, e)

            logger.error("stage_failed",
                stage=stage.name,
                error=stage_result.error,
                traceback=traceback.format_exc()
            )

        finally:
            stage_result.end_time = datetime.now().isoformat()
            stage_result.duration_seconds = (
                datetime.fromisoformat(stage_result.end_time) -
                datetime.fromisoformat(stage_result.start_time)
            ).total_seconds()

        return stage_result

    def _save_result(self, result: PipelineResult) -> None:
        """Save pipeline result to disk."""
        result_path = self.artifact_dir / f"{result.pipeline_id}.json"

        result_dict = {
            "pipeline_id": result.pipeline_id,
            "status": result.status.value,
            "start_time": result.start_time,
            "end_time": result.end_time,
            "duration_seconds": result.duration_seconds,
            "error": result.error,
            "stages": [
                {
                    "stage_name": s.stage_name,
                    "status": s.status.value,
                    "start_time": s.start_time,
                    "end_time": s.end_time,
                    "duration_seconds": s.duration_seconds,
                    "error": s.error,
                    "metrics": s.metrics,
                }
                for s in result.stages
            ],
        }

        with open(result_path, "w") as f:
            json.dump(result_dict, f, indent=2)

    def _load_context(self, pipeline_id: str) -> None:
        """Load context from a previous run (for resuming)."""
        result_path = self.artifact_dir / f"{pipeline_id}.json"

        if not result_path.exists():
            logger.warning("no_saved_context", pipeline_id=pipeline_id)
            return

        with open(result_path, "r") as f:
            saved = json.load(f)

        # Load completed stages into context
        for stage in saved.get("stages", []):
            if stage["status"] == "completed":
                self._context[stage["stage_name"]] = {"restored": True}

        logger.info("context_loaded",
            pipeline_id=pipeline_id,
            stages=list(self._context.keys())
        )

    def get_context(self) -> Dict[str, Any]:
        """Get current pipeline context."""
        return self._context.copy()


def create_default_pipeline(
    data_path: str,
    registry,
    min_accuracy: float = 0.75,
    min_roc_auc: float = 0.80,
) -> TrainingPipeline:
    """
    Create a default training pipeline.

    Args:
        data_path: Path to training data
        registry: Model registry instance
        min_accuracy: Minimum accuracy threshold
        min_roc_auc: Minimum ROC-AUC threshold

    Returns:
        Configured training pipeline
    """
    pipeline = TrainingPipeline(name="asd_training")

    # Add stages
    pipeline.add_stage(DataValidationStage(data_path))
    pipeline.add_stage(FeatureEngineeringStage())
    pipeline.add_stage(ModelTrainingStage())
    pipeline.add_stage(ModelValidationStage(min_accuracy, min_roc_auc))
    pipeline.add_stage(ModelRegistrationStage(registry))

    return pipeline
