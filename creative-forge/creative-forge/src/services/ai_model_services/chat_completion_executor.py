"""Chat completion executor for text generation models (OpenAI-compatible)."""
import os
import json
from typing import Optional

import httpx

from src.entities.model_config import ModelConfig
from .base import BaseExecutor, ExecutionResult


class ChatCompletionExecutor(BaseExecutor):
    """
    Executor for OpenAI-compatible chat completion API calls.

    Used for text generation models (e.g., GLM5) that follow the
    OpenAI chat completions API format.
    """

    def __init__(self, timeout: float = 120.0):
        self.timeout = timeout

    def _get_api_key(self, model_config: ModelConfig, override: Optional[str] = None) -> str:
        # Prefer provider-specific env key over user ak
        env_key = f"{model_config.provider.upper()}_API_KEY"
        api_key = os.getenv(env_key)
        if api_key:
            return api_key
        api_key = os.getenv("AI_API_KEY")
        if api_key:
            return api_key
        if override:
            return override
        raise ValueError(f"API key not configured. Set {env_key} or AI_API_KEY")

    def _get_endpoint_path(self, model_config: ModelConfig, override: Optional[str] = None) -> str:
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
        env_key = f"{model_config.provider.upper()}_BASE_URL"
        base_url = os.getenv(env_key)
        if not base_url:
            base_url = os.getenv("AI_BASE_URL", "https://genaiapipre.cloudsway.net")
        return base_url

    def _build_url(self, model_config: ModelConfig, endpoint_path: Optional[str] = None) -> str:
        base_url = self._get_base_url(model_config)
        ep = self._get_endpoint_path(model_config, override=endpoint_path)
        return f"{base_url}/v1/ai/{ep}{model_config.api_suffix}"

    async def execute(
        self,
        prompt: str,
        size: Optional[str] = None,
        response_format: str = "url",
        **kwargs,
    ) -> ExecutionResult:
        """
        Execute chat completion request.

        Args:
            prompt: User message for text generation
            **kwargs: Additional parameters including:
                - model_config: ModelConfig instance (required)
                - endpoint_path: Override endpoint path
                - ak: Override API key
                - system_prompt: System prompt for the conversation
                - temperature: Sampling temperature
                - max_tokens: Maximum tokens to generate
                - stream: Whether to use streaming (default False)

        Returns:
            ExecutionResult with generated text content
        """
        model_config: ModelConfig = kwargs.get("model_config")
        if not model_config:
            return ExecutionResult(success=False, error="model_config is required")

        try:
            url = self._build_url(model_config, endpoint_path=kwargs.get("endpoint_path"))
            api_key = self._get_api_key(model_config, override=kwargs.get("ak"))

            # Build messages array
            messages = []
            system_prompt = kwargs.get("system_prompt") or model_config.parameters.get("system_prompt")
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            # Build payload
            payload = {
                "model": model_config.parameters.get("model_name", model_config.name),
                "messages": messages,
                "stream": kwargs.get("stream", model_config.parameters.get("stream", False)),
            }

            # Optional parameters
            temperature = kwargs.get("temperature") or model_config.parameters.get("temperature")
            if temperature is not None:
                payload["temperature"] = temperature

            max_tokens = kwargs.get("max_tokens") or model_config.parameters.get("max_tokens")
            if max_tokens is not None:
                payload["max_tokens"] = max_tokens

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            }

            use_stream = payload.get("stream", False)

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                if use_stream:
                    return await self._execute_stream(client, url, payload, headers)
                else:
                    return await self._execute_sync(client, url, payload, headers)

        except httpx.TimeoutException:
            return ExecutionResult(success=False, error="Request timed out")
        except httpx.RequestError as e:
            return ExecutionResult(success=False, error=f"Request failed: {str(e)}")
        except Exception as e:
            return ExecutionResult(success=False, error=f"Unexpected error: {str(e)}")

    async def _execute_sync(
        self, client: httpx.AsyncClient, url: str, payload: dict, headers: dict
    ) -> ExecutionResult:
        """Execute non-streaming chat completion."""
        response = await client.post(url, json=payload, headers=headers)

        if response.status_code != 200:
            error_body = response.json() if response.content else {}
            error_msg = error_body.get("error", {}).get("message", response.text)
            return ExecutionResult(
                success=False,
                error=f"API error ({response.status_code}): {error_msg}",
            )

        result = response.json()
        choices = result.get("choices", [])
        if not choices:
            return ExecutionResult(success=False, error="No choices in response")

        content = choices[0].get("message", {}).get("content", "")
        return ExecutionResult(
            success=True,
            content_url=None,
            content_b64=None,
            text=content,
        )

    async def _execute_stream(
        self, client: httpx.AsyncClient, url: str, payload: dict, headers: dict
    ) -> ExecutionResult:
        """Execute streaming chat completion, collect full text."""
        full_text = ""

        async with client.stream("POST", url, json=payload, headers=headers) as response:
            if response.status_code != 200:
                body = await response.aread()
                try:
                    error_body = json.loads(body)
                    error_msg = error_body.get("error", {}).get("message", body.decode())
                except Exception:
                    error_msg = body.decode()
                return ExecutionResult(
                    success=False,
                    error=f"API error ({response.status_code}): {error_msg}",
                )

            async for line in response.aiter_lines():
                if not line.startswith("data: "):
                    continue
                data_str = line[6:].strip()
                if data_str == "[DONE]":
                    break
                try:
                    chunk = json.loads(data_str)
                    delta = chunk.get("choices", [{}])[0].get("delta", {})
                    content = delta.get("content", "")
                    if content:
                        full_text += content
                except (json.JSONDecodeError, IndexError):
                    continue

        return ExecutionResult(
            success=True,
            content_url=None,
            content_b64=None,
            text=full_text,
        )
