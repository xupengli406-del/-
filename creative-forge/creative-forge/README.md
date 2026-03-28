# Creative Forge

AI-powered content creation platform for producing videos, comics and multimedia content at scale.

## What is Creative Forge?

Creative Forge enables users to:
- Input scripts, assets, and creative ideas
- Design and edit reusable workflows
- Batch-produce content: scripts, images, videos, and more

## Project Structure

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
    └── utils/                  ← Common utility functions
```

### Layer Descriptions

| Layer | Directory | Description |
|-------|-----------|-------------|
| **Controller** | `src/controllers/` | HTTP layer. Handles incoming requests, validates input via schemas, delegates to services, and returns responses. No business logic here. |
| **Service** | `src/services/` | Business logic layer. Contains core application logic, orchestrates operations, and coordinates between repositories and external services. |
| **Repository** | `src/repositories/` | Data access layer. Abstracts database operations (CRUD). Currently uses in-memory storage, easily swappable to real databases. |
| **Entity** | `src/entities/` | Domain models for persistence. Represents database records with `to_dict()` / `from_dict()` conversion methods. |
| **Schema** | `src/schema/` | Data Transfer Objects (DTOs). Pydantic models for request validation and response serialization. Handles camelCase ↔ snake_case mapping. |
| **Exception** | `src/exceptions/` | Custom exceptions for business errors (e.g., `NotFoundException`, `BusinessException`). Converted to HTTP responses by handlers in `main.py`. |

## API Documentation
你可以参考项目中的/docs/api.md文件获取详细的接口文档，也可以通过Swagger UI查看自动生成的交互式文档并且进行简单的验证和调试.
- **API DOC**: /docs/api.md 
    - ✅️可以通过API DOC查看接口文档
    - ✅️将其导入AI Coding Assistant进行接口联调/测试
    - ❌️不保证实时更新 
- **Swagger UI**: http://localhost:8000/docs (本地部署后访问)
    - ✅️自动生成的交互式API文档，实时反映代码中的接口定义和限制
    - ✅️适合开发过程中快速测试接口以及理解接口返回结构
    - ❌️不兼容AI Coding
    - ❌️不适合离线查看

## Docker 部署指南
部署本地服务
### 前置条件

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 已安装

### 部署步骤

#### 1. 克隆项目

```bash
git clone http://192.168.0.3/cloudapplications/creative-forge.git
cd creative-forge
```

#### 2. 配置环境变量

创建 `.env` 文件：

```bash
# .env
AI_BASE_URL=https://genaiapipre.cloudsway.net
```

#### 3. 启动服务

```bash
docker-compose up -d
```

首次运行会自动构建镜像。

#### 4. 验证部署

```bash
# 检查容器状态
docker ps

# 查看日志
docker logs creative-forge-app

# 健康检查
curl http://localhost:8000/health

# API 文档
open http://localhost:8000/docs
```

### 常用运维命令

```bash
# 查看日志（实时）
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 代码更新后重新部署
docker-compose up -d --build
```

### 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| AI_BASE_URL | 通用 AI 服务 Base URL | https://genaiapipre.cloudsway.net |

> 注意：Provider 级别的环境变量优先级高于通用配置。

## Quick Start
开发阶段本地快速验证功能
```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
python main.py
```
Server runs at `http://localhost:8000`

## API Endpoints

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

### Nodes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/nodes` | List all nodes |
| POST | `/nodes/run` | Run a node |
| GET | `/nodes/{id}` | Get node by ID |
| PUT | `/nodes/{id}` | Update node |
| DELETE | `/nodes/{id}` | Delete node |

### Node Layouts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/nodes/layouts` | Create node layout |
| GET | `/nodes/layouts` | List all layouts |
| GET | `/nodes/layouts/{nodeId}` | Get layout by node ID |
| PUT | `/nodes/layouts/{nodeId}` | Update layout |
| DELETE | `/nodes/layouts/{nodeId}` | Delete layout |

### Examples
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/examples` | List examples (paginated) |
| POST | `/examples` | Create example |
| GET | `/examples/{id}` | Get example by ID |
| PUT | `/examples/{id}` | Update example |
| DELETE | `/examples/{id}` | Delete example |

### Models (User API)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/model/list` | List enabled models (with optional ability filter) |

### Model Management (Admin API)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/modelmgmt/list` | List all models (DB only, returns 503 if DB unavailable) |

## TODO

### 数据库接入
`ModelConfigRepository` currently uses local JSON file as fallback. Planned:
- Connect database as primary data source
- Implement scheduled sync from DB to local JSON
- `/modelmgmt/*` admin APIs read from DB only (no fallback)

### 纯异步执行
Current `AsyncPollingExecutor` uses polling mode. Future improvements:
- Backend async execution with results stored in object storage
- Frontend retrieves results from object storage
- Remove polling wait logic

## License

[Add your license information here]
