from typing import Optional

from fastapi import APIRouter, Depends, Query

from src.entities.user import User
from src.schema.model_config_schema import ModelAdminListResponse
from src.services.model_mgmt_service import ModelMgmtService
from src.utils.auth import require_auth

router = APIRouter(prefix="/modelmgmt", tags=["Model Management"])


@router.get("/list", response_model=ModelAdminListResponse)
async def list_models_admin(
    ability: Optional[str] = Query(None, description="Filter by ability type"),
    enabled: Optional[bool] = Query(None, description="Filter by enabled status"),
    user: User = Depends(require_auth),
):
    """
    List all models for admin management.

    Returns all models including disabled ones, with all fields including audit fields.
    This endpoint reads from database only (no fallback to local config).

    Raises 503 Service Unavailable if database is not available.
    """
    return ModelMgmtService.list_all(ability=ability, enabled=enabled)
