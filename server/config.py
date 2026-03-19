"""
应用配置 - 环境变量管理
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# 基础路径
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# 数据库
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'app.db'}")

# 服务端口
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# CORS
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

# JWT 认证
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "24"))

# AI 服务配置
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
COMFYUI_URL = os.getenv("COMFYUI_URL", "http://127.0.0.1:8188")

# Mock 模式（无真实 AI Key 时自动启用）
MOCK_MODE = os.getenv("MOCK_MODE", "auto")  # "auto" | "true" | "false"

def is_mock_mode() -> bool:
    if MOCK_MODE == "true":
        return True
    if MOCK_MODE == "false":
        return False
    # auto: 没有任何 AI key 时使用 mock
    return not (OPENAI_API_KEY or ANTHROPIC_API_KEY)
