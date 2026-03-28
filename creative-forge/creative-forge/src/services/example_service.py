from datetime import datetime
from typing import Optional
import uuid

from src.schema.example_schema import (
    ExampleCreateRequest,
    ExampleUpdateRequest,
    ExampleResponse,
    ExampleListResponse,
)
from src.exceptions.business_exception import NotFoundException


# In-memory storage (replace with database later)
_examples_db: dict[str, dict] = {}


class ExampleService:
    """Service layer for example business logic."""

    @staticmethod
    def create(request: ExampleCreateRequest) -> ExampleResponse:
        """Create a new example."""
        now = datetime.now()
        example_id = str(uuid.uuid4())

        example = {
            "id": example_id,
            "name": request.name,
            "description": request.description,
            "priority": request.priority,
            "created_at": now,
            "updated_at": now,
        }

        _examples_db[example_id] = example
        return ExampleResponse(**example)

    @staticmethod
    def get_by_id(example_id: str) -> ExampleResponse:
        """Get an example by ID."""
        if example_id not in _examples_db:
            raise NotFoundException(f"Example with id '{example_id}' not found")

        return ExampleResponse(**_examples_db[example_id])

    @staticmethod
    def list_all(page: int = 1, page_size: int = 10) -> ExampleListResponse:
        """List all examples with pagination."""
        all_examples = list(_examples_db.values())
        total = len(all_examples)

        # Pagination
        start = (page - 1) * page_size
        end = start + page_size
        paginated = all_examples[start:end]

        return ExampleListResponse(
            items=[ExampleResponse(**ex) for ex in paginated],
            total=total,
            page=page,
            page_size=page_size,
        )

    @staticmethod
    def update(example_id: str, request: ExampleUpdateRequest) -> ExampleResponse:
        """Update an existing example."""
        if example_id not in _examples_db:
            raise NotFoundException(f"Example with id '{example_id}' not found")

        example = _examples_db[example_id]

        # Update only provided fields
        if request.name is not None:
            example["name"] = request.name
        if request.description is not None:
            example["description"] = request.description
        if request.priority is not None:
            example["priority"] = request.priority

        example["updated_at"] = datetime.now()

        return ExampleResponse(**example)

    @staticmethod
    def delete(example_id: str) -> None:
        """Delete an example."""
        if example_id not in _examples_db:
            raise NotFoundException(f"Example with id '{example_id}' not found")

        del _examples_db[example_id]
