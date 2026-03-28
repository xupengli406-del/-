from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
async def health():
    """Simple health check endpoint."""
    return {"status": "ok"}
