"""
Creative Forge HTTP 客户端 — 封装认证和 API 调用
MCP 工具通过此客户端与 Creative Forge 后端通信
"""

import os
import json
import logging
import random
import string
import time
from typing import Any, Optional

import httpx

logger = logging.getLogger(__name__)

_BASE_URL = os.getenv("CREATIVE_FORGE_BASE_URL", "http://localhost:8000")
_USER_ID = os.getenv("CREATIVE_FORGE_USER_ID", "testuser1")

# 缓存认证信息
_ak: Optional[str] = None
_authed_models: Optional[dict] = None

# httpx 0.28 默认 transport 与 uvicorn reload 模式不兼容，需显式指定
_transport = httpx.AsyncHTTPTransport()


async def _ensure_auth() -> None:
    """认证并缓存 ak / authedModels"""
    global _ak, _authed_models
    if _ak is not None:
        return

    async with httpx.AsyncClient(transport=_transport, timeout=10) as client:
        resp = await client.post(
            f"{_BASE_URL}/user/auth",
            json={"userId": _USER_ID},
        )
        resp.raise_for_status()
        data = resp.json()
        _ak = data["ak"]
        _authed_models = data.get("authedModels", {})
        logger.info("Creative Forge 认证成功, ak=%s...", _ak[:8])


def _auth_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {_ak}"}


# ── 模型 ──

async def list_models(ability: Optional[str] = None) -> list[dict]:
    await _ensure_auth()
    params = {}
    if ability:
        params["ability"] = ability
    async with httpx.AsyncClient(transport=_transport, timeout=10) as client:
        resp = await client.get(
            f"{_BASE_URL}/model/list",
            headers=_auth_headers(),
            params=params,
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("models", data) if isinstance(data, dict) else data


# ── 生成 ──

async def run_node(
    node_type: str,
    prompt: str,
    model: str,
    size: Optional[str] = None,
    length: Optional[int] = None,
    watermark: Optional[bool] = None,
    response_format: str = "url",
) -> dict[str, Any]:
    """调用 POST /nodes/run，返回 {status, outputs, error}"""
    await _ensure_auth()
    body: dict[str, Any] = {
        "type": node_type,
        "prompt": prompt,
        "model": model,
        "response_format": response_format,
    }
    if size:
        body["size"] = size
    if length is not None:
        body["length"] = length
    if watermark is not None:
        body["watermark"] = watermark

    # 视频生成可能需要较长时间（轮询等待）
    timeout = 600 if node_type == "video" else 120

    async with httpx.AsyncClient(transport=_transport, timeout=timeout) as client:
        resp = await client.post(
            f"{_BASE_URL}/nodes/run",
            headers=_auth_headers(),
            json=body,
        )
        resp.raise_for_status()
        return resp.json()


# ── 文件上传 ──


async def download_url(url: str) -> bytes:
    """下载远程 URL 内容，返回 bytes"""
    async with httpx.AsyncClient(transport=_transport, timeout=60) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.content


def compress_image(data: bytes, max_size: int = 500_000, max_width: int = 1024) -> bytes:
    """压缩图片到指定大小以内"""
    from PIL import Image as PILImage
    import io

    img = PILImage.open(io.BytesIO(data))

    # 缩小尺寸
    if img.width > max_width:
        ratio = max_width / img.width
        img = img.resize((max_width, int(img.height * ratio)), PILImage.LANCZOS)

    # 逐步降低质量直到 < max_size
    for quality in (85, 70, 55, 40, 25):
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality)
        if buf.tell() <= max_size:
            return buf.getvalue()

    return buf.getvalue()


async def upload_image_from_url(image_url: str, filename: str = "upload.png") -> dict:
    """下载远程图片并上传到 Creative Forge"""
    await _ensure_auth()
    async with httpx.AsyncClient(transport=_transport, timeout=60) as client:
        img_resp = await client.get(image_url)
        img_resp.raise_for_status()
        image_bytes = img_resp.content

    return await _upload_bytes(image_bytes, filename)


async def upload_image_from_base64(b64_data: str, filename: str = "upload.png") -> dict:
    """将 base64 图片数据上传到 Creative Forge"""
    import base64
    await _ensure_auth()
    image_bytes = base64.b64decode(b64_data)
    return await _upload_bytes(image_bytes, filename)


async def _upload_bytes(data: bytes, filename: str) -> dict:
    async with httpx.AsyncClient(transport=_transport, timeout=30) as client:
        files = {"file": (filename, data, "image/png")}
        resp = await client.post(
            f"{_BASE_URL}/api/upload",
            files=files,
        )
        resp.raise_for_status()
        return resp.json()


# ── 资产 CRUD ──

async def get_assets() -> list[dict]:
    await _ensure_auth()
    async with httpx.AsyncClient(transport=_transport, timeout=10) as client:
        resp = await client.get(f"{_BASE_URL}/api/assets")
        resp.raise_for_status()
        return resp.json()


async def create_asset(asset: dict) -> dict:
    await _ensure_auth()
    async with httpx.AsyncClient(transport=_transport, timeout=10) as client:
        resp = await client.post(f"{_BASE_URL}/api/assets", json=asset)
        resp.raise_for_status()
        return resp.json()


async def delete_asset(asset_id: str) -> dict:
    await _ensure_auth()
    async with httpx.AsyncClient(transport=_transport, timeout=10) as client:
        resp = await client.delete(f"{_BASE_URL}/api/assets/{asset_id}")
        resp.raise_for_status()
        return resp.json()


# ── 画布文件 CRUD ──

async def get_canvas_files() -> list[dict]:
    await _ensure_auth()
    async with httpx.AsyncClient(transport=_transport, timeout=10) as client:
        resp = await client.get(f"{_BASE_URL}/api/canvas-files")
        resp.raise_for_status()
        return resp.json()


async def create_canvas_file(data: dict) -> dict:
    await _ensure_auth()
    async with httpx.AsyncClient(transport=_transport, timeout=10) as client:
        resp = await client.post(f"{_BASE_URL}/api/canvas-files", json=data)
        resp.raise_for_status()
        return resp.json()


async def update_canvas_file(file_id: str, data: dict) -> dict:
    await _ensure_auth()
    async with httpx.AsyncClient(transport=_transport, timeout=10) as client:
        resp = await client.put(f"{_BASE_URL}/api/canvas-files/{file_id}", json=data)
        resp.raise_for_status()
        return resp.json()


async def delete_canvas_file(file_id: str) -> dict:
    await _ensure_auth()
    async with httpx.AsyncClient(transport=_transport, timeout=10) as client:
        resp = await client.delete(f"{_BASE_URL}/api/canvas-files/{file_id}")
        resp.raise_for_status()
        return resp.json()


# ── MCP 生成后自动创建项目文件 ──

def _gen_id(prefix: str) -> str:
    """生成前端风格 ID: prefix_timestamp_random6"""
    ts = int(time.time() * 1000)
    rand = "".join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"{prefix}_{ts}_{rand}"


async def create_project_for_media(
    media_type: str,
    prompt: str,
    result_url: str,
    model: str = "",
) -> dict:
    """生成图片/视频后自动创建对应类型的项目文件，使结果在 web 端可见"""
    now = int(time.time() * 1000)
    file_id = _gen_id("proj")
    ver_id = _gen_id("ver")
    msg_id = f"msg_{now}"

    name = prompt[:20] + ("..." if len(prompt) > 20 else "")

    data = {
        "id": file_id,
        "name": name,
        "projectType": media_type,
        "thumbnailUrl": result_url,
        "createdAt": now,
        "updatedAt": now,
        "mediaState": {
            "versions": [{
                "id": ver_id,
                "url": result_url,
                "prompt": prompt,
                "createdAt": now,
                "model": model,
            }],
            "selectedVersionId": ver_id,
        },
        "aiSession": {
            "messages": [{
                "id": msg_id,
                "role": "user",
                "mode": media_type,
                "content": prompt,
                "status": "completed",
                "createdAt": now,
                "resultUrl": result_url,
            }],
        },
    }

    result = await create_canvas_file(data)
    logger.info("已创建 %s 项目: %s (%s)", media_type, name, file_id)
    return {"project_id": file_id, "project_name": name}
