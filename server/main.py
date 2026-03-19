"""
漫剧创作平台 POC - 后端服务
FastAPI + Python
"""
import os
import json
import uuid
import time
import asyncio
import random
from pathlib import Path
from typing import Optional, Any

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="漫剧创作平台 POC API", version="0.0.0.2")

# ===== JSON 文件持久化 =====

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

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

# CORS - 允许前端开发服务器访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静态文件目录（上传的素材）
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# ===== 数据模型 =====

class ModelRunRequest(BaseModel):
    """内容生成请求"""
    model_type: str  # "image" | "text" | "video"
    prompt: str
    negative_prompt: Optional[str] = None
    width: Optional[int] = 512
    height: Optional[int] = 512
    model_id: Optional[str] = None

class ModelRunResponse(BaseModel):
    """内容生成响应"""
    id: str
    model_type: str
    status: str  # "completed" | "failed"
    result_url: Optional[str] = None
    result_text: Optional[str] = None
    revised_prompt: Optional[str] = None
    error: Optional[str] = None
    created_at: float

class ModelInfo(BaseModel):
    """模型信息"""
    id: str
    name: str
    type: str  # "image" | "text" | "video"
    description: str
    provider: str

class GenerationRecord(BaseModel):
    """生成记录"""
    id: str
    model_type: str
    prompt: str
    status: str
    result_url: Optional[str] = None
    result_text: Optional[str] = None
    created_at: float
    node_id: Optional[str] = None

# ===== 内存存储（POC阶段） =====

generation_history: list[GenerationRecord] = []

# ===== 模拟图片URL池 =====

PLACEHOLDER_IMAGES = [
    "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=512&h=512&fit=crop",
    "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=512&h=512&fit=crop",
    "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=512&h=512&fit=crop",
    "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=512&h=512&fit=crop",
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=512&h=512&fit=crop",
    "https://images.unsplash.com/photo-1506792006437-256b665541e2?w=512&h=512&fit=crop",
    "https://images.unsplash.com/photo-1534312527009-56c7016453e6?w=512&h=512&fit=crop",
    "https://images.unsplash.com/photo-1509909756405-be0199881695?w=512&h=512&fit=crop",
]

SAMPLE_TEXT_RESULTS = [
    "在一个被遗忘的古老森林中，少年阿明发现了一块发光的石头。石头散发着柔和的蓝光，仿佛在低声吟唱着远古的歌谣。",
    "夜幕降临，城市的霓虹灯逐渐亮起。高楼大厦的玻璃幕墙反射着五颜六色的光芒，街道上的行人匆匆而过。",
    "「你真的要离开吗？」她的声音微微颤抖。\n「我必须去。」他转过身，背对着夕阳，「但我答应你，一定会回来。」",
    "第一章：觉醒\n\n当清晨的第一缕阳光穿透云层，照射在废墟之上时，整个世界仿佛重新获得了生命。废墟中的植物开始缓缓舒展叶片。",
]

# ===== API 路由 =====

@app.get("/")
async def root():
    return {"message": "漫剧创作平台 POC API", "version": "0.0.0.1"}


@app.get("/api/model/list", response_model=list[ModelInfo])
async def list_models():
    """获取可用模型列表"""
    return [
        ModelInfo(
            id="sd-xl-base",
            name="Stable Diffusion XL",
            type="image",
            description="高质量图像生成模型",
            provider="Stability AI",
        ),
        ModelInfo(
            id="dall-e-3",
            name="DALL·E 3",
            type="image",
            description="OpenAI图像生成模型",
            provider="OpenAI",
        ),
        ModelInfo(
            id="gpt-4o",
            name="GPT-4o",
            type="text",
            description="多模态文本生成模型",
            provider="OpenAI",
        ),
        ModelInfo(
            id="claude-3.5",
            name="Claude 3.5 Sonnet",
            type="text",
            description="高质量文本生成模型",
            provider="Anthropic",
        ),
        ModelInfo(
            id="runway-gen3",
            name="Runway Gen-3",
            type="video",
            description="AI视频生成模型",
            provider="Runway",
        ),
        ModelInfo(
            id="pika-v2",
            name="Pika v2",
            type="video",
            description="视频生成模型",
            provider="Pika Labs",
        ),
    ]


@app.post("/api/model/run", response_model=ModelRunResponse)
async def run_model(request: ModelRunRequest):
    """调用AI模型生成内容"""
    gen_id = f"gen_{uuid.uuid4().hex[:12]}"

    # 模拟生成延迟
    delay = random.uniform(1.0, 3.0)
    await asyncio.sleep(delay)

    # 10% 概率模拟失败
    if random.random() < 0.1:
        record = GenerationRecord(
            id=gen_id,
            model_type=request.model_type,
            prompt=request.prompt,
            status="failed",
            created_at=time.time(),
        )
        generation_history.append(record)
        return ModelRunResponse(
            id=gen_id,
            model_type=request.model_type,
            status="failed",
            error="模型服务暂时不可用，请重试",
            created_at=time.time(),
        )

    result_url = None
    result_text = None

    if request.model_type == "image":
        result_url = random.choice(PLACEHOLDER_IMAGES)
    elif request.model_type == "text":
        result_text = random.choice(SAMPLE_TEXT_RESULTS)
    elif request.model_type == "video":
        result_url = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
    elif request.model_type == "audio":
        result_url = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    else:
        raise HTTPException(status_code=400, detail=f"不支持的模型类型: {request.model_type}")

    record = GenerationRecord(
        id=gen_id,
        model_type=request.model_type,
        prompt=request.prompt,
        status="completed",
        result_url=result_url,
        result_text=result_text,
        created_at=time.time(),
    )
    generation_history.append(record)

    return ModelRunResponse(
        id=gen_id,
        model_type=request.model_type,
        status="completed",
        result_url=result_url,
        result_text=result_text,
        revised_prompt=request.prompt,
        created_at=time.time(),
    )


@app.get("/api/generation/history", response_model=list[GenerationRecord])
async def get_generation_history(limit: int = 50):
    """获取生成历史记录"""
    return sorted(generation_history, key=lambda x: x.created_at, reverse=True)[:limit]


@app.delete("/api/generation/{gen_id}")
async def delete_generation(gen_id: str):
    """删除生成记录"""
    global generation_history
    generation_history = [r for r in generation_history if r.id != gen_id]
    return {"message": "已删除", "id": gen_id}


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """上传素材文件"""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="仅支持图片文件")

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
        "created_at": time.time(),
    }


class PromptOptimizeRequest(BaseModel):
    """Prompt优化请求"""
    prompt: str
    model_type: str  # "image" | "text" | "video" | "audio"


PROMPT_OPTIMIZE_TEMPLATES = {
    "image": [
        "masterpiece, best quality, highly detailed, {prompt}, cinematic lighting, 8k resolution, professional photography",
        "breathtaking {prompt}, dramatic atmosphere, vibrant colors, sharp focus, artstation trending, digital art",
        "{prompt}, ultra realistic, photorealistic, studio quality, perfect composition, golden hour lighting",
    ],
    "text": [
        "请以专业小说家的风格，详细描写以下场景：{prompt}。要求：1) 使用丰富的感官描写 2) 加入人物对话 3) 营造氛围感",
        "你是一位资深编剧。请根据以下描述创作一段精彩的剧情：{prompt}。要求生动、有戏剧冲突、节奏紧凑。",
    ],
    "video": [
        "cinematic shot of {prompt}, smooth camera movement, professional cinematography, 4k, 60fps, film grain",
        "{prompt}, dynamic camera angle, epic scale, movie trailer quality, dramatic lighting, slow motion",
    ],
    "audio": [
        "high quality {prompt}, studio recording, crystal clear sound, professional mastering, rich harmonics",
        "{prompt}, cinematic orchestral arrangement, emotional depth, dynamic range, professional production",
    ],
}


@app.post("/api/prompt/optimize")
async def optimize_prompt(request: PromptOptimizeRequest):
    """优化Prompt"""
    templates = PROMPT_OPTIMIZE_TEMPLATES.get(request.model_type, PROMPT_OPTIMIZE_TEMPLATES["image"])
    template = random.choice(templates)
    optimized = template.replace("{prompt}", request.prompt)

    await asyncio.sleep(0.5)

    return {
        "original": request.prompt,
        "optimized": optimized,
        "model_type": request.model_type,
    }


# ===== 资产持久化 API =====

class AssetCreateRequest(BaseModel):
    """创建资产请求"""
    id: str
    name: str
    url: str = ""
    type: str  # "image" | "video" | "text" | "audio"
    source: str = "generate"  # "generate" | "upload" | "canvas"
    textContent: Optional[str] = None
    createdAt: float


@app.get("/api/assets")
async def get_assets():
    """获取所有资产"""
    return _read_json(ASSETS_FILE)


@app.post("/api/assets")
async def create_asset(asset: AssetCreateRequest):
    """创建资产"""
    assets = _read_json(ASSETS_FILE)
    asset_dict = asset.model_dump()
    assets.append(asset_dict)
    _write_json(ASSETS_FILE, assets)
    return asset_dict


@app.delete("/api/assets/{asset_id}")
async def delete_asset(asset_id: str):
    """删除资产"""
    assets = _read_json(ASSETS_FILE)
    assets = [a for a in assets if a.get("id") != asset_id]
    _write_json(ASSETS_FILE, assets)
    return {"message": "已删除", "id": asset_id}


# ===== 画布文件持久化 API =====

class CanvasFileCreateRequest(BaseModel):
    """创建/保存画布文件"""
    id: str
    name: str
    snapshot: dict  # { nodes: [], edges: [] }
    thumbnailUrl: str = ""
    nodeCount: int = 0
    edgeCount: int = 0
    createdAt: float
    updatedAt: float
    projectType: Optional[str] = None
    folderId: Optional[str] = None
    mediaState: Optional[dict[str, Any]] = None
    aiSession: Optional[dict[str, Any]] = None


@app.get("/api/canvas-files")
async def get_canvas_files():
    """获取所有画布文件"""
    return _read_json(CANVAS_FILES_FILE)


@app.post("/api/canvas-files")
async def create_canvas_file(canvas_file: CanvasFileCreateRequest):
    """创建画布文件"""
    files = _read_json(CANVAS_FILES_FILE)
    file_dict = canvas_file.model_dump()
    files.append(file_dict)
    _write_json(CANVAS_FILES_FILE, files)
    return file_dict


@app.put("/api/canvas-files/{file_id}")
async def update_canvas_file(file_id: str, canvas_file: CanvasFileCreateRequest):
    """更新画布文件"""
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


@app.delete("/api/canvas-files/{file_id}")
async def delete_canvas_file(file_id: str):
    """删除画布文件"""
    files = _read_json(CANVAS_FILES_FILE)
    files = [f for f in files if f.get("id") != file_id]
    _write_json(CANVAS_FILES_FILE, files)
    return {"message": "已删除", "id": file_id}


# ===== 生成页对话历史持久化 API =====

@app.get("/api/generate-history")
async def get_generate_history():
    """获取生成页对话历史"""
    return _read_json(GENERATE_HISTORY_FILE)


@app.put("/api/generate-history")
async def save_generate_history(items: list[dict] = []):
    """保存（覆盖）生成页对话历史"""
    _write_json(GENERATE_HISTORY_FILE, items)
    return {"message": "已保存", "count": len(items)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
