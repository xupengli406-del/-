from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional
import uuid


class ModelAbility(str, Enum):
    """Available model abilities."""
    TEXT2IMG = "text2img"
    TEXT2VIDEO = "text2video"
    CHAT_COMPLETION = "chat_completion"


@dataclass
class ModelConfig:
    """Model configuration entity."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    ability: str = ModelAbility.TEXT2IMG.value
    provider: str = ""
    api_suffix: str = ""
    executor_class_name: str = ""
    parameters: dict = field(default_factory=dict)
    description: str = ""
    weight: int = 0
    cost_rate: float = 1.0
    enabled: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    updated_by: str = ""

    def __post_init__(self):
        """Set default timestamps if not provided."""
        now = datetime.now()
        if self.created_at is None:
            self.created_at = now
        if self.updated_at is None:
            self.updated_at = now

    def to_dict(self) -> dict:
        """Convert entity to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "ability": self.ability,
            "provider": self.provider,
            "api_suffix": self.api_suffix,
            "executor_class_name": self.executor_class_name,
            "parameters": self.parameters,
            "description": self.description,
            "weight": self.weight,
            "cost_rate": self.cost_rate,
            "enabled": self.enabled,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "updated_by": self.updated_by,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "ModelConfig":
        """Create entity from dictionary."""
        created_at = data.get("created_at")
        updated_at = data.get("updated_at")

        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        if isinstance(updated_at, str):
            updated_at = datetime.fromisoformat(updated_at)

        return cls(
            id=data.get("id", str(uuid.uuid4())),
            name=data.get("name", ""),
            ability=data.get("ability", ModelAbility.TEXT2IMG.value),
            provider=data.get("provider", ""),
            api_suffix=data.get("api_suffix", ""),
            executor_class_name=data.get("executor_class_name", ""),
            parameters=data.get("parameters", {}),
            description=data.get("description", ""),
            weight=data.get("weight", 0),
            cost_rate=data.get("cost_rate", 1.0),
            enabled=data.get("enabled", True),
            created_at=created_at,
            updated_at=updated_at,
            updated_by=data.get("updated_by", ""),
        )
