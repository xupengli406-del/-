"""MCP 工具: 资产管理与图片上传"""

import json
import uuid
import time
from fastmcp import FastMCP
from src.mcp import forge_client


def register(mcp: FastMCP) -> None:

    @mcp.tool()
    async def list_assets() -> str:
        """List all assets in the asset library.

        Returns a list of all saved assets including images, videos, text, and audio.

        Returns:
            JSON array of assets. Each asset has: id, name, url, type, source, createdAt.
        """
        assets = await forge_client.get_assets()
        return json.dumps(assets, ensure_ascii=False, indent=2)

    @mcp.tool()
    async def create_asset(
        name: str,
        url: str,
        type: str,
        source: str = "generate",
        text_content: str = "",
    ) -> str:
        """Save an asset to the library.

        Use this after generating an image/video/text to persist it in the asset library.

        Args:
            name: Display name for the asset.
            url: URL of the asset content (e.g., image URL from generate_image).
            type: Asset type. One of: image, video, text, audio.
            source: Origin of the asset. One of: generate, upload. Default: generate.
            text_content: Text content for text-type assets. Leave empty for media assets.

        Returns:
            JSON of the created asset with its assigned ID.
        """
        asset = {
            "id": str(uuid.uuid4()),
            "name": name,
            "url": url,
            "type": type,
            "source": source,
            "createdAt": time.time(),
        }
        if text_content:
            asset["textContent"] = text_content

        result = await forge_client.create_asset(asset)
        return json.dumps(result, ensure_ascii=False)

    @mcp.tool()
    async def delete_asset(asset_id: str) -> str:
        """Remove an asset from the library.

        Args:
            asset_id: The ID of the asset to delete.

        Returns:
            Confirmation message.
        """
        result = await forge_client.delete_asset(asset_id)
        return json.dumps(result, ensure_ascii=False)

    @mcp.tool()
    async def upload_image(
        image_url: str = "",
        image_base64: str = "",
        filename: str = "upload.png",
    ) -> str:
        """Upload an image to the server.

        Provide either image_url (to download a remote image and upload it)
        or image_base64 (to upload base64-encoded image data). Only one is needed.

        Args:
            image_url: URL of an image to download and upload. Example: https://example.com/photo.jpg
            image_base64: Base64-encoded image data. Use this for inline image data.
            filename: Filename for the uploaded image. Default: upload.png

        Returns:
            JSON with id, name, url of the uploaded file.
        """
        if not image_url and not image_base64:
            return json.dumps({"error": "请提供 image_url 或 image_base64"})

        if image_url:
            result = await forge_client.upload_image_from_url(image_url, filename)
        else:
            result = await forge_client.upload_image_from_base64(image_base64, filename)

        return json.dumps(result, ensure_ascii=False)
