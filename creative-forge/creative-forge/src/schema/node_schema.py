from pydantic import BaseModel, Field, model_validator
from typing import Optional, Any
from enum import Enum


class NodeType(str, Enum):
    """Available node types."""
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"


class ContentStatus(str, Enum):
    """Available content status values."""
    CREATED = "created"
    WIP = "wip"
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# ============ NodeContent Schemas ============

class NodeContentBase(BaseModel):
    """Base schema for node content."""
    content_url: Optional[str] = Field(None, alias="contentUrl", description="URL of content file")
    content_b64: Optional[str] = Field(None, alias="contentB64", description="Base64 of content file")
    status: ContentStatus = Field(..., description="Content status")

    model_config = {"populate_by_name": True}

    @model_validator(mode="after")
    def check_content_required(self):
        """Validate that at least one of contentUrl or contentB64 is provided."""
        if self.content_url is None and self.content_b64 is None:
            raise ValueError("At least one of contentUrl or contentB64 is required")
        return self


class NodeContentCreateRequest(BaseModel):
    """Request schema for creating node content."""
    content_url: Optional[str] = Field(None, alias="contentUrl", description="URL of content file")
    content_b64: Optional[str] = Field(None, alias="contentB64", description="Base64 of content file")
    status: ContentStatus = Field(ContentStatus.CREATED, description="Content status")

    model_config = {"populate_by_name": True}


class NodeContentResponse(BaseModel):
    """Response schema for node content."""
    content_url: Optional[str] = Field(None, alias="contentUrl", serialization_alias="contentUrl")
    content_b64: Optional[str] = Field(None, alias="contentB64", serialization_alias="contentB64")
    status: ContentStatus

    model_config = {"populate_by_name": True}


# ============ Node Schemas ============

class NodeCreateRequest(BaseModel):
    """Request schema for creating a node."""
    name: str = Field(..., min_length=1, description="Node alias name")
    type: NodeType = Field(..., description="Node type: text, image, video, audio")
    prompt: str = Field(..., min_length=1, description="Prompt for the node")
    content: NodeContentCreateRequest = Field(..., description="Content of the node")
    source: list[str] = Field(default_factory=list, description="Source nodes id array")
    target: list[str] = Field(default_factory=list, description="Target nodes id array")
    model: Optional[str] = Field(None, description="AI model name for generation")
    size: Optional[str] = Field(None, description="Size for image/video generation (e.g., '1K', '1024*768')")
    length: Optional[int] = Field(None, ge=1, description="Length in seconds for audio/video generation")


class NodeUpdateRequest(BaseModel):
    """Request schema for updating a node."""
    name: Optional[str] = Field(None, min_length=1, description="Node alias name")
    type: Optional[NodeType] = Field(None, description="Node type: text, image, video, audio")
    prompt: Optional[str] = Field(None, min_length=1, description="Prompt for the node")
    content: Optional[NodeContentCreateRequest] = Field(None, description="Content of the node")
    source: Optional[list[str]] = Field(None, description="Source nodes id array")
    target: Optional[list[str]] = Field(None, description="Target nodes id array")
    model: Optional[str] = Field(None, description="AI model name for generation")
    size: Optional[str] = Field(None, description="Size for image/video generation")
    length: Optional[int] = Field(None, ge=1, description="Length in seconds for audio/video generation")


class NodeResponse(BaseModel):
    """Response schema for a single node."""
    id: str
    name: str
    type: NodeType
    prompt: str
    content: NodeContentResponse
    source: list[str]
    target: list[str]
    model: Optional[str] = None
    size: Optional[str] = None
    length: Optional[int] = None


# ============ NodeLayout Schemas ============

class NodeLayoutCreateRequest(BaseModel):
    """Request schema for creating a node layout."""
    node_id: str = Field(..., alias="nodeId", description="ID of the node")
    x: float = Field(..., description="X coordinate on canvas")
    y: float = Field(..., description="Y coordinate on canvas")
    width: float = Field(..., gt=0, description="Width on canvas")
    height: float = Field(..., gt=0, description="Height on canvas")
    source: list[str] = Field(default_factory=list, description="Source nodes id array for connection lines")
    target: list[str] = Field(default_factory=list, description="Target nodes id array for connection lines")

    model_config = {"populate_by_name": True}


class NodeLayoutUpdateRequest(BaseModel):
    """Request schema for updating a node layout."""
    x: Optional[float] = Field(None, description="X coordinate on canvas")
    y: Optional[float] = Field(None, description="Y coordinate on canvas")
    width: Optional[float] = Field(None, gt=0, description="Width on canvas")
    height: Optional[float] = Field(None, gt=0, description="Height on canvas")
    source: Optional[list[str]] = Field(None, description="Source nodes id array for connection lines")
    target: Optional[list[str]] = Field(None, description="Target nodes id array for connection lines")


class NodeLayoutResponse(BaseModel):
    """Response schema for a node layout."""
    node_id: str = Field(..., alias="nodeId", serialization_alias="nodeId")
    x: float
    y: float
    width: float
    height: float
    source: list[str]
    target: list[str]

    model_config = {"populate_by_name": True}


# ============ Node Run Schemas ============

class NodeRunRequest(BaseModel):
    """Request schema for running a node - accepts full node definition."""
    name: Optional[str] = Field(None, min_length=1, description="Node alias name")
    type: NodeType = Field(..., description="Node type: text, image, video, audio")
    prompt: str = Field(..., min_length=1, description="Prompt for generation")
    model: str = Field(..., description="AI model name for generation")
    size: Optional[str] = Field(None, description="Size for image/video (e.g., '2K', '1024x768')")
    length: Optional[int] = Field(None, ge=1, description="Length in seconds for audio/video")
    watermark: Optional[bool] = Field(None, description="Add watermark to output")
    response_format: Optional[str] = Field("url", description="Output format: 'url' or 'b64_json'")

    model_config = {"populate_by_name": True}


class NodeRunResponse(BaseModel):
    """Response schema for node execution result."""
    status: str = Field(..., description="Execution status: success, failed")
    outputs: dict[str, Any] = Field(default_factory=dict, description="Output data from node execution")
    error: Optional[str] = Field(None, description="Error message if execution failed")

    model_config = {"populate_by_name": True}
