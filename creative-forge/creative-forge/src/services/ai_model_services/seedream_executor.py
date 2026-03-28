"""Seedream image generation executor."""
import os
from typing import Optional

import httpx

from .base import BaseExecutor, ExecutionResult


class SeedreamExecutor(BaseExecutor):
    """Executor for Doubao Seedream image generation models."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        endpoint_path: Optional[str] = None,
        base_url: Optional[str] = None,
    ):
        """
        Initialize Seedream executor.

        Args:
            api_key: API key for authentication. Falls back to SEEDREAM_API_KEY env var.
            endpoint_path: Endpoint path segment. Falls back to SEEDREAM_ENDPOINT_PATH env var.
            base_url: Base URL for API. Falls back to SEEDREAM_BASE_URL env var.
        """
        self.api_key = api_key or os.getenv("SEEDREAM_API_KEY")
        self.endpoint_path = endpoint_path or os.getenv("SEEDREAM_ENDPOINT_PATH")
        self.base_url = base_url or os.getenv("SEEDREAM_BASE_URL", "https://genaiapipre.cloudsway.net")

        if not self.api_key:
            raise ValueError("SEEDREAM_API_KEY is required")
        if not self.endpoint_path:
            raise ValueError("SEEDREAM_ENDPOINT_PATH is required")

    @property
    def api_url(self) -> str:
        """Get full API URL."""
        return f"{self.base_url}/v1/ai/{self.endpoint_path}/seedream/image/generations"

    async def execute(
        self,
        prompt: str,
        size: Optional[str] = None,
        response_format: str = "url",
        **kwargs,
    ) -> ExecutionResult:
        """
        Execute text-to-image generation.

        Args:
            prompt: Text prompt for image generation
            size: Output size ("2K", "4K", or "WxH" format). Default: None (API default)
            response_format: "url" or "b64_json". Default: "url"
            **kwargs: Additional parameters:
                - watermark: bool (default: True)
                - image: str or list[str] for image-to-image

        Returns:
            ExecutionResult with generated image URL/base64 or error
        """
        payload = {
            "prompt": prompt,
            "response_format": response_format,
        }

        if size:
            payload["size"] = size

        # Optional parameters
        if "watermark" in kwargs:
            payload["watermark"] = kwargs["watermark"]
        if "image" in kwargs:
            payload["image"] = kwargs["image"]

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    self.api_url,
                    json=payload,
                    headers=headers,
                )

                if response.status_code != 200:
                    error_body = response.json() if response.content else {}
                    error_msg = error_body.get("error", {}).get("message", response.text)
                    return ExecutionResult(
                        success=False,
                        error=f"API error ({response.status_code}): {error_msg}",
                    )

                result = response.json()
                data = result.get("data", [])

                if not data:
                    return ExecutionResult(
                        success=False,
                        error="No image data in response",
                    )

                # Return first generated image
                first_image = data[0]
                return ExecutionResult(
                    success=True,
                    content_url=first_image.get("url"),
                    content_b64=first_image.get("b64_json"),
                    size=first_image.get("size"),
                )

        except httpx.TimeoutException:
            return ExecutionResult(
                success=False,
                error="Request timed out",
            )
        except httpx.RequestError as e:
            return ExecutionResult(
                success=False,
                error=f"Request failed: {str(e)}",
            )
        except Exception as e:
            return ExecutionResult(
                success=False,
                error=f"Unexpected error: {str(e)}",
            )
