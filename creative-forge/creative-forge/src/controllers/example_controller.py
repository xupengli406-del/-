from fastapi import APIRouter, Query, Path

from src.schema.example_schema import (
    ExampleCreateRequest,
    ExampleUpdateRequest,
    ExampleResponse,
    ExampleListResponse,
    MessageResponse,
)
from src.services.example_service import ExampleService

router = APIRouter(prefix="/examples", tags=["Examples"])


@router.post("", response_model=ExampleResponse, status_code=201)
async def create_example(request: ExampleCreateRequest):
    """Create a new example."""
    return ExampleService.create(request)


@router.get("", response_model=ExampleListResponse)
async def list_examples(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=10, ge=1, le=100, description="Items per page"),
):
    """List all examples with pagination."""
    return ExampleService.list_all(page=page, page_size=page_size)


@router.get("/{example_id}", response_model=ExampleResponse)
async def get_example(
    example_id: str = Path(..., description="Example ID"),
):
    """Get an example by ID."""
    return ExampleService.get_by_id(example_id)


@router.put("/{example_id}", response_model=ExampleResponse)
async def update_example(
    request: ExampleUpdateRequest,
    example_id: str = Path(..., description="Example ID"),
):
    """Update an existing example."""
    return ExampleService.update(example_id, request)


@router.delete("/{example_id}", response_model=MessageResponse)
async def delete_example(
    example_id: str = Path(..., description="Example ID"),
):
    """Delete an example."""
    ExampleService.delete(example_id)
    return MessageResponse(message="Example deleted successfully")
