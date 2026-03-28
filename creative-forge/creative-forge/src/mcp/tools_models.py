"""MCP 工具: 模型查询"""

import json
from fastmcp import FastMCP
from src.mcp import forge_client


def register(mcp: FastMCP) -> None:

    @mcp.tool()
    async def list_models(
        ability: str = "",
    ) -> str:
        """List available AI models.

        Args:
            ability: Optional filter by model capability. One of:
                     text2img (image generation),
                     text2video (video generation),
                     chat_completion (text/script generation).
                     Leave empty to list all models.

        Returns:
            JSON array of available models with their id, name, ability, and description.
        """
        models = await forge_client.list_models(ability=ability or None)
        return json.dumps(models, ensure_ascii=False, indent=2)
