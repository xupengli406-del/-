from typing import Optional

from src.entities.model_config import ModelConfig
from src.repositories.model_config_repository import ModelConfigRepository
from src.schema.model_config_schema import (
    ModelAdminResponse,
    ModelAdminListResponse,
)


class ModelMgmtService:
    """Service for admin model management operations."""

    @staticmethod
    def _to_admin_response(config: ModelConfig) -> ModelAdminResponse:
        """Convert entity to admin response (includes all fields)."""
        return ModelAdminResponse(
            id=config.id,
            name=config.name,
            ability=config.ability,
            provider=config.provider,
            api_suffix=config.api_suffix,
            executor_class_name=config.executor_class_name,
            parameters=config.parameters,
            description=config.description,
            weight=config.weight,
            cost_rate=config.cost_rate,
            enabled=config.enabled,
            created_at=config.created_at,
            updated_at=config.updated_at,
            updated_by=config.updated_by,
        )

    @staticmethod
    def list_all(
        ability: Optional[str] = None,
        enabled: Optional[bool] = None,
    ) -> ModelAdminListResponse:
        """
        List all models (admin view, DB only, no fallback).

        Args:
            ability: Optional filter by ability type
            enabled: Optional filter by enabled status

        Returns:
            ModelAdminListResponse with all models sorted by weight

        Raises:
            DatabaseUnavailableException: When database is unavailable
        """
        configs = ModelConfigRepository.find_all(allow_fallback=False)

        if ability:
            configs = [c for c in configs if c.ability == ability]

        if enabled is not None:
            configs = [c for c in configs if c.enabled == enabled]

        # Sort by weight descending
        configs = sorted(configs, key=lambda x: x.weight, reverse=True)

        models = [ModelMgmtService._to_admin_response(c) for c in configs]

        return ModelAdminListResponse(
            models=models,
            total=len(models),
        )
