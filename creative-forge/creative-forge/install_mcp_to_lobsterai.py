"""
将 Creative Forge MCP Server 注册到 LobsterAI 桌面应用。

运行前请确保 LobsterAI 已完全关闭（避免 SQLite 锁冲突）。

用法:
    python install_mcp_to_lobsterai.py [--url URL] [--uninstall]

选项:
    --url       MCP Server 地址 (默认 http://localhost:3001/mcp)
    --uninstall 卸载：从 LobsterAI 中移除 creative-forge
"""

import argparse
import json
import os
import sqlite3
import sys
import time
import uuid

SERVER_NAME = "creative-forge"
DEFAULT_URL = "http://localhost:3001/mcp"
DESCRIPTION = "AI漫剧Agent - 图片/视频/文本生成与文件管理"


def get_lobsterai_appdata() -> str:
    appdata = os.environ.get("APPDATA", "")
    if not appdata:
        print("错误: 未找到 APPDATA 环境变量（仅支持 Windows）")
        sys.exit(1)
    path = os.path.join(appdata, "LobsterAI")
    if not os.path.isdir(path):
        print(f"错误: LobsterAI 数据目录不存在: {path}")
        print("请先安装并至少启动一次 LobsterAI")
        sys.exit(1)
    return path


def install_sqlite(lobsterai_dir: str, url: str) -> None:
    db_path = os.path.join(lobsterai_dir, "lobsterai.sqlite")
    if not os.path.isfile(db_path):
        print(f"警告: SQLite 数据库不存在: {db_path}，跳过")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("SELECT id FROM mcp_servers WHERE name = ?", [SERVER_NAME])
    existing = cur.fetchone()

    if existing:
        now = int(time.time() * 1000)
        config_json = json.dumps({"url": url})
        cur.execute(
            "UPDATE mcp_servers SET config_json = ?, enabled = 1, updated_at = ? WHERE name = ?",
            [config_json, now, SERVER_NAME],
        )
        conn.commit()
        print(f"[SQLite] 已更新 {SERVER_NAME} (id={existing[0]})")
    else:
        server_id = str(uuid.uuid4())
        now = int(time.time() * 1000)
        config_json = json.dumps({"url": url})
        cur.execute(
            "INSERT INTO mcp_servers (id, name, description, enabled, transport_type, config_json, created_at, updated_at) "
            "VALUES (?, ?, ?, 1, 'http', ?, ?, ?)",
            [server_id, SERVER_NAME, DESCRIPTION, config_json, now, now],
        )
        conn.commit()
        print(f"[SQLite] 已注册 {SERVER_NAME} (id={server_id})")

    conn.close()


def uninstall_sqlite(lobsterai_dir: str) -> None:
    db_path = os.path.join(lobsterai_dir, "lobsterai.sqlite")
    if not os.path.isfile(db_path):
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("DELETE FROM mcp_servers WHERE name = ?", [SERVER_NAME])
    deleted = cur.rowcount
    conn.commit()
    conn.close()
    print(f"[SQLite] 已删除 {deleted} 条记录")


def install_mcp_config(lobsterai_dir: str, url: str) -> None:
    config_path = os.path.join(lobsterai_dir, "SKILLs", "mcp.config.json")
    if not os.path.isfile(config_path):
        print(f"警告: mcp.config.json 不存在: {config_path}，跳过")
        return

    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    servers = config.setdefault("mcpServers", {})
    servers[SERVER_NAME] = {"serverUrl": url}

    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"[mcp.config.json] 已添加 {SERVER_NAME}")


def uninstall_mcp_config(lobsterai_dir: str) -> None:
    config_path = os.path.join(lobsterai_dir, "SKILLs", "mcp.config.json")
    if not os.path.isfile(config_path):
        return

    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    servers = config.get("mcpServers", {})
    if SERVER_NAME in servers:
        del servers[SERVER_NAME]
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"[mcp.config.json] 已移除 {SERVER_NAME}")
    else:
        print(f"[mcp.config.json] 未找到 {SERVER_NAME}")


def main():
    parser = argparse.ArgumentParser(description="将 Creative Forge MCP Server 注册到 LobsterAI")
    parser.add_argument("--url", default=DEFAULT_URL, help=f"MCP Server 地址 (默认 {DEFAULT_URL})")
    parser.add_argument("--uninstall", action="store_true", help="卸载：移除 creative-forge")
    args = parser.parse_args()

    lobsterai_dir = get_lobsterai_appdata()

    if args.uninstall:
        print(f"正在从 LobsterAI 卸载 {SERVER_NAME}...")
        uninstall_sqlite(lobsterai_dir)
        uninstall_mcp_config(lobsterai_dir)
        print("卸载完成。请重启 LobsterAI 使更改生效。")
    else:
        print(f"正在将 {SERVER_NAME} 注册到 LobsterAI...")
        print(f"  URL: {args.url}")
        install_sqlite(lobsterai_dir, args.url)
        install_mcp_config(lobsterai_dir, args.url)
        print("安装完成。请重启 LobsterAI 使更改生效。")


if __name__ == "__main__":
    main()
