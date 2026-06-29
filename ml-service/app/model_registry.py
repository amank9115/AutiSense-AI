"""
Model Registry for ML Service.

Manages the lifecycle of ML models through stages:
- staging: Newly trained models awaiting validation
- production: Currently serving model
- archived: Previous production models available for rollback

Features:
- Version tracking with metadata
- Stage transitions (promote/demote)
- Atomic model switching
- Rollback capabilities
- A/B test support
"""

from __future__ import annotations

import json
import os
import shutil
import threading
import time
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional

import structlog

logger = structlog.get_logger()


class ModelStage(str, Enum):
    """Model lifecycle stages."""
    STAGING = "staging"
    PRODUCTION = "production"
    ARCHIVED = "archived"


class ModelRegistry:
    """
    Model registry for managing model lifecycle.

    Thread-safe implementation with atomic stage transitions.
    """

    def __init__(self, registry_path: str = None):
        if registry_path is None:
            registry_path = os.path.join(
                os.path.dirname(__file__),
                "models",
                "registry.json"
            )

        self.registry_path = Path(registry_path)
        self.registry_dir = self.registry_path.parent
        self.registry_dir.mkdir(parents=True, exist_ok=True)

        self._lock = threading.RLock()
        self._cache: Optional[Dict[str, Any]] = None

        # Initialize registry file if it doesn't exist
        if not self.registry_path.exists():
            self._save_registry({
                "models": {},
                "production_version": None,
                "staging_versions": [],
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            })

    def _load_registry(self) -> Dict[str, Any]:
        """Load registry from disk."""
        try:
            with open(self.registry_path, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error("registry_load_failed", error=str(e))
            return {
                "models": {},
                "production_version": None,
                "staging_versions": [],
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            }

    def _save_registry(self, data: Dict[str, Any]) -> None:
        """Save registry to disk atomically."""
        data["updated_at"] = datetime.now().isoformat()

        # Write to temp file first, then rename (atomic on Unix, near-atomic on Windows)
        temp_path = self.registry_path.with_suffix(".tmp")
        with open(temp_path, "w") as f:
            json.dump(data, f, indent=2)

        shutil.move(str(temp_path), str(self.registry_path))
        self._cache = data

    def register(
        self,
        version: str,
        model_path: str,
        metadata: Dict[str, Any],
        stage: ModelStage = ModelStage.STAGING
    ) -> Dict[str, Any]:
        """
        Register a new model version.

        Args:
            version: Unique version identifier (e.g., "v20240627_abc123")
            model_path: Path to the model file
            metadata: Model metadata (accuracy, roc_auc, training params, etc.)
            stage: Initial stage (default: staging)

        Returns:
            Registered model entry
        """
        with self._lock:
            registry = self._load_registry()

            if version in registry["models"]:
                logger.warning("model_version_exists", version=version)
                raise ValueError(f"Model version {version} already exists in registry")

            entry = {
                "version": version,
                "model_path": model_path,
                "metadata": metadata,
                "stage": stage.value,
                "registered_at": datetime.now().isoformat(),
                "promoted_at": None,
                "prediction_count": 0,
                "last_prediction_at": None,
            }

            registry["models"][version] = entry

            if stage == ModelStage.STAGING:
                registry["staging_versions"].append(version)

            self._save_registry(registry)

            logger.info("model_registered",
                version=version,
                stage=stage.value,
                accuracy=metadata.get("accuracy"),
                roc_auc=metadata.get("roc_auc")
            )

            return entry

    def promote(self, version: str) -> Dict[str, Any]:
        """
        Promote a model to production.

        Atomically transitions:
        - Current production model → archived
        - Specified model → production

        Args:
            version: Version to promote

        Returns:
            Updated model entry
        """
        with self._lock:
            registry = self._load_registry()

            if version not in registry["models"]:
                raise ValueError(f"Model version {version} not found in registry")

            entry = registry["models"][version]

            if entry["stage"] == ModelStage.PRODUCTION.value:
                logger.info("model_already_production", version=version)
                return entry

            # Archive current production model
            current_prod = registry["production_version"]
            if current_prod and current_prod in registry["models"]:
                registry["models"][current_prod]["stage"] = ModelStage.ARCHIVED.value
                logger.info("model_archived", version=current_prod)

            # Promote new model
            entry["stage"] = ModelStage.PRODUCTION.value
            entry["promoted_at"] = datetime.now().isoformat()

            registry["production_version"] = version

            # Remove from staging if present
            if version in registry["staging_versions"]:
                registry["staging_versions"].remove(version)

            self._save_registry(registry)

            logger.info("model_promoted",
                version=version,
                previous_production=current_prod,
                accuracy=entry["metadata"].get("accuracy"),
                roc_auc=entry["metadata"].get("roc_auc")
            )

            return entry

    def rollback(self, steps: int = 1) -> Optional[Dict[str, Any]]:
        """
        Rollback to a previous model version.

        Args:
            steps: Number of versions to rollback (default: 1 = previous version)

        Returns:
            New production model entry, or None if no archived models available
        """
        with self._lock:
            registry = self._load_registry()

            # Find archived models, sorted by promotion date (most recent first)
            archived = [
                m for m in registry["models"].values()
                if m["stage"] == ModelStage.ARCHIVED.value and m["promoted_at"]
            ]
            archived.sort(key=lambda x: x["promoted_at"], reverse=True)

            if not archived or len(archived) < steps:
                logger.warning("rollback_no_archived_models", steps=steps)
                return None

            target = archived[steps - 1]
            return self.promote(target["version"])

    def demote(self, version: str) -> Dict[str, Any]:
        """
        Demote a staging model to archived (skip production).

        Args:
            version: Version to demote

        Returns:
            Updated model entry
        """
        with self._lock:
            registry = self._load_registry()

            if version not in registry["models"]:
                raise ValueError(f"Model version {version} not found in registry")

            entry = registry["models"][version]
            entry["stage"] = ModelStage.ARCHIVED.value

            if version in registry["staging_versions"]:
                registry["staging_versions"].remove(version)

            self._save_registry(registry)

            logger.info("model_demoted", version=version)

            return entry

    def get(self, version: str) -> Optional[Dict[str, Any]]:
        """Get model entry by version."""
        registry = self._load_registry()
        return registry["models"].get(version)

    def get_production(self) -> Optional[Dict[str, Any]]:
        """Get current production model."""
        registry = self._load_registry()
        prod_version = registry.get("production_version")
        if prod_version:
            return registry["models"].get(prod_version)
        return None

    def get_staging(self) -> List[Dict[str, Any]]:
        """Get all staging models."""
        registry = self._load_registry()
        return [
            registry["models"][v]
            for v in registry.get("staging_versions", [])
            if v in registry["models"]
        ]

    def get_archived(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get archived models (most recent first)."""
        registry = self._load_registry()
        archived = [
            m for m in registry["models"].values()
            if m["stage"] == ModelStage.ARCHIVED.value
        ]
        archived.sort(key=lambda x: x.get("promoted_at", ""), reverse=True)
        return archived[:limit]

    def list_all(self, stage: Optional[ModelStage] = None) -> List[Dict[str, Any]]:
        """
        List all registered models.

        Args:
            stage: Filter by stage (optional)

        Returns:
            List of model entries
        """
        registry = self._load_registry()
        models = list(registry["models"].values())

        if stage:
            models = [m for m in models if m["stage"] == stage.value]

        # Sort by registration date (newest first)
        models.sort(key=lambda x: x["registered_at"], reverse=True)

        return models

    def record_prediction(self, version: str) -> None:
        """Record that a prediction was made with this model version."""
        with self._lock:
            registry = self._load_registry()

            if version in registry["models"]:
                registry["models"][version]["prediction_count"] += 1
                registry["models"][version]["last_prediction_at"] = datetime.now().isoformat()
                self._save_registry(registry)

    def delete(self, version: str) -> bool:
        """
        Delete a model from the registry.

        Cannot delete production models.

        Args:
            version: Version to delete

        Returns:
            True if deleted, False if not found or is production
        """
        with self._lock:
            registry = self._load_registry()

            if version not in registry["models"]:
                return False

            entry = registry["models"][version]

            if entry["stage"] == ModelStage.PRODUCTION.value:
                logger.warning("cannot_delete_production_model", version=version)
                return False

            # Delete model files
            model_path = entry.get("model_path")
            if model_path and os.path.exists(model_path):
                try:
                    os.remove(model_path)
                    # Also try to delete metadata file
                    meta_path = model_path.replace("asd_model_", "asd_metadata_")
                    if os.path.exists(meta_path):
                        os.remove(meta_path)
                except Exception as e:
                    logger.error("model_file_delete_failed", error=str(e))

            # Remove from registry
            del registry["models"][version]

            if version in registry.get("staging_versions", []):
                registry["staging_versions"].remove(version)

            self._save_registry(registry)

            logger.info("model_deleted", version=version)

            return True

    def compare(
        self,
        version_a: str,
        version_b: str
    ) -> Dict[str, Any]:
        """
        Compare two model versions.

        Returns metadata comparison and performance metrics.
        """
        registry = self._load_registry()

        model_a = registry["models"].get(version_a)
        model_b = registry["models"].get(version_b)

        if not model_a or not model_b:
            raise ValueError("One or both model versions not found")

        meta_a = model_a["metadata"]
        meta_b = model_b["metadata"]

        return {
            "version_a": version_a,
            "version_b": version_b,
            "accuracy_diff": (meta_b.get("accuracy", 0) - meta_a.get("accuracy", 0)),
            "roc_auc_diff": (meta_b.get("roc_auc", 0) - meta_a.get("roc_auc", 0)),
            "prediction_count_a": model_a["prediction_count"],
            "prediction_count_b": model_b["prediction_count"],
            "stage_a": model_a["stage"],
            "stage_b": model_b["stage"],
            "registered_a": model_a["registered_at"],
            "registered_b": model_b["registered_at"],
            "metadata_a": meta_a,
            "metadata_b": meta_b,
        }

    def stats(self) -> Dict[str, Any]:
        """Get registry statistics."""
        registry = self._load_registry()

        models = registry["models"].values()

        return {
            "total_models": len(models),
            "production_count": sum(1 for m in models if m["stage"] == ModelStage.PRODUCTION.value),
            "staging_count": sum(1 for m in models if m["stage"] == ModelStage.STAGING.value),
            "archived_count": sum(1 for m in models if m["stage"] == ModelStage.ARCHIVED.value),
            "total_predictions": sum(m["prediction_count"] for m in models),
            "production_version": registry.get("production_version"),
            "staging_versions": registry.get("staging_versions", []),
            "registry_created": registry.get("created_at"),
            "registry_updated": registry.get("updated_at"),
        }


# Global registry instance
_registry: Optional[ModelRegistry] = None
_registry_lock = threading.Lock()


def get_registry() -> ModelRegistry:
    """Get the global model registry instance."""
    global _registry

    if _registry is None:
        with _registry_lock:
            if _registry is None:
                _registry = ModelRegistry()

    return _registry
