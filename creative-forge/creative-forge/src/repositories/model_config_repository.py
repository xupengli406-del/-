import json
import os
from typing import Optional

from src.entities.model_config import ModelConfig
from src.exceptions.business_exception import DatabaseUnavailableException


# Config file path
_CONFIG_FILE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "config",
    "model_registry.json"
)


class ModelConfigRepository:
    """Data access layer for ModelConfig entity."""

    @staticmethod
    def _load_from_db() -> list[ModelConfig]:
        """
        Load model configs from database.

        Returns:
            List of ModelConfig entities

        Raises:
            DatabaseUnavailableException: When database is not available
        """
        # TODO: Implement database connection
        # For now, always raise to trigger fallback
        raise DatabaseUnavailableException("Database not configured")

    @staticmethod
    def _load_from_file() -> list[ModelConfig]:
        """
        Load model configs from local JSON file.

        Returns:
            List of ModelConfig entities
        """
        if not os.path.exists(_CONFIG_FILE_PATH):
            return []

        with open(_CONFIG_FILE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        return [ModelConfig.from_dict(item) for item in data]

    @staticmethod
    def find_all(allow_fallback: bool = True) -> list[ModelConfig]:
        """
        Find all model configs.

        Args:
            allow_fallback: If True, fallback to local file when DB unavailable.
                          If False, raise exception when DB unavailable.

        Returns:
            List of ModelConfig entities

        Raises:
            DatabaseUnavailableException: When DB unavailable and fallback disabled
        """
        try:
            return ModelConfigRepository._load_from_db()
        except DatabaseUnavailableException:
            if allow_fallback:
                return ModelConfigRepository._load_from_file()
            raise

    @staticmethod
    def find_by_name(name: str, allow_fallback: bool = True) -> Optional[ModelConfig]:
        """
        Find model config by name.

        Args:
            name: Model name to find
            allow_fallback: If True, fallback to local file when DB unavailable

        Returns:
            ModelConfig if found, None otherwise
        """
        configs = ModelConfigRepository.find_all(allow_fallback=allow_fallback)
        for config in configs:
            if config.name == name:
                return config
        return None

    @staticmethod
    def find_enabled(allow_fallback: bool = True) -> list[ModelConfig]:
        """
        Find all enabled model configs.

        Args:
            allow_fallback: If True, fallback to local file when DB unavailable

        Returns:
            List of enabled ModelConfig entities, sorted by weight descending
        """
        configs = ModelConfigRepository.find_all(allow_fallback=allow_fallback)
        enabled = [c for c in configs if c.enabled]
        return sorted(enabled, key=lambda x: x.weight, reverse=True)

    @staticmethod
    def find_by_ability(ability: str, allow_fallback: bool = True) -> list[ModelConfig]:
        """
        Find model configs by ability type.

        Args:
            ability: Ability type (e.g., "text2img", "text2video")
            allow_fallback: If True, fallback to local file when DB unavailable

        Returns:
            List of ModelConfig entities with matching ability
        """
        configs = ModelConfigRepository.find_all(allow_fallback=allow_fallback)
        return [c for c in configs if c.ability == ability]
