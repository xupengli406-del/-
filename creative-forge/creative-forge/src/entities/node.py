from dataclasses import dataclass, field
from typing import Optional
from enum import Enum
import uuid


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


@dataclass
class NodeContent:
    """Content entity for node."""
    status: str = ContentStatus.CREATED.value
    content_url: Optional[str] = None
    content_b64: Optional[str] = None

    def to_dict(self) -> dict:
        """Convert entity to dictionary."""
        return {
            "content_url": self.content_url,
            "content_b64": self.content_b64,
            "status": self.status,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "NodeContent":
        """Create entity from dictionary."""
        return cls(
            content_url=data.get("content_url"),
            content_b64=data.get("content_b64"),
            status=data.get("status", ContentStatus.CREATED.value),
        )


@dataclass
class Node:
    """Node entity for workflow graph."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    type: str = NodeType.TEXT.value
    prompt: str = ""
    content: NodeContent = field(default_factory=NodeContent)
    source: list[str] = field(default_factory=list)
    target: list[str] = field(default_factory=list)
    model: Optional[str] = None
    size: Optional[str] = None
    length: Optional[int] = None

    def to_dict(self) -> dict:
        """Convert entity to dictionary."""
        result = {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "prompt": self.prompt,
            "content": self.content.to_dict() if self.content else None,
            "source": self.source,
            "target": self.target,
        }
        if self.model is not None:
            result["model"] = self.model
        if self.size is not None:
            result["size"] = self.size
        if self.length is not None:
            result["length"] = self.length
        return result

    @classmethod
    def from_dict(cls, data: dict) -> "Node":
        """Create entity from dictionary."""
        content_data = data.get("content", {})
        return cls(
            id=data.get("id", str(uuid.uuid4())),
            name=data.get("name", ""),
            type=data.get("type", NodeType.TEXT.value),
            prompt=data.get("prompt", ""),
            content=NodeContent.from_dict(content_data) if content_data else NodeContent(),
            source=data.get("source", []),
            target=data.get("target", []),
            model=data.get("model"),
            size=data.get("size"),
            length=data.get("length"),
        )


@dataclass
class NodeLayout:
    """Node layout entity for canvas positioning."""
    node_id: str = ""
    x: float = 0.0
    y: float = 0.0
    width: float = 0.0
    height: float = 0.0
    source: list[str] = field(default_factory=list)
    target: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        """Convert entity to dictionary."""
        return {
            "node_id": self.node_id,
            "x": self.x,
            "y": self.y,
            "width": self.width,
            "height": self.height,
            "source": self.source,
            "target": self.target,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "NodeLayout":
        """Create entity from dictionary."""
        return cls(
            node_id=data.get("node_id", ""),
            x=data.get("x", 0.0),
            y=data.get("y", 0.0),
            width=data.get("width", 0.0),
            height=data.get("height", 0.0),
            source=data.get("source", []),
            target=data.get("target", []),
        )
