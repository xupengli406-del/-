from fastapi import APIRouter, Body, Depends

from src.entities.user import User
from src.schema.node_schema import (
    NodeCreateRequest,
    NodeUpdateRequest,
    NodeResponse,
    NodeLayoutCreateRequest,
    NodeLayoutUpdateRequest,
    NodeLayoutResponse,
    NodeRunRequest,
    NodeRunResponse,
)
from src.services.node_service import NodeService, NodeLayoutService
from src.utils.auth import require_auth

router = APIRouter(prefix="/nodes", tags=["Node"])


# ============ Node Endpoints ============


SEEDREAM_EXAMPLE = {
    "id": "temptestnode0",
    "type": "image",
    "prompt": "一位气质优雅的年轻女性站在壮丽的雪山之巅，长发随寒风飘扬，身穿白色羽绒服，背景是连绵的雪峰和湛蓝天空，金色阳光洒落在雪山上，电影级构图，史诗感氛围，超高清画质，细节丰富，层次分明",
    "model": "MaaS_Seedream_4.5",
    "size": "2K",
    "response_format": "url"
}


@router.get("", response_model=list[NodeResponse])
async def list_nodes():
    """List all nodes."""
    return NodeService.list_all()

@router.post("/run", response_model=NodeRunResponse)
async def run_node(
    request: NodeRunRequest = Body(..., example=SEEDREAM_EXAMPLE),
    user: User = Depends(require_auth),
):
    """Run a node."""
    return await NodeService.run(request, authed_models=user.authed_models, ak=user.ak)
