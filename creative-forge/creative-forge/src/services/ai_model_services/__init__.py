"""AI Model Executors registry."""
from typing import Optional, Type

from .base import BaseExecutor, ExecutionResult
from .sync_http_executor import SyncHttpExecutor
from .async_polling_executor import AsyncPollingExecutor
from .chat_completion_executor import ChatCompletionExecutor

# Legacy executors (kept for backward compatibility, will be removed)
from .seedream_executor import SeedreamExecutor
from .seedance_executor import SeedanceExecutor


# Executor class mapping (class name string -> class)
_EXECUTOR_CLASS_MAP: dict[str, Type[BaseExecutor]] = {
    # Generalized executors
    "SyncHttpExecutor": SyncHttpExecutor,
    "AsyncPollingExecutor": AsyncPollingExecutor,
    "ChatCompletionExecutor": ChatCompletionExecutor,
    # Legacy executors (deprecated)
    "SeedreamExecutor": SeedreamExecutor,
    "SeedanceExecutor": SeedanceExecutor,
}


def get_executor(model_name: str) -> tuple[BaseExecutor, "ModelConfig"]:
    """
    Get executor instance and model config for given model name.

    Loads model config from DB/config file and instantiates the appropriate executor.

    Args:
        model_name: Name of the model to get executor for

    Returns:
        Tuple of (executor instance, model config)

    Raises:
        ValueError: If model name is not found or not enabled
    """
    # Import here to avoid circular dependency
    from src.repositories.model_config_repository import ModelConfigRepository
    from src.entities.model_config import ModelConfig

    config = ModelConfigRepository.find_by_name(model_name, allow_fallback=True)

    if not config:
        # Get available model names for error message
        all_configs = ModelConfigRepository.find_enabled(allow_fallback=True)
        available = [c.name for c in all_configs]
        raise ValueError(f"Unknown model: {model_name}. Available: {available}")

    if not config.enabled:
        raise ValueError(f"Model '{model_name}' is disabled")

    executor_cls = _EXECUTOR_CLASS_MAP.get(config.executor_class_name)
    if not executor_cls:
        raise ValueError(f"Unknown executor class: {config.executor_class_name}")

    return executor_cls(), config


def get_model_config(model_name: str) -> Optional[dict]:
    """
    Get model config for given model name.

    Args:
        model_name: Name of the model

    Returns:
        Model config dict if found and enabled, None otherwise
    """
    from src.repositories.model_config_repository import ModelConfigRepository

    config = ModelConfigRepository.find_by_name(model_name, allow_fallback=True)
    if config and config.enabled:
        return config.to_dict()
    return None


__all__ = [
    "BaseExecutor",
    "ExecutionResult",
    "SyncHttpExecutor",
    "AsyncPollingExecutor",
    "ChatCompletionExecutor",
    "SeedreamExecutor",
    "SeedanceExecutor",
    "get_executor",
    "get_model_config",
]
