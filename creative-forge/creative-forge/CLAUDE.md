# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Creative Forge** is an AI-powered content creation workflow platform for producing comics, videos, and multimedia content at scale.

**Core Value**: Users input scripts, assets, and ideas → edit workflows → batch-produce reusable content (scripts, images, videos).

## Architecture

```
creative-forge/
├── main.py                     ← FastAPI app entry point
├── requirements.txt            ← Python dependencies
├── Dockerfile                  ← Docker container configuration
└── src/
    ├── controllers/            ← HTTP layer: API route handlers
    ├── services/               ← Business logic layer
    ├── repositories/           ← Data access layer (DAL)
    ├── entities/               ← Domain entities for persistence
    ├── schema/                 ← DTOs: Pydantic request/response models
    ├── exceptions/             ← Custom business exceptions
    ├── constants/              ← Application constants
    └── utils/                  ← Utility functions
```

### Layer Responsibilities

| Layer | Purpose | Rules |
|-------|---------|-------|
| **Controller** | HTTP interface | No business logic. Validate input, call service, return response. |
| **Service** | Business logic | Core application logic. Orchestrate repositories and external calls. |
| **Repository** | Data access | Abstract storage operations. Return entities, not schemas. |
| **Entity** | Domain models | Database representation. Include `to_dict()` / `from_dict()` methods. |
| **Schema** | DTOs | Request/response validation. Handle field aliases (camelCase ↔ snake_case). |
| **Exception** | Error handling | Business errors converted to HTTP responses by handlers in `main.py`. |

## Development Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
python main.py

# Run with Docker
docker build -t creative-forge .
docker run -d -p 8000:8000 --name creative-forge-app creative-forge

# API docs (local swagger-ui, no CDN dependency)
http://localhost:8000/docs
```

## Code Patterns

### Adding a New Feature

1. **Entity** (`src/entities/<feature>.py`):
   ```python
   from dataclasses import dataclass, field
   import uuid

   @dataclass
   class Feature:
       id: str = field(default_factory=lambda: str(uuid.uuid4()))
       name: str = ""

       def to_dict(self) -> dict:
           return {"id": self.id, "name": self.name}

       @classmethod
       def from_dict(cls, data: dict) -> "Feature":
           return cls(id=data.get("id"), name=data.get("name", ""))
   ```

2. **Schema** (`src/schema/<feature>_schema.py`):
   ```python
   from pydantic import BaseModel, Field

   class FeatureCreateRequest(BaseModel):
       name: str = Field(..., min_length=1, max_length=100)

   class FeatureResponse(BaseModel):
       id: str
       name: str
   ```

3. **Repository** (`src/repositories/<feature>_repository.py`):
   ```python
   from src.entities.feature import Feature

   _db: dict[str, dict] = {}

   class FeatureRepository:
       @staticmethod
       def save(feature: Feature) -> Feature:
           _db[feature.id] = feature.to_dict()
           return feature

       @staticmethod
       def find_by_id(feature_id: str) -> Feature | None:
           data = _db.get(feature_id)
           return Feature.from_dict(data) if data else None
   ```

4. **Service** (`src/services/<feature>_service.py`):
   ```python
   from src.schema.feature_schema import FeatureCreateRequest, FeatureResponse
   from src.entities.feature import Feature
   from src.repositories.feature_repository import FeatureRepository
   from src.exceptions.business_exception import NotFoundException

   class FeatureService:
       @staticmethod
       def create(request: FeatureCreateRequest) -> FeatureResponse:
           feature = Feature(name=request.name)
           FeatureRepository.save(feature)
           return FeatureResponse(id=feature.id, name=feature.name)

       @staticmethod
       def get_by_id(feature_id: str) -> FeatureResponse:
           feature = FeatureRepository.find_by_id(feature_id)
           if not feature:
               raise NotFoundException(f"Feature '{feature_id}' not found")
           return FeatureResponse(id=feature.id, name=feature.name)
   ```

5. **Controller** (`src/controllers/<feature>_controller.py`):
   ```python
   from fastapi import APIRouter
   from src.schema.feature_schema import FeatureCreateRequest, FeatureResponse
   from src.services.feature_service import FeatureService

   router = APIRouter(prefix="/features", tags=["Features"])

   @router.post("", response_model=FeatureResponse)
   async def create_feature(request: FeatureCreateRequest):
       return FeatureService.create(request)

   @router.get("/{feature_id}", response_model=FeatureResponse)
   async def get_feature(feature_id: str):
       return FeatureService.get_by_id(feature_id)
   ```

6. **Register** in `main.py`:
   ```python
   from src.controllers.feature_controller import router as feature_router
   app.include_router(feature_router)
   ```

### Exception Handling

Use custom exceptions from `src/exceptions/business_exception.py`:
```python
from src.exceptions.business_exception import NotFoundException, BusinessException

# 404 Not Found
raise NotFoundException(f"Resource with id '{id}' not found")

# 400 Bad Request
raise BusinessException("Invalid operation")
```

Exception handlers in `main.py` convert these to proper HTTP responses.

### Field Naming Convention

- **Python code**: snake_case (`content_url`, `node_id`)
- **API JSON**: camelCase (`contentUrl`, `nodeId`)

Use Pydantic aliases to handle conversion:
```python
class NodeRequest(BaseModel):
    node_id: str = Field(..., alias="nodeId")
    content_url: str = Field(None, alias="contentUrl")

    model_config = {"populate_by_name": True}
```

## Key Dependencies

- **FastAPI** + **uvicorn** - Web framework
- **Pydantic** - Request/response validation
- **swagger-ui-bundle** - Local API documentation (no CDN)

## TODO

### 数据库接入
`ModelConfigRepository` 当前使用本地 JSON 文件作为 fallback 数据源。需要：
- 接入数据库作为主数据源
- 实现定时任务同步 DB 配置到本地 JSON 文件
- `/modelmgmt/*` 管理接口仅从 DB 读取，不允许 fallback

### 纯异步执行
当前 `AsyncPollingExecutor` 使用轮询模式等待结果。未来改进：
- 后端异步执行，结果转存到对象存储
- 前端从对象存储获取结果
- 移除轮询等待逻辑
