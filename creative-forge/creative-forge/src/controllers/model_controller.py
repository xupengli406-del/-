from typing import Optional

from fastapi import APIRouter, Depends, Query

from src.entities.user import User
from src.schema.model_config_schema import ModelListResponse
from src.services.model_config_service import ModelConfigService
from src.utils.auth import require_auth

router = APIRouter(prefix="/model", tags=["Model"])


@router.get("/list", response_model=ModelListResponse)
async def list_models(
    ability: Optional[str] = Query(None, description="Filter by ability type (text2img, text2video, chat_completion)"),
    user: User = Depends(require_auth),
):
    """
    List available models for users.

    Returns enabled models only, sorted by weight descending.
    Audit fields (created_at, updated_at, updated_by) are excluded.
    """
    return ModelConfigService.list_enabled(authed_models=user.authed_models, ability=ability)
