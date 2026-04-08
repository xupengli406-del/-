"""Synchronous HTTP executor for direct request-response models."""
import os
from typing import Optional

import httpx

from src.entities.model_config import ModelConfig
from .base import BaseExecutor, ExecutionResult


class SyncHttpExecutor(BaseExecutor):
    """
    Executor for synchronous HTTP API calls.

    Used for models that return results directly in the response (e.g., text2img).
    """

    def __init__(self, timeout: float = 120.0):
        """
        Initialize sync HTTP executor.

        Args:
            timeout: Request timeout in seconds
        """
        self.timeout = timeout

    def _get_api_key(self, model_config: ModelConfig, override: Optional[str] = None) -> str:
        """Get API key: use override if provided, else fall back to environment variable."""
        if override:
            return override
        env_key = f"{model_config.provider.upper()}_API_KEY"
        api_key = os.getenv(env_key)
        if not api_key:
            # Fallback to generic key
            api_key = os.getenv("AI_API_KEY")
        if not api_key:
            raise ValueError(f"API key not configured. Set {env_key} or AI_API_KEY")
        return api_key

    def _get_endpoint_path(self, model_config: ModelConfig, override: Optional[str] = None) -> str:
        """Get endpoint path: use override if provided, else fall back to environment variable."""
        if override:
            return override
        env_key = f"{model_config.provider.upper()}_ENDPOINT_PATH"
        endpoint_path = os.getenv(env_key)
        if not endpoint_path:
            endpoint_path = os.getenv("AI_ENDPOINT_PATH")
        if not endpoint_path:
            raise ValueError(f"Endpoint path not configured. Set {env_key} or AI_ENDPOINT_PATH")
        return endpoint_path

    def _get_base_url(self, model_config: ModelConfig) -> str:
        """Get base URL from environment based on provider."""
        env_key = f"{model_config.provider.upper()}_BASE_URL"
        base_url = os.getenv(env_key)
        if not base_url:
            base_url = os.getenv("AI_BASE_URL", "https://genaiapipre.cloudsway.net")
        return base_url

    def _build_url(self, model_config: ModelConfig, endpoint_path: Optional[str] = None) -> str:
        """Build full API URL from config."""
        base_url = self._get_base_url(model_config)
        ep = self._get_endpoint_path(model_config, override=endpoint_path)
        return f"{base_url}/v1/ai/{ep}{model_config.api_suffix}"

    def _build_payload(
        self,
        model_config: ModelConfig,
        prompt: str,
        size: Optional[str],
        response_format: str,
        **kwargs,
    ) -> dict:
        """Build request payload."""
        # Start with default parameters from config
        payload = dict(model_config.parameters)

        # Override with request parameters
        payload["prompt"] = prompt
        payload["response_format"] = response_format

        if size:
            payload["size"] = size

        # Add any additional kwargs
        for key in ["watermark", "image", "optimize_prompt_options", "sequential_image_generation", "sequential_image_generation_options", "output_format", "stream"]:
            if key in kwargs:
                payload[key] = kwargs[key]

        return payload

    def _parse_response(self, result: dict) -> ExecutionResult:
        """Parse API response to ExecutionResult."""
        data = result.get("data", [])

        if not data:
            return ExecutionResult(
                success=False,
                error="No data in response",
            )

        first_item = data[0]
        return ExecutionResult(
            success=True,
            content_url=first_item.get("url"),
            content_b64=first_item.get("b64_json"),
            size=first_item.get("size"),
        )

    async def execute(
        self,
        prompt: str,
        size: Optional[str] = None,
        response_format: str = "url",
        **kwargs,
    ) -> ExecutionResult:
        """
        Execute synchronous HTTP request.

        Args:
            prompt: Text prompt for generation
            size: Output size
            response_format: "url" or "b64_json"
            **kwargs: Additional parameters including:
                - model_config: ModelConfig instance (required)
                - watermark: bool
                - image: str or list[str] for image-to-image

        Returns:
            ExecutionResult with generated content or error
        """
        model_config: ModelConfig = kwargs.get("model_config")
        if not model_config:
            return ExecutionResult(success=False, error="model_config is required")

        try:
            url = self._build_url(model_config, endpoint_path=kwargs.get("endpoint_path"))
            api_key = self._get_api_key(model_config, override=kwargs.get("ak"))
            build_kwargs = {k: v for k, v in kwargs.items() if k not in ("model_config", "endpoint_path", "ak")}
            payload = self._build_payload(model_config, prompt, size, response_format, **build_kwargs)

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            }

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload, headers=headers)

                if response.status_code != 200:
                    error_body = response.json() if response.content else {}
                    error_msg = error_body.get("error", {}).get("message", response.text)
                    return ExecutionResult(
                        success=False,
                        error=f"API error ({response.status_code}): {error_msg}",
                    )

                return self._parse_response(response.json())

        except httpx.TimeoutException:
            return ExecutionResult(success=False, error="Request timed out")
        except httpx.RequestError as e:
            return ExecutionResult(success=False, error=f"Request failed: {str(e)}")
        except Exception as e:
            return ExecutionResult(success=False, error=f"Unexpected error: {str(e)}")
