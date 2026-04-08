"""
Creative Forge MCP Server
=========================
将 AI 漫剧 Agent 的能力通过 MCP 协议暴露给外部 AI Agent（如有道龙虾 LobsterAI）。

启动方式:
    python mcp_server.py

前置条件:
    - Creative Forge 后端已启动 (默认 http://localhost:8000)
    - .env 中已配置 AI 模型 API 密钥

环境变量:
    CREATIVE_FORGE_BASE_URL  后端地址 (默认 http://localhost:8000)
    CREATIVE_FORGE_USER_ID   自动认证用户 (默认 testuser1)
    MCP_SERVER_PORT          MCP 服务端口 (默认 3001)
"""

from dotenv import load_dotenv
load_dotenv()

import os
import logging

from fastmcp import FastMCP

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")

mcp = FastMCP(
    name="creative-forge",
    instructions=(
        "AI漫剧Agent (Creative Forge) - AI-powered comic and video creation platform.\n\n"
        "Available capabilities:\n"
        "- **Image Generation**: Generate images from text descriptions using Seedream models\n"
        "- **Video Generation**: Generate videos from text descriptions using Seedance models (takes 1-5 min)\n"
        "- **Text Generation**: Generate scripts, dialogue, and scene descriptions using GLM models\n"
        "- **Asset Management**: Save, list, and delete generated assets in the library\n"
        "- **Image Upload**: Upload images from URL or base64 data\n"
        "- **Project Files**: Manage project files for image/video generation\n\n"
        "Typical workflow:\n"
        "1. Use list_models to see available models\n"
        "2. Use generate_image / generate_video / generate_text to create content\n"
        "3. Use create_asset to save results to the library\n"
        "4. Use manage_canvas_file to organize projects"
    ),
)

# 注册所有工具模块
from src.mcp.tools_models import register as reg_models
from src.mcp.tools_generation import register as reg_generation
from src.mcp.tools_assets import register as reg_assets
from src.mcp.tools_canvas import register as reg_canvas

reg_models(mcp)
reg_generation(mcp)
reg_assets(mcp)
reg_canvas(mcp)


if __name__ == "__main__":
    port = int(os.getenv("MCP_SERVER_PORT", "3001"))
    logging.info("Creative Forge MCP Server starting on port %d ...", port)
    mcp.run(transport="streamable-http", host="0.0.0.0", port=port)
