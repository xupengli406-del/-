"""MCP 工具: AI 内容生成（图片、视频、文本）"""

import json
from fastmcp import FastMCP
from src.mcp import forge_client


def register(mcp: FastMCP) -> None:

    @mcp.tool()
    async def generate_image(
        prompt: str,
        model: str = "MaaS_Seedream_4.0",
        size: str = "2K",
    ) -> str:
        """Generate an image from a text description using AI.

        Args:
            prompt: Detailed description of the image to generate.
                    Be specific about subject, style, composition, lighting, etc.
                    Example: "一位优雅的年轻女性站在雪山之巅，长发飘扬，身穿白色羽绒服"
            model: Image generation model name. Available models can be found
                   via list_models(ability="text2img"). Default: MaaS_Seedream_4.0
            size: Output resolution. Options: 1K, 2K, 4K. Default: 2K

        Returns:
            JSON with status and the generated image URL.
            Example: {"status": "success", "image_url": "https://..."}
        """
        result = await forge_client.run_node(
            node_type="image",
            prompt=prompt,
            model=model,
            size=size,
        )

        if result.get("status") == "success":
            outputs = result.get("outputs", {})
            return json.dumps({
                "status": "success",
                "image_url": outputs.get("content_url", ""),
                "size": outputs.get("size", ""),
            }, ensure_ascii=False)
        else:
            return json.dumps({
                "status": "failed",
                "error": result.get("error", "Unknown error"),
            }, ensure_ascii=False)

    @mcp.tool()
    async def generate_video(
        prompt: str,
        model: str = "MaaS_Seedance1.5_pro",
        duration: int = 5,
    ) -> str:
        """Generate a video from a text description using AI.

        This operation may take 1-5 minutes as the video is generated asynchronously.
        The tool will wait for completion and return the final video URL.

        Args:
            prompt: Detailed description of the video to generate.
                    Include scene, subject actions, camera movement, and style.
                    Example: "一只小猫在草地上玩耍，阳光明媚，镜头缓缓推进"
            model: Video generation model name. Available models can be found
                   via list_models(ability="text2video"). Default: MaaS_Seedance1.5_pro
            duration: Video duration in seconds. Options: 5, 10, 12. Default: 5

        Returns:
            JSON with status and the generated video URL.
            Example: {"status": "success", "video_url": "https://..."}
        """
        result = await forge_client.run_node(
            node_type="video",
            prompt=prompt,
            model=model,
            length=duration,
        )

        if result.get("status") == "success":
            outputs = result.get("outputs", {})
            return json.dumps({
                "status": "success",
                "video_url": outputs.get("content_url", ""),
            }, ensure_ascii=False)
        else:
            return json.dumps({
                "status": "failed",
                "error": result.get("error", "Unknown error"),
            }, ensure_ascii=False)

    @mcp.tool()
    async def generate_text(
        prompt: str,
        model: str = "MaaS_GLM5",
        system_prompt: str = "",
    ) -> str:
        """Generate text content (scripts, dialogue, scene descriptions) using AI.

        Args:
            prompt: The text generation instruction. Can be a script requirement,
                    dialogue request, scene description, or any creative writing task.
                    Example: "为一个都市爱情故事写第一集的分镜脚本，包含5个场景"
            model: Text generation model name. Available models can be found
                   via list_models(ability="chat_completion"). Default: MaaS_GLM5
            system_prompt: Optional system prompt to guide the AI's behavior and style.
                          Example: "你是一个专业的漫画编剧，擅长写分镜脚本"

        Returns:
            The generated text content.
        """
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"[System: {system_prompt}]\n\n{prompt}"

        result = await forge_client.run_node(
            node_type="text",
            prompt=full_prompt,
            model=model,
        )

        if result.get("status") == "success":
            outputs = result.get("outputs", {})
            return outputs.get("text", "")
        else:
            error = result.get("error", "Unknown error")
            return f"生成失败: {error}"
