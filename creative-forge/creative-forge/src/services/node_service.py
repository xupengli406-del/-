from typing import Optional
import uuid

from src.schema.node_schema import (
    NodeCreateRequest,
    NodeUpdateRequest,
    NodeResponse,
    NodeContentResponse,
    NodeLayoutCreateRequest,
    NodeLayoutUpdateRequest,
    NodeLayoutResponse,
    NodeRunRequest,
    NodeRunResponse,
)
from src.entities.node import Node, NodeContent, NodeLayout
from src.repositories.node_repository import NodeRepository, NodeLayoutRepository
from src.exceptions.business_exception import NotFoundException, BusinessException
from src.services.ai_model_services import get_executor


class NodeService:
    """Service layer for node business logic."""

    @staticmethod
    def create(request: NodeCreateRequest) -> NodeResponse:
        """Create a new node."""
        node_id = str(uuid.uuid4())

        content = NodeContent(
            content_url=request.content.content_url,
            content_b64=request.content.content_b64,
            status=request.content.status.value,
        )

        node = Node(
            id=node_id,
            name=request.name,
            type=request.type.value,
            prompt=request.prompt,
            content=content,
            source=request.source,
            target=request.target,
            model=request.model,
            size=request.size,
            length=request.length,
        )

        NodeRepository.save(node)
        return NodeService._to_response(node)

    @staticmethod
    def get_by_id(node_id: str) -> NodeResponse:
        """Get a node by ID."""
        node = NodeRepository.find_by_id(node_id)
        if node is None:
            raise NotFoundException(f"Node with id '{node_id}' not found")
        return NodeService._to_response(node)

    @staticmethod
    def list_all() -> list[NodeResponse]:
        """List all nodes."""
        nodes = NodeRepository.find_all()
        return [NodeService._to_response(node) for node in nodes]

    @staticmethod
    def update(node_id: str, request: NodeUpdateRequest) -> NodeResponse:
        """Update an existing node."""
        node = NodeRepository.find_by_id(node_id)
        if node is None:
            raise NotFoundException(f"Node with id '{node_id}' not found")

        if request.name is not None:
            node.name = request.name
        if request.type is not None:
            node.type = request.type.value
        if request.prompt is not None:
            node.prompt = request.prompt
        if request.content is not None:
            node.content = NodeContent(
                content_url=request.content.content_url,
                content_b64=request.content.content_b64,
                status=request.content.status.value,
            )
        if request.source is not None:
            node.source = request.source
        if request.target is not None:
            node.target = request.target
        if request.model is not None:
            node.model = request.model
        if request.size is not None:
            node.size = request.size
        if request.length is not None:
            node.length = request.length

        NodeRepository.save(node)
        return NodeService._to_response(node)

    @staticmethod
    def delete(node_id: str) -> None:
        """Delete a node."""
        if not NodeRepository.exists(node_id):
            raise NotFoundException(f"Node with id '{node_id}' not found")
        NodeRepository.delete(node_id)
        # Also delete associated layout if exists
        NodeLayoutRepository.delete(node_id)

    @staticmethod
    async def run(request: NodeRunRequest, authed_models: dict, ak: str) -> NodeRunResponse:
        """Run a node with given definition."""
        try:
            executor, model_config = get_executor(request.model)
        except ValueError as e:
            raise BusinessException(str(e))

        # Resolve endpoint_path from user's permissions
        paths = authed_models.get(model_config.name)
        if not paths:
            raise BusinessException(f"Model '{model_config.name}' is not authorized for this user")

        # Build execution parameters from request
        exec_kwargs = {
            "model_config": model_config,
            "endpoint_path": paths[0],
            "ak": ak,
        }
        if request.size:
            exec_kwargs["size"] = request.size
        if request.watermark is not None:
            exec_kwargs["watermark"] = request.watermark
        if request.response_format:
            exec_kwargs["response_format"] = request.response_format
        if request.length is not None:
            exec_kwargs["duration"] = request.length

        # Execute the model
        result = await executor.execute(
            prompt=request.prompt,
            **exec_kwargs,
        )

        if not result.success:
            return NodeRunResponse(
                status="failed",
                outputs={},
                error=result.error,
            )

        # Build outputs from result
        outputs = {}
        if result.content_url:
            outputs["content_url"] = result.content_url
        if result.content_b64:
            outputs["content_b64"] = result.content_b64
        if result.text:
            outputs["text"] = result.text
        if result.size:
            outputs["size"] = result.size

        return NodeRunResponse(
            status="success",
            outputs=outputs,
            error=None,
        )

    @staticmethod
    def _to_response(node: Node) -> NodeResponse:
        """Convert node entity to response schema."""
        return NodeResponse(
            id=node.id,
            name=node.name,
            type=node.type,
            prompt=node.prompt,
            content=NodeContentResponse(
                content_url=node.content.content_url,
                content_b64=node.content.content_b64,
                status=node.content.status,
            ),
            source=node.source,
            target=node.target,
            model=node.model,
            size=node.size,
            length=node.length,
        )


class NodeLayoutService:
    """Service layer for node layout business logic."""

    @staticmethod
    def create(request: NodeLayoutCreateRequest) -> NodeLayoutResponse:
        """Create a new node layout."""
        layout = NodeLayout(
            node_id=request.node_id,
            x=request.x,
            y=request.y,
            width=request.width,
            height=request.height,
            source=request.source,
            target=request.target,
        )

        NodeLayoutRepository.save(layout)
        return NodeLayoutService._to_response(layout)

    @staticmethod
    def get_by_node_id(node_id: str) -> NodeLayoutResponse:
        """Get a node layout by node ID."""
        layout = NodeLayoutRepository.find_by_node_id(node_id)
        if layout is None:
            raise NotFoundException(f"NodeLayout for node '{node_id}' not found")
        return NodeLayoutService._to_response(layout)

    @staticmethod
    def list_all() -> list[NodeLayoutResponse]:
        """List all node layouts."""
        layouts = NodeLayoutRepository.find_all()
        return [NodeLayoutService._to_response(layout) for layout in layouts]

    @staticmethod
    def update(node_id: str, request: NodeLayoutUpdateRequest) -> NodeLayoutResponse:
        """Update an existing node layout."""
        layout = NodeLayoutRepository.find_by_node_id(node_id)
        if layout is None:
            raise NotFoundException(f"NodeLayout for node '{node_id}' not found")

        if request.x is not None:
            layout.x = request.x
        if request.y is not None:
            layout.y = request.y
        if request.width is not None:
            layout.width = request.width
        if request.height is not None:
            layout.height = request.height
        if request.source is not None:
            layout.source = request.source
        if request.target is not None:
            layout.target = request.target

        NodeLayoutRepository.save(layout)
        return NodeLayoutService._to_response(layout)

    @staticmethod
    def delete(node_id: str) -> None:
        """Delete a node layout."""
        if not NodeLayoutRepository.exists(node_id):
            raise NotFoundException(f"NodeLayout for node '{node_id}' not found")
        NodeLayoutRepository.delete(node_id)

    @staticmethod
    def _to_response(layout: NodeLayout) -> NodeLayoutResponse:
        """Convert node layout entity to response schema."""
        return NodeLayoutResponse(
            node_id=layout.node_id,
            x=layout.x,
            y=layout.y,
            width=layout.width,
            height=layout.height,
            source=layout.source,
            target=layout.target,
        )
