from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class ModelAbility(str, Enum):
    """Available model abilities."""
    TEXT2IMG = "text2img"
    TEXT2VIDEO = "text2video"
    CHAT_COMPLETION = "chat_completion"


# ============ User API Response ============

class ModelResponse(BaseModel):
    """Response schema for model config (user API, excludes audit fields)."""
    id: str = Field(..., description="Model config ID")
    name: str = Field(..., description="Model name for API calls")
    ability: ModelAbility = Field(..., description="Model ability type")
    provider: str = Field(..., description="Model provider (e.g., volcengine)")
    description: str = Field(..., description="Model description")
    weight: int = Field(..., description="Sort weight, higher is more prioritized")
    cost_rate: float = Field(..., alias="costRate", serialization_alias="costRate", description="Token cost rate multiplier")

    model_config = {"populate_by_name": True}


class ModelListResponse(BaseModel):
    """Response schema for model list (user API)."""
    models: list[ModelResponse] = Field(..., description="List of available models")
    total: int = Field(..., description="Total count of models")


# ============ Admin API Response ============

class ModelAdminResponse(BaseModel):
    """Response schema for model config (admin API, includes all fields)."""
    id: str = Field(..., description="Model config ID")
    name: str = Field(..., description="Model name for API calls")
    ability: ModelAbility = Field(..., description="Model ability type")
    provider: str = Field(..., description="Model provider")
    api_suffix: str = Field(..., alias="apiSuffix", serialization_alias="apiSuffix", description="API endpoint suffix")
    executor_class_name: str = Field(..., alias="executorClassName", serialization_alias="executorClassName", description="Executor class name")
    parameters: dict[str, Any] = Field(..., description="Model default parameters")
    description: str = Field(..., description="Model description")
    weight: int = Field(..., description="Sort weight")
    cost_rate: float = Field(..., alias="costRate", serialization_alias="costRate", description="Token cost rate multiplier")
    enabled: bool = Field(..., description="Whether model is enabled")
    created_at: Optional[datetime] = Field(None, alias="createdAt", serialization_alias="createdAt", description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt", serialization_alias="updatedAt", description="Last update timestamp")
    updated_by: str = Field(..., alias="updatedBy", serialization_alias="updatedBy", description="Last updated by")

    model_config = {"populate_by_name": True}


class ModelAdminListResponse(BaseModel):
    """Response schema for model list (admin API)."""
    models: list[ModelAdminResponse] = Field(..., description="List of all models")
    total: int = Field(..., description="Total count of models")
