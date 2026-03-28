from fastapi import APIRouter

from src.schema.user_schema import AuthenticationRequest, AuthenticationResponse
from src.services.user_service import UserService

router = APIRouter(prefix="/user", tags=["User"])


@router.post("/auth", response_model=AuthenticationResponse)
async def authenticate(request: AuthenticationRequest):
    return UserService.authenticate(request)
