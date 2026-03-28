"""Seedance video generation executor."""
import asyncio
import os
import time
from typing import Optional

import httpx

from .base import BaseExecutor, ExecutionResult


class SeedanceExecutor(BaseExecutor):
    """Executor for Doubao Seedance video generation models (text-to-video)."""

    # Polling configuration
    POLL_INTERVAL_SECONDS = 5
    TIMEOUT_SECONDS = 300  # 5 minutes

    def __init__(
        self,
        api_key: Optional[str] = None,
        endpoint_path: Optional[str] = None,
        base_url: Optional[str] = None,
    ):
        """
        Initialize Seedance executor.

        Args:
            api_key: API key for authentication. Falls back to SEEDANCE_API_KEY env var.
            endpoint_path: Endpoint path segment. Falls back to SEEDANCE_ENDPOINT_PATH env var.
            base_url: Base URL for API. Falls back to SEEDANCE_BASE_URL env var.
        """
        self.api_key = api_key or os.getenv("SEEDANCE_API_KEY")
        self.endpoint_path = endpoint_path or os.getenv("SEEDANCE_ENDPOINT_PATH")
        self.base_url = base_url or os.getenv("SEEDANCE_BASE_URL", "https://genaiapi.cloudsway.net")

        if not self.api_key:
            raise ValueError("SEEDANCE_API_KEY is required")
        if not self.endpoint_path:
            raise ValueError("SEEDANCE_ENDPOINT_PATH is required")

    @property
    def tasks_url(self) -> str:
        """Get URL for task operations."""
        return f"{self.base_url}/v1/ai/{self.endpoint_path}/seedance/contents/generations/tasks"

    def _get_task_url(self, task_id: str) -> str:
        """Get URL for specific task query."""
        return f"{self.tasks_url}/{task_id}"

    @property
    def _headers(self) -> dict:
        """Get request headers."""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

    async def _create_task(
        self,
        client: httpx.AsyncClient,
        prompt: str,
        model: str,
        duration: Optional[int] = None,
        resolution: Optional[str] = None,
        watermark: bool = False,
        seed: Optional[int] = None,
    ) -> tuple[Optional[str], Optional[str]]:
        """
        Create a video generation task.

        Returns:
            Tuple of (task_id, error_message). If successful, error is None.
        """
        content = [{"type": "text", "text": prompt}]

        payload = {
            "model": model,
            "content": content,
            "watermark": watermark,
        }

        if duration is not None:
            payload["duration"] = duration
        if resolution is not None:
            payload["resolution"] = resolution
        if seed is not None:
            payload["seed"] = seed

        try:
            response = await client.post(
                self.tasks_url,
                json=payload,
                headers=self._headers,
            )

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
        task_id: str,
        timeout_seconds: int,
    ) -> ExecutionResult:
        """
        Poll task status until completion or timeout.

        Args:
            client: HTTP client
            task_id: Task ID to poll
            timeout_seconds: Maximum time to wait

        Returns:
            ExecutionResult with video URL or error
        """
        start_time = time.time()

        while True:
            elapsed = time.time() - start_time
            if elapsed >= timeout_seconds:
                return ExecutionResult(
                    success=False,
                    error=f"Task timed out after {timeout_seconds} seconds",
                )

            try:
                response = await client.get(
                    self._get_task_url(task_id),
                    headers=self._headers,
                )

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
                        error=f"Video generation failed: {error_msg}",
                    )

                # Status is pending or running, continue polling
                await asyncio.sleep(self.POLL_INTERVAL_SECONDS)

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
        Execute text-to-video generation.

        Args:
            prompt: Text prompt for video generation
            size: Output resolution (e.g., "720p", "1080p"). Default: None (API default)
            response_format: Not used for video (always returns URL)
            **kwargs: Additional parameters:
                - model: Model ID (default: "doubao-seedance-1-0-pro-250528")
                - duration: Video duration in seconds
                - watermark: bool (default: False)
                - seed: Random seed for reproducibility

        Returns:
            ExecutionResult with generated video URL or error
        """
        model = kwargs.get("model", "doubao-seedance-1-0-pro-250528")
        duration = kwargs.get("duration")
        watermark = kwargs.get("watermark", False)
        seed = kwargs.get("seed")

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Step 1: Create task
                task_id, error = await self._create_task(
                    client=client,
                    prompt=prompt,
                    model=model,
                    duration=duration,
                    resolution=size,
                    watermark=watermark,
                    seed=seed,
                )

                if error:
                    return ExecutionResult(success=False, error=error)

                # Step 2: Poll for result
                return await self._poll_task(
                    client=client,
                    task_id=task_id,
                    timeout_seconds=self.TIMEOUT_SECONDS,
                )

        except httpx.TimeoutException:
            return ExecutionResult(
                success=False,
                error="Request timed out",
            )
        except Exception as e:
            return ExecutionResult(
                success=False,
                error=f"Unexpected error: {str(e)}",
            )
