"""MCP 工具: 项目文件管理"""

import json
import uuid
import time
from fastmcp import FastMCP
from src.mcp import forge_client


def register(mcp: FastMCP) -> None:

    @mcp.tool()
    async def list_canvas_files() -> str:
        """List all project files.

        Project files are containers for image/video generation tasks,
        each holding media versions and AI chat sessions.

        Returns:
            JSON array of project files with id, name, projectType, createdAt, updatedAt.
        """
        files = await forge_client.get_canvas_files()
        return json.dumps(files, ensure_ascii=False, indent=2)

    @mcp.tool()
    async def manage_canvas_file(
        action: str,
        file_id: str = "",
        name: str = "",
        project_type: str = "",
    ) -> str:
        """Create, update, or delete a project file.

        Args:
            action: The operation to perform. One of: create, update, delete.
            file_id: ID of the project file. Required for update and delete.
                    Auto-generated for create.
            name: Project name. Required for create, optional for update.
            project_type: Optional project type identifier for create (image or video).

        Returns:
            JSON of the project file (for create/update) or confirmation (for delete).
        """
        if action == "create":
            if not name:
                return json.dumps({"error": "创建项目文件需要 name 参数"})
            now = time.time()
            data = {
                "id": str(uuid.uuid4()),
                "name": name,
                "thumbnailUrl": "",
                "createdAt": now,
                "updatedAt": now,
            }
            if project_type:
                data["projectType"] = project_type
            result = await forge_client.create_canvas_file(data)
            return json.dumps(result, ensure_ascii=False)

        elif action == "update":
            if not file_id:
                return json.dumps({"error": "更新项目文件需要 file_id 参数"})
            # 先获取现有数据
            files = await forge_client.get_canvas_files()
            existing = next((f for f in files if f.get("id") == file_id), None)
            if not existing:
                return json.dumps({"error": f"项目文件 {file_id} 不存在"})
            if name:
                existing["name"] = name
            existing["updatedAt"] = time.time()
            result = await forge_client.update_canvas_file(file_id, existing)
            return json.dumps(result, ensure_ascii=False)

        elif action == "delete":
            if not file_id:
                return json.dumps({"error": "删除项目文件需要 file_id 参数"})
            result = await forge_client.delete_canvas_file(file_id)
            return json.dumps(result, ensure_ascii=False)

        else:
            return json.dumps({"error": f"未知操作: {action}，支持: create, update, delete"})
