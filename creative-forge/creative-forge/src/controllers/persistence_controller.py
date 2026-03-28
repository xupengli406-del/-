"""
持久化 API 控制器 - 资产、画布文件、生成历史、文件上传
提供与前端 persistence.ts 对齐的 CRUD 接口
"""

import json
import uuid
from pathlib import Path
from typing import Optional, Any

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

router = APIRouter(tags=["Persistence"])

# ===== JSON 文件存储 =====

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ASSETS_FILE = DATA_DIR / "assets.json"
CANVAS_FILES_FILE = DATA_DIR / "canvas-files.json"
GENERATE_HISTORY_FILE = DATA_DIR / "generate-history.json"


def _read_json(path: Path) -> list[dict]:
    if not path.exists():
        return []
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []


def _write_json(path: Path, data: list[dict]) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


# ===== 文件上传 =====

@router.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """上传素材文件"""
    ext = Path(file.filename or "upload.png").suffix
    file_id = f"{uuid.uuid4().hex[:12]}{ext}"
    file_path = UPLOAD_DIR / file_id

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    return {
        "id": file_id,
        "name": file.filename,
        "url": f"/uploads/{file_id}",
        "type": "image",
        "size": len(content),
    }


# ===== 资产 CRUD =====

class AssetCreateRequest(BaseModel):
    id: str
    name: str
    url: str = ""
    type: str
    source: str = "generate"
    textContent: Optional[str] = None
    createdAt: float


@router.get("/api/assets")
async def get_assets():
    return _read_json(ASSETS_FILE)


@router.post("/api/assets")
async def create_asset(asset: AssetCreateRequest):
    assets = _read_json(ASSETS_FILE)
    asset_dict = asset.model_dump()
    assets.append(asset_dict)
    _write_json(ASSETS_FILE, assets)
    return asset_dict


@router.delete("/api/assets/{asset_id}")
async def delete_asset(asset_id: str):
    assets = _read_json(ASSETS_FILE)
    assets = [a for a in assets if a.get("id") != asset_id]
    _write_json(ASSETS_FILE, assets)
    return {"message": "已删除", "id": asset_id}


# ===== 画布文件 CRUD =====

class CanvasFileCreateRequest(BaseModel):
    id: str
    name: str
    snapshot: dict
    thumbnailUrl: str = ""
    nodeCount: int = 0
    edgeCount: int = 0
    createdAt: float
    updatedAt: float
    projectType: Optional[str] = None
    folderId: Optional[str] = None
    mediaState: Optional[dict[str, Any]] = None
    aiSession: Optional[dict[str, Any]] = None


@router.get("/api/canvas-files")
async def get_canvas_files():
    return _read_json(CANVAS_FILES_FILE)


@router.post("/api/canvas-files")
async def create_canvas_file(canvas_file: CanvasFileCreateRequest):
    files = _read_json(CANVAS_FILES_FILE)
    file_dict = canvas_file.model_dump()
    files.append(file_dict)
    _write_json(CANVAS_FILES_FILE, files)
    return file_dict


@router.put("/api/canvas-files/{file_id}")
async def update_canvas_file(file_id: str, canvas_file: CanvasFileCreateRequest):
    files = _read_json(CANVAS_FILES_FILE)
    updated = False
    for i, f in enumerate(files):
        if f.get("id") == file_id:
            files[i] = canvas_file.model_dump()
            updated = True
            break
    if not updated:
        files.append(canvas_file.model_dump())
    _write_json(CANVAS_FILES_FILE, files)
    return canvas_file.model_dump()


@router.delete("/api/canvas-files/{file_id}")
async def delete_canvas_file(file_id: str):
    files = _read_json(CANVAS_FILES_FILE)
    files = [f for f in files if f.get("id") != file_id]
    _write_json(CANVAS_FILES_FILE, files)
    return {"message": "已删除", "id": file_id}


# ===== 生成历史 =====

@router.get("/api/generate-history")
async def get_generate_history():
    return _read_json(GENERATE_HISTORY_FILE)


@router.put("/api/generate-history")
async def save_generate_history(items: list[dict] = []):
    _write_json(GENERATE_HISTORY_FILE, items)
    return {"message": "已保存", "count": len(items)}
