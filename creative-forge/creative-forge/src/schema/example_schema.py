from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ============ Request Schemas ============

class ExampleCreateRequest(BaseModel):
    """Request schema for creating an example."""
    name: str = Field(..., min_length=1, max_length=100, description="Name of the example")
    description: Optional[str] = Field(None, max_length=500, description="Optional description")
    priority: int = Field(default=1, ge=1, le=10, description="Priority level (1-10)")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "My Example",
                    "description": "This is an example item",
                    "priority": 5
                }
            ]
        }
    }


class ExampleUpdateRequest(BaseModel):
    """Request schema for updating an example."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    priority: Optional[int] = Field(None, ge=1, le=10)


# ============ Response Schemas ============

class ExampleResponse(BaseModel):
    """Response schema for a single example."""
    id: str
    name: str
    description: Optional[str] = None
    priority: int
    created_at: datetime
    updated_at: datetime


class ExampleListResponse(BaseModel):
    """Response schema for listing examples."""
    items: list[ExampleResponse]
    total: int
    page: int
    page_size: int


class MessageResponse(BaseModel):
    """Generic message response."""
    message: str
    success: bool = True
