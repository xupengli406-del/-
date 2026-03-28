from typing import Optional

from src.entities.node import Node, NodeLayout


# In-memory storage (replace with database later)
_nodes_db: dict[str, dict] = {}
_node_layouts_db: dict[str, dict] = {}


class NodeRepository:
    """Data access layer for Node entity."""

    @staticmethod
    def save(node: Node) -> Node:
        """Save a node to the database."""
        _nodes_db[node.id] = node.to_dict()
        return node

    @staticmethod
    def find_by_id(node_id: str) -> Optional[Node]:
        """Find a node by ID."""
        data = _nodes_db.get(node_id)
        if data is None:
            return None
        return Node.from_dict(data)

    @staticmethod
    def find_all() -> list[Node]:
        """Find all nodes."""
        return [Node.from_dict(data) for data in _nodes_db.values()]

    @staticmethod
    def delete(node_id: str) -> bool:
        """Delete a node by ID. Returns True if deleted, False if not found."""
        if node_id in _nodes_db:
            del _nodes_db[node_id]
            return True
        return False

    @staticmethod
    def exists(node_id: str) -> bool:
        """Check if a node exists."""
        return node_id in _nodes_db


class NodeLayoutRepository:
    """Data access layer for NodeLayout entity."""

    @staticmethod
    def save(layout: NodeLayout) -> NodeLayout:
        """Save a node layout to the database."""
        _node_layouts_db[layout.node_id] = layout.to_dict()
        return layout

    @staticmethod
    def find_by_node_id(node_id: str) -> Optional[NodeLayout]:
        """Find a node layout by node ID."""
        data = _node_layouts_db.get(node_id)
        if data is None:
            return None
        return NodeLayout.from_dict(data)

    @staticmethod
    def find_all() -> list[NodeLayout]:
        """Find all node layouts."""
        return [NodeLayout.from_dict(data) for data in _node_layouts_db.values()]

    @staticmethod
    def delete(node_id: str) -> bool:
        """Delete a node layout by node ID. Returns True if deleted, False if not found."""
        if node_id in _node_layouts_db:
            del _node_layouts_db[node_id]
            return True
        return False

    @staticmethod
    def exists(node_id: str) -> bool:
        """Check if a node layout exists."""
        return node_id in _node_layouts_db
