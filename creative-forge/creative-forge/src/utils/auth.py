from fastapi import Security
from fastapi.exceptions import HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.entities.user import User
from src.repositories.user_repository import UserRepository

_bearer_scheme = HTTPBearer(auto_error=False)


def require_auth(
    credentials: HTTPAuthorizationCredentials = Security(_bearer_scheme),
) -> User:
    """
    FastAPI dependency for token-based authentication.

    Expects header:  Authorization: Bearer <ak>
    For POC: resolves the ak against user_auth.json (future: Redis cache, then DB).
    """
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail={"code": "UNAUTHORIZED", "message": "Authorization header required. Expected: Bearer <ak>"},
        )

    user = UserRepository.find_by_ak(credentials.credentials)
    if not user:
        raise HTTPException(
            status_code=401,
            detail={"code": "UNAUTHORIZED", "message": "Invalid or expired token"},
        )

    return user
