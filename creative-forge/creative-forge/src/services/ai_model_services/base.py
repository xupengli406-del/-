"""Base classes for AI model executors."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class ExecutionResult:
    """Result of model execution."""
    success: bool
    content_url: Optional[str] = None
    content_b64: Optional[str] = None
    text: Optional[str] = None
    size: Optional[str] = None
    error: Optional[str] = None


class BaseExecutor(ABC):
    """Abstract base class for model executors."""

    @abstractmethod
    async def execute(
        self,
        prompt: str,
        size: Optional[str] = None,
        response_format: str = "url",
        **kwargs,
    ) -> ExecutionResult:
        """
        Execute the model with given parameters.

        Args:
            prompt: Text prompt for generation
            size: Output size (e.g., "2K", "2048x2048")
            response_format: Output format ("url" or "b64_json")
            **kwargs: Additional model-specific parameters

        Returns:
            ExecutionResult with generated content or error
        """
        pass
