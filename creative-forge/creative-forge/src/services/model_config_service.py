from typing import Optional

from src.entities.model_config import ModelConfig
from src.repositories.model_config_repository import ModelConfigRepository
from src.schema.model_config_schema import (
    ModelResponse,
    ModelListResponse,
)


class ModelConfigService:
    """Service for user-facing model config operations."""

    @staticmethod
    def _to_response(config: ModelConfig) -> ModelResponse:
        """Convert entity to user response (excludes audit fields)."""
        return ModelResponse(
            id=config.id,
            name=config.name,
            ability=config.ability,
            provider=config.provider,
            description=config.description,
            weight=config.weight,
            cost_rate=config.cost_rate,
        )

    @staticmethod
    def list_enabled(authed_models: dict, ability: Optional[str] = None) -> ModelListResponse:
        """
        List enabled models that the user is authorised to access.

        Args:
            authed_models: Mapping of model name → [endpoint_path, ...] from user auth.
            ability: Optional filter by ability type.

        Returns:
            ModelListResponse containing only models present in authed_models,
            each enriched with the first endpoint path.
        """
        configs = ModelConfigRepository.find_enabled(allow_fallback=True)

        if ability:
            configs = [c for c in configs if c.ability == ability]

        models = []
        for config in configs:
            if config.name not in authed_models:
                continue
            models.append(ModelConfigService._to_response(config))

        return ModelListResponse(
            models=models,
            total=len(models),
        )

    @staticmethod
    def get_by_name(name: str) -> Optional[ModelConfig]:
        """
        Get model config by name (for internal use).

        Args:
            name: Model name

        Returns:
            ModelConfig if found and enabled, None otherwise
        """
        config = ModelConfigRepository.find_by_name(name, allow_fallback=True)
        if config and config.enabled:
            return config
        return None
