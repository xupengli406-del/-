"""Asynchronous polling executor for task-based models."""
import asyncio
import os
import time
from typing import Optional

import httpx

from src.entities.model_config import ModelConfig
from .base import BaseExecutor, ExecutionResult


class AsyncPollingExecutor(BaseExecutor):
    """
    Executor for asynchronous task-based API calls.

    Used for models that create a task and require polling for results (e.g., text2video).
    """

    # Default polling configuration
    DEFAULT_POLL_INTERVAL = 5  # seconds
    DEFAULT_TIMEOUT = 300  # 5 minutes

    def __init__(
        self,
        poll_interval: float = DEFAULT_POLL_INTERVAL,
        timeout: float = DEFAULT_TIMEOUT,
    ):
        """
        Initialize async polling executor.

        Args:
            poll_interval: Interval between status checks in seconds
            timeout: Maximum time to wait for task completion
        """
        self.poll_interval = poll_interval
        self.timeout = timeout

    def _get_api_key(self, model_config: ModelConfig, override: Optional[str] = None) -> str:
        """Get API key: use override if provided, else fall back to environment variable."""
        if override:
            return override
        env_key = f"{model_config.provider.upper()}_API_KEY"
        api_key = os.getenv(env_key)
        if not api_key:
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

    def _build_tasks_url(self, model_config: ModelConfig, endpoint_path: Optional[str] = None) -> str:
        """Build tasks API URL from config."""
        base_url = self._get_base_url(model_config)
        ep = self._get_endpoint_path(model_config, override=endpoint_path)
        return f"{base_url}/v1/ai/{ep}{model_config.api_suffix}"

    def _build_task_url(self, model_config: ModelConfig, task_id: str, endpoint_path: Optional[str] = None) -> str:
        """Build URL for querying specific task."""
        return f"{self._build_tasks_url(model_config, endpoint_path=endpoint_path)}/{task_id}"

    def _build_payload(
        self,
        model_config: ModelConfig,
        prompt: str,
        size: Optional[str],
        **kwargs,
    ) -> dict:
        """Build request payload for task creation."""
        # Content array format for video generation
        content = [{"type": "text", "text": prompt}]

        # Start with model name
        payload = {
            "model": model_config.name,
            "content": content,
        }

        # Add default parameters from config
        for key, value in model_config.parameters.items():
            if key not in payload:
                payload[key] = value

        # Override with request parameters
        if size:
            payload["resolution"] = size

        # Add additional kwargs
        for key in ["duration", "watermark", "seed"]:
            if key in kwargs:
                payload[key] = kwargs[key]

        return payload

    async def _create_task(
        self,
        client: httpx.AsyncClient,
        model_config: ModelConfig,
        headers: dict,
        prompt: str,
        size: Optional[str],
        **kwargs,
    ) -> tuple[Optional[str], Optional[str]]:
        """
        Create a generation task.

        Returns:
            Tuple of (task_id, error_message). If successful, error is None.
        """
        url = self._build_tasks_url(model_config, endpoint_path=kwargs.get("endpoint_path"))
        build_kwargs = {k: v for k, v in kwargs.items() if k not in ("model_config", "endpoint_path", "ak")}
        payload = self._build_payload(model_config, prompt, size, **build_kwargs)

        try:
            response = await client.post(url, json=payload, headers=headers)

            if response.status_code != 200:
                error_body = response.json() if response.content else {}
                error_msg = error_body.get("error", {}).get("message", response.text)
                return None, f"Failed to create task ({response.status_code}): {error_msg}"

            result = response.json()
            task_id = result.get("id")
            if not task_id:
                return None, "No task ID in response"

            return task_id, None

        except httpx.RequestError as e:
            return None, f"Request failed: {str(e)}"

    async def _poll_task(
        self,
        client: httpx.AsyncClient,
        model_config: ModelConfig,
        headers: dict,
        task_id: str,
        endpoint_path: Optional[str] = None,
    ) -> ExecutionResult:
        """
        Poll task status until completion or timeout.

        Returns:
            ExecutionResult with content URL or error
        """
        start_time = time.time()
        url = self._build_task_url(model_config, task_id, endpoint_path=endpoint_path)

        while True:
            elapsed = time.time() - start_time
            if elapsed >= self.timeout:
                return ExecutionResult(
                    success=False,
                    error=f"Task timed out after {self.timeout} seconds",
                )

            try:
                response = await client.get(url, headers=headers)

                if response.status_code != 200:
                    error_body = response.json() if response.content else {}
                    error_msg = error_body.get("error", {}).get("message", response.text)
                    return ExecutionResult(
                        success=False,
                        error=f"Failed to query task ({response.status_code}): {error_msg}",
                    )

                result = response.json()
                status = result.get("status")

                if status == "succeeded":
                    content = result.get("content", {})
                    video_url = content.get("video_url")
                    if not video_url:
                        return ExecutionResult(
                            success=False,
                            error="Task succeeded but no video URL in response",
                        )
                    return ExecutionResult(
                        success=True,
                        content_url=video_url,
                    )

                if status == "failed":
                    error_msg = result.get("error", {}).get("message", "Unknown error")
                    return ExecutionResult(
                        success=False,
                        error=f"Task failed: {error_msg}",
                    )

                # Status is pending or running, continue polling
                await asyncio.sleep(self.poll_interval)

            except httpx.RequestError as e:
                return ExecutionResult(
                    success=False,
                    error=f"Request failed while polling: {str(e)}",
                )

    async def execute(
        self,
        prompt: str,
        size: Optional[str] = None,
        response_format: str = "url",
        **kwargs,
    ) -> ExecutionResult:
        """
        Execute async task creation and polling.

        Args:
            prompt: Text prompt for generation
            size: Output resolution (e.g., "720p", "1080p")
            response_format: Not used for async tasks (always returns URL)
            **kwargs: Additional parameters including:
                - model_config: ModelConfig instance (required)
                - duration: Video duration in seconds
                - watermark: bool
                - seed: Random seed

        Returns:
            ExecutionResult with generated content URL or error
        """
        model_config: ModelConfig = kwargs.get("model_config")
        if not model_config:
            return ExecutionResult(success=False, error="model_config is required")

        try:
            api_key = self._get_api_key(model_config, override=kwargs.get("ak"))
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            }

            endpoint_path = kwargs.get("endpoint_path")
            create_kwargs = {k: v for k, v in kwargs.items() if k not in ("model_config",)}
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Step 1: Create task
                task_id, error = await self._create_task(
                    client, model_config, headers, prompt, size, **create_kwargs
                )

                if error:
                    return ExecutionResult(success=False, error=error)

                # Step 2: Poll for result
                return await self._poll_task(client, model_config, headers, task_id, endpoint_path=endpoint_path)

        except httpx.TimeoutException:
            return ExecutionResult(success=False, error="Request timed out")
        except Exception as e:
            return ExecutionResult(success=False, error=f"Unexpected error: {str(e)}")
