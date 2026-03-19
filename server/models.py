"""
SQLAlchemy 数据模型
"""
import time
import uuid

from sqlalchemy import Column, String, Float, Integer, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


def gen_id() -> str:
    return uuid.uuid4().hex[:12]


def now_ts() -> float:
    return time.time()


# ===== 用户 =====

class User(Base):
    __tablename__ = "users"

    id = Column(String(12), primary_key=True, default=gen_id)
    username = Column(String(64), unique=True, nullable=False, index=True)
    display_name = Column(String(128), nullable=False)
    hashed_password = Column(String(256), nullable=False)
    created_at = Column(Float, default=now_ts)

    workspaces = relationship("Workspace", back_populates="owner")


# ===== 工作空间 =====

class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(String(12), primary_key=True, default=gen_id)
    name = Column(String(256), nullable=False)
    description = Column(Text, default="")
    owner_id = Column(String(12), ForeignKey("users.id"), nullable=True)
    canvas_data = Column(Text, default="{}")  # JSON: nodes + edges + viewport
    settings = Column(Text, default="{}")     # JSON: 项目配置
    created_at = Column(Float, default=now_ts)
    updated_at = Column(Float, default=now_ts, onupdate=now_ts)

    owner = relationship("User", back_populates="workspaces")
    assets = relationship("Asset", back_populates="workspace")
    generations = relationship("GenerationRecord", back_populates="workspace")


# ===== 素材 =====

class Asset(Base):
    __tablename__ = "assets"

    id = Column(String(12), primary_key=True, default=gen_id)
    name = Column(String(256), nullable=False)
    file_path = Column(String(512), nullable=False)
    url = Column(String(512), nullable=False)
    file_type = Column(String(32), nullable=False)  # "image" | "video" | "audio"
    file_size = Column(Integer, default=0)
    tags = Column(Text, default="[]")  # JSON array of strings
    workspace_id = Column(String(12), ForeignKey("workspaces.id"), nullable=True)
    created_at = Column(Float, default=now_ts)

    workspace = relationship("Workspace", back_populates="assets")


# ===== 生成记录 =====

class GenerationRecord(Base):
    __tablename__ = "generation_records"

    id = Column(String(12), primary_key=True, default=gen_id)
    model_type = Column(String(32), nullable=False)  # "image" | "text" | "video" | "audio"
    model_id = Column(String(64), nullable=True)
    prompt = Column(Text, nullable=False)
    negative_prompt = Column(Text, nullable=True)
    status = Column(String(32), nullable=False)  # "pending" | "completed" | "failed"
    result_url = Column(String(512), nullable=True)
    result_text = Column(Text, nullable=True)
    revised_prompt = Column(Text, nullable=True)
    error = Column(Text, nullable=True)
    workspace_id = Column(String(12), ForeignKey("workspaces.id"), nullable=True)
    node_id = Column(String(64), nullable=True)
    created_at = Column(Float, default=now_ts)

    workspace = relationship("Workspace", back_populates="generations")


# ===== Prompt 模板 =====

class PromptTemplate(Base):
    __tablename__ = "prompt_templates"

    id = Column(String(12), primary_key=True, default=gen_id)
    name = Column(String(256), nullable=False)
    content = Column(Text, nullable=False)
    model_type = Column(String(32), nullable=False)
    category = Column(String(64), default="general")
    is_builtin = Column(Boolean, default=False)
    workspace_id = Column(String(12), ForeignKey("workspaces.id"), nullable=True)
    created_at = Column(Float, default=now_ts)


# ===== 角色 =====

class Character(Base):
    __tablename__ = "characters"

    id = Column(String(12), primary_key=True, default=gen_id)
    name = Column(String(128), nullable=False)
    description = Column(Text, default="")
    appearance_prompt = Column(Text, default="")  # 外观描述 prompt
    personality = Column(Text, default="")
    reference_image_url = Column(String(512), nullable=True)
    workspace_id = Column(String(12), ForeignKey("workspaces.id"), nullable=True)
    created_at = Column(Float, default=now_ts)
