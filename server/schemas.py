"""
Pydantic 请求/响应模型（API Schema）
"""
from typing import Optional
from pydantic import BaseModel


# ===== 内容生成 =====

class ModelRunRequest(BaseModel):
    model_type: str  # "image" | "text" | "video" | "audio"
    prompt: str
    negative_prompt: Optional[str] = None
    width: Optional[int] = 512
    height: Optional[int] = 512
    model_id: Optional[str] = None
    workspace_id: Optional[str] = None
    node_id: Optional[str] = None


class ModelRunResponse(BaseModel):
    id: str
    model_type: str
    status: str  # "completed" | "failed"
    result_url: Optional[str] = None
    result_text: Optional[str] = None
    revised_prompt: Optional[str] = None
    error: Optional[str] = None
    created_at: float


class ModelInfo(BaseModel):
    id: str
    name: str
    type: str
    description: str
    provider: str


class GenerationRecordResponse(BaseModel):
    id: str
    model_type: str
    prompt: str
    status: str
    result_url: Optional[str] = None
    result_text: Optional[str] = None
    created_at: float
    node_id: Optional[str] = None


# ===== Prompt =====

class PromptOptimizeRequest(BaseModel):
    prompt: str
    model_type: str


class PromptOptimizeResponse(BaseModel):
    original: str
    optimized: str
    model_type: str


class PromptTemplateCreate(BaseModel):
    name: str
    content: str
    model_type: str
    category: str = "general"
    workspace_id: Optional[str] = None


class PromptTemplateResponse(BaseModel):
    id: str
    name: str
    content: str
    model_type: str
    category: str
    is_builtin: bool
    created_at: float


# ===== 工作空间 =====

class WorkspaceCreate(BaseModel):
    name: str
    description: str = ""


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    canvas_data: Optional[str] = None
    settings: Optional[str] = None


class WorkspaceResponse(BaseModel):
    id: str
    name: str
    description: str
    canvas_data: str
    settings: str
    created_at: float
    updated_at: float


class WorkspaceListItem(BaseModel):
    id: str
    name: str
    description: str
    created_at: float
    updated_at: float


# ===== 素材 =====

class AssetResponse(BaseModel):
    id: str
    name: str
    url: str
    file_type: str
    file_size: int
    tags: str
    workspace_id: Optional[str]
    created_at: float


class AssetTagUpdate(BaseModel):
    tags: list[str]
