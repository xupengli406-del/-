# ComicStudio AI - 产品需求文档 (PRD)

> **版本**: v0.1.0 (POC)
> **更新日期**: 2026-03-29
> **状态**: 当前已实现功能梳理
> **面向对象**: 前端、后端、设计、测试全团队

---

## 目录

1. [产品概述](#1-产品概述)
2. [产品架构](#2-产品架构)
3. [核心数据模型](#3-核心数据模型)
4. [功能模块详述](#4-功能模块详述)
   - 4.1 [工作区系统](#41-工作区系统)
   - 4.2 [文件管理系统](#42-文件管理系统)
   - 4.3 [AI 生成系统](#43-ai-生成系统)
   - 4.4 [画布编辑器](#44-画布编辑器)
   - 4.5 [剧本编辑器](#45-剧本编辑器)
   - 4.6 [角色管理](#46-角色管理)
   - 4.7 [场景管理](#47-场景管理)
   - 4.8 [分镜系统](#48-分镜系统)
   - 4.9 [素材库](#49-素材库)
   - 4.10 [持久化与数据同步](#410-持久化与数据同步)
5. [后端 API 规格](#5-后端-api-规格)
6. [MCP Server](#6-mcp-server)
7. [AI 模型集成](#7-ai-模型集成)
8. [UI/UX 设计规范](#8-uiux-设计规范)
9. [非功能性需求](#9-非功能性需求)
10. [当前状态与待完善项](#10-当前状态与待完善项)

---

## 1. 产品概述

### 1.1 产品定位

**ComicStudio AI** 是一个 AI 驱动的漫剧创作平台，用户通过输入剧本、上传素材，利用 AI 批量生成图片、视频等多媒体内容，完成漫剧/短视频作品的全流程创作。

### 1.2 核心价值

- 用户输入创意（剧本、角色描述、场景描述）→ AI 生成配套视觉素材 → 组装成完整漫剧作品
- 一站式工作区：剧本写作、角色设定、场景管理、分镜编排、AI 生成、素材管理集于一体
- 版本管理：每次 AI 生成都留存版本，可回溯对比

### 1.3 目标用户

- 漫画创作者 / 短视频创作者
- 内容生产团队（编剧、美术、导演）
- 个人创作者（独立完成从剧本到视频的全流程）

### 1.4 技术栈概览

| 层级 | 技术选型 |
|------|---------|
| 前端框架 | React 18 + TypeScript + Vite |
| 状态管理 | Zustand (双 Store 架构) |
| UI 样式 | Tailwind CSS + Material Design 3 色彩系统 |
| 画布引擎 | @xyflow/react (React Flow) |
| 布局系统 | react-resizable-panels v4 |
| 后端框架 | FastAPI (Python) |
| AI 模型 | Seedream 4.0 (图片)、Seedance 1.0/1.5 Pro (视频)、GLM5 (文本) |
| 持久化 | 后端 JSON 文件存储 + 前端 localStorage 双写 |
| MCP 协议 | FastMCP 3.x (Streamable HTTP) — 对接 LobsterAI 等外部 AI Agent |

---

## 2. 产品架构

### 2.1 前端架构

```
src/
├── App.tsx                              # 入口：ErrorBoundary + MainLayout → WorkspaceShell
├── index.css                            # 全局样式（Tailwind扩展 + 自定义组件类）
├── store/
│   ├── index.ts                         # Store 统一导出
│   ├── canvasStore.ts                   # 实体数据 Store（26个状态字段）
│   ├── workspaceStore.ts                # 布局/导航 Store（4个状态字段）
│   ├── types.ts                         # 核心数据类型
│   ├── workspaceTypes.ts                # 工作区类型
│   └── documentHelpers.ts               # 文档标签辅助函数
├── components/
│   ├── Canvas.tsx                        # React Flow 画布主组件
│   ├── AssetPickerModal.tsx              # 素材选择弹窗
│   ├── workspace/
│   │   ├── WorkspaceShell.tsx            # 工作区外壳（Ribbon + 侧边栏 + 主面板）
│   │   ├── WorkspaceTitleBar.tsx         # 工作区标题栏
│   │   ├── Ribbon.tsx                    # 左侧功能条（w-11，始终可见）
│   │   ├── FileTree.tsx                  # 文件树（平铺式 + 自定义文件夹 + 拖拽多选）
│   │   ├── FileTreeContextMenu.tsx       # 文件树右键菜单
│   │   ├── MoveToFolderModal.tsx         # "移动到文件夹"弹窗
│   │   ├── PaneContainer.tsx             # Pane容器（递归渲染 PaneNode 树）
│   │   ├── TabBar.tsx                    # 标签栏（支持分屏下拉菜单）
│   │   ├── SidePanel.tsx                 # 侧边栏面板容器
│   │   ├── AISidePanel.tsx               # AI 侧面板
│   │   ├── BookmarksPanel.tsx            # 书签面板
│   │   ├── SearchPanel.tsx               # 搜索面板
│   │   ├── DocumentRenderer.tsx          # 文档路由（8种 DocumentType → 对应 Pane）
│   │   ├── WelcomeTab.tsx                # 欢迎页（5功能卡片 + 最近打开）
│   │   └── panes/                        # 7 种 Pane 组件
│   │       ├── AIPane.tsx                # AI 生成面板（图片/视频/音频3模式）
│   │       ├── CanvasPane.tsx            # 画布面板（ReactFlowProvider + Canvas）
│   │       ├── ScriptPane.tsx            # 剧本编辑面板（标题+内容+字数统计）
│   │       ├── CharacterPane.tsx         # 角色编辑面板（头像+标签+描述）
│   │       ├── ScenePane.tsx             # 场景编辑面板（参考图+描述）
│   │       ├── StoryboardFramePane.tsx   # 分镜面板（左预览+右表单，版本切换）
│   │       └── MediaPane.tsx             # 素材详情面板（多类型预览）
│   ├── generate/
│   │   ├── constants.ts                  # 生成模式/参数常量定义
│   │   ├── ChatArea.tsx                  # 对话区域组件
│   │   ├── HistoryPanel.tsx              # 历史记录面板
│   │   └── ParamDropdown.tsx             # 参数下拉选择器
│   ├── editors/                          # 画布内编辑器覆盖层
│   │   ├── EditorOverlay.tsx             # 编辑器覆盖层容器
│   │   ├── ScriptEditor.tsx
│   │   ├── CharacterEditor.tsx
│   │   ├── SceneEditor.tsx
│   │   ├── StoryboardFrameEditor.tsx
│   │   └── MediaViewer.tsx
│   ├── nodes/                            # React Flow 自定义节点（9种）
│   │   ├── ScriptNode.tsx
│   │   ├── CharacterNode.tsx
│   │   ├── SceneNode.tsx
│   │   ├── StoryboardFrameNode.tsx
│   │   ├── MediaNode.tsx
│   │   ├── TextNode.tsx                  # 遗留节点
│   │   ├── ImageNode.tsx                 # 遗留节点
│   │   ├── VideoNode.tsx                 # 遗留节点
│   │   └── AudioNode.tsx                 # 遗留节点
│   ├── panels/                           # 画布附属面板
│   │   ├── CanvasBottomBar.tsx
│   │   ├── SelectionToolbar.tsx
│   │   └── StoryboardImportModal.tsx
│   └── assets/                           # 素材库视图
│       ├── AssetToolbar.tsx
│       └── AssetListView.tsx
├── services/
│   ├── imageGeneration.ts                # AI 生成 API 封装（runNode 统一入口）
│   ├── modelCapabilities.ts              # 模型参考图上限规则
│   ├── persistence.ts                    # 持久化 API（后端 + localStorage 双写）
│   ├── storyboardParser.ts               # 分镜导入解析
│   └── upload.ts                         # 通用文件上传
```

### 2.2 后端架构 (creative-forge)

```
creative-forge/creative-forge/
├── main.py                          # FastAPI 入口
├── mcp_server.py                    # MCP Server 入口（FastMCP，端口 3001）
├── install_mcp_to_lobsterai.py      # 一键注册 MCP 到 LobsterAI 桌面应用
├── config/
│   ├── model_registry.json          # 模型注册表（4个模型）
│   └── user_auth.json               # 用户认证配置
└── src/
    ├── controllers/
    │   ├── health_controller.py     # 健康检查
    │   ├── user_controller.py       # 用户认证
    │   ├── model_controller.py      # 模型查询
    │   ├── model_mgmt_controller.py # 模型管理
    │   ├── node_controller.py       # AI 执行节点
    │   ├── persistence_controller.py# 持久化 CRUD
    │   └── example_controller.py    # 示例
    ├── services/
    │   ├── model_service.py         # 模型业务逻辑
    │   └── node_service.py          # 节点执行编排
    ├── executors/
    │   ├── base_executor.py         # 执行器基类
    │   ├── sync_http_executor.py    # 同步HTTP（Seedream图片）
    │   ├── async_polling_executor.py# 异步轮询（Seedance视频）
    │   └── chat_completion_executor.py # 聊天补全（GLM5文本）
    ├── mcp/                         # MCP 工具层（10个工具，4个模块）
    │   ├── __init__.py
    │   ├── forge_client.py          # HTTP 客户端（认证 + API 封装）
    │   ├── tools_models.py          # 模型查询工具
    │   ├── tools_generation.py      # AI 生成工具（图片/视频/文本）
    │   ├── tools_assets.py          # 素材管理工具
    │   └── tools_canvas.py          # 画布文件管理工具
    ├── repositories/
    │   └── model_config_repository.py
    ├── entities/
    ├── schema/
    ├── exceptions/
    │   └── business_exception.py
    └── utils/
        ├── executor_factory.py      # 执行器工厂
        └── ...
```

### 2.3 双 Store 架构

| Store | 职责 | 关键状态 |
|-------|------|---------|
| **canvasStore** | 实体数据管理 | canvasFiles[], characters[], scenes[], assets[], chatMessages[], availableModels[], customFolders[], ak, editingProjectId, generateHistory[] 等共26个字段 |
| **workspaceStore** | 布局/导航管理 | paneLayout(PaneNode树), activePaneId, activeSidePanel, fileTreeExpandedFolders 共4个字段 |

两个 Store 协作流程：
1. 用户在 FileTree 点击文件 → workspaceStore 打开 Tab
2. Tab 关联 DocumentId → DocumentRenderer 根据类型渲染对应 Pane
3. Pane 组件从 canvasStore 读取/写入实体数据

---

## 3. 核心数据模型

### 3.1 画布文件 (CanvasFile)

画布文件是系统核心实体，支持 5 种项目类型：

```typescript
interface CanvasFile {
  id: string                    // 唯一标识
  name: string                  // 文件名
  projectType?: 'canvas' | 'script' | 'image' | 'video' | 'audio'
  folderId?: string             // 所属文件夹ID
  mediaState?: {                // 媒体版本管理（image/video/audio类型）
    versions: CanvasFileMediaVersion[]
    selectedVersionId: string | null
  }
  aiSession?: {                 // AI 对话会话
    messages: ChatMessage[]
  }
  snapshot: {                   // 画布快照（canvas类型）
    nodes: Node[]
    edges: Edge[]
    characters?: CharacterContext[]
    scenes?: SceneContext[]
  }
  thumbnailUrl: string          // 缩略图
  nodeCount: number
  edgeCount: number
  createdAt: number             // 创建时间戳
  updatedAt: number             // 更新时间戳
}
```

**5 种项目类型说明**：

| 类型 | 用途 | 打开方式 | 特有功能 |
|------|------|---------|---------|
| `canvas` | 节点画布 | CanvasPane | React Flow 节点图 |
| `script` | 剧本 | 单文件编辑器 + AI面板 | 纯文本编辑 |
| `image` | 图片项目 | 单文件编辑器 + AI面板 | 版本链管理 |
| `video` | 视频项目 | 单文件编辑器 + AI面板 | 版本链管理 |
| `audio` | 音频项目 | 单文件编辑器 + AI面板 | 版本链管理 |

### 3.2 对话消息 (ChatMessage)

```typescript
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  mode: GenerateMode               // 'script' | 'image' | 'video' | 'audio'
  content: string                   // 用户输入/AI文本回复
  resultUrl?: string                // AI 生成的媒体URL
  resultText?: string               // AI 生成的文本内容
  resultNodeIds?: string[]          // 结果关联的画布节点ID
  references?: ChatReference[]      // @引用的画布节点
  referenceImageUrls?: string[]     // 参考图URL列表
  referenceMode?: 'all' | 'first' | 'both'  // 视频参考模式
  referenceThumbLabels?: string[]   // 缩略图标签
  status: 'sending' | 'generating' | 'completed' | 'failed'
  errorMessage?: string             // 失败时的错误信息
  createdAt: number
}
```

### 3.3 画布节点类型

系统定义了 5 种业务节点 + 5 种遗留节点（待迁移）：

**当前节点类型（方案A）**：

| 节点类型 | 数据接口 | 核心字段 |
|---------|---------|---------|
| `scriptNode` | ScriptNodeData | title, content, synopsis, status |
| `characterNode` | CharacterNodeData | characterId, name, avatarUrl, tags[] |
| `sceneNode` | SceneNodeData | sceneId, name, thumbnailUrl, description |
| `storyboardFrameNode` | StoryboardFrameNodeData | index, dialogue, description, shot, versions[], characterIds[], sceneId |
| `mediaNode` | MediaNodeData | mediaType, url, textContent, name, prompt |

### 3.4 上下文实体

```typescript
// 角色上下文
interface CharacterContext {
  id: string
  name: string
  description: string
  referenceImageUrl: string
  tags: string[]
  createdAt: number
}

// 场景上下文
interface SceneContext {
  id: string
  name: string
  description: string
  referenceImageUrl: string
  createdAt: number
}
```

### 3.5 素材项 (AssetItem)

```typescript
interface AssetItem {
  id: string
  name: string
  url: string
  type: 'image' | 'video' | 'text' | 'audio'
  source: 'generate' | 'upload' | 'canvas'
  textContent?: string
  createdAt: number
}
```

### 3.6 模型信息 (ModelInfo)

```typescript
interface ModelInfo {
  id: string
  name: string
  ability: 'text2img' | 'text2video' | 'chat_completion'
  provider: string
  description: string
  weight: number
  costRate: number
}
```

---

## 4. 功能模块详述

### 4.1 工作区系统

#### 4.1.1 功能概述

采用 **Obsidian 式**多面板工作区，支持灵活的分屏布局。

#### 4.1.2 面板树结构

面板系统是一个**递归二叉树**：

- **PaneLeaf（叶子面板）**：包含多个 Tab 标签页，显示具体内容
- **PaneSplit（分割面板）**：将空间分为两个子面板，支持水平/垂直方向

```
PaneNode = PaneLeaf | PaneSplit

PaneSplit {
  direction: 'horizontal' | 'vertical'
  children: PaneNode[]  // 通常2个子节点
  sizes: number[]       // 各子面板占比
}

PaneLeaf {
  tabs: WorkspaceTab[]
  activeTabIndex: number
}
```

#### 4.1.3 分屏操作

| 操作 | 触发方式 | 行为 |
|------|---------|------|
| 水平分屏 | TabBar 下拉菜单 "向右拆分" | 当前 Pane 右侧新建 Pane，移动当前 Tab |
| 垂直分屏 | TabBar 下拉菜单 "向下拆分" | 当前 Pane 下方新建 Pane，移动当前 Tab |
| 关闭 Tab | 点击 Tab 上的 × | 移除 Tab，若 Pane 变空则自动折叠 |
| 拖拽调整 | 拖动分隔条 | 调整相邻 Pane 尺寸比例 |

**分屏自适应规则**：面板内的内容区域（如 AI 生成面板的图片预览区）采用弹性布局自适应面板大小，预览区最大高度不超过面板的 40%，确保多级分屏时聊天历史和输入框仍可正常使用。

#### 4.1.4 Tab 标签页

每个 Tab 关联一个 `DocumentId`：

```typescript
interface DocumentId {
  type: DocumentType  // 'canvas'|'script'|'character'|'scene'|'storyboardFrame'|'media'|'ai'|'welcome'
  id: string          // 关联的实体ID
}
```

- 支持通过文件树单击打开 Tab（替换当前 Tab 内容）
- 支持在已有 Tab 间切换
- 重复打开同一文档会激活已有 Tab 而非创建新 Tab
- 双击文件名进入重命名模式

#### 4.1.5 文档路由 (DocumentRenderer)

根据 `DocumentId.type` 渲染对应 Pane 组件：

| DocumentType | 渲染组件 | 说明 |
|-------------|---------|------|
| `canvas` | CanvasPane | 节点画布编辑器 |
| `script` | ScriptPane | 剧本文本编辑器 |
| `character` | CharacterPane | 角色详情编辑 |
| `scene` | ScenePane | 场景详情编辑 |
| `storyboardFrame` | StoryboardFramePane | 分镜帧编辑 |
| `media` | MediaPane | 素材查看 |
| `ai` | AIPane | AI 生成面板 |
| `welcome` | WelcomeTab | 欢迎页 |

---

### 4.2 文件管理系统

#### 4.2.1 文件树结构

采用**平铺式文件管理**，无固定分类文件夹。所有文件和用户创建的自定义文件夹直接显示在根级，通过文件图标区分类型：

| 文件类型 | 图标 | 图标颜色 |
|---------|------|---------|
| 剧本 (script) | FileText | 蓝色 #4A6CF7 |
| 图片 (image) | Image | 紫色 #EC4899 |
| 视频 (video) | Video | 橙色 #F97316 |
| 音频 (audio) | Music | 红色 #F87171 |
| 画布 (canvas) | LayoutDashboard | 紫色 #8B5CF6 |
| 未指定类型 | FileText | 灰色 |

顶部标题为"**我的项目**"，右侧有 **+** 按钮展开新建菜单。

空状态时显示"暂无文件"引导页面，提示用户点击 + 号新建。

#### 4.2.2 自定义文件夹

- 用户通过 + 号菜单或右键菜单创建**自定义文件夹**
- 文件夹支持**多级嵌套**（文件夹内可再建子文件夹）
- 文件可通过拖拽或"移动到文件夹"操作归入任意文件夹
- 空文件夹显示"空"灰色提示文字
- 文件夹展开/折叠状态在 workspaceStore 中持久化

#### 4.2.3 新建文件

通过顶部 + 号菜单或右键空白区域，可新建以下 5 种文件：

| 菜单项 | projectType | 打开方式 |
|--------|------------|---------|
| 新建故事脚本 | script | ScriptPane + AIPane |
| 新建分镜图片 | image | AIPane (图片模式) |
| 新建分镜视频 | video | AIPane (视频模式) |
| 新建音乐音效 | audio | AIPane (音频模式) |
| 新建自由画布 | canvas | CanvasPane |

右键文件夹时，同样弹出文件类型选择子菜单，文件将创建在该文件夹下。

#### 4.2.5 文件操作

| 操作 | 触发方式 | 行为 |
|------|---------|------|
| 新建文件 | + 号菜单 / 右键空白 / 右键文件夹 | 选择类型 → 创建 CanvasFile 并打开 |
| 重命名 | 右键 → 重命名 / 双击文件名 | 内联编辑，回车确认，ESC 取消 |
| 删除 | 右键 → 删除 | 删除文件/文件夹，关闭关联 Tab |
| 移动 | 拖拽到文件夹 / 右键 → 移动到文件夹 | 弹出 MoveToFolderModal 选择目标 |
| 多选 | Ctrl+点击切换 / Shift+点击范围选 | 支持批量删除、批量移动 |
| 新建文件夹 | + 号菜单 / 右键菜单 | 出现内联输入框，回车创建 |
| 在新标签组打开 | 右键 → 在新标签组中打开 | splitPane 水平分屏打开 |
| 拖拽归组 | 多选后拖拽到文件夹 | 批量移动所有选中文件 |
| 拖拽到根级 | 拖拽到文件树空白区域 | 文件/文件夹移出当前父级 |

#### 4.2.6 文件树项 ID 规则

文件树项 ID 采用前缀映射：

| projectType | 前缀 | DocumentType | 示例 |
|------------|------|-------------|------|
| canvas | `canvas_` | canvas | `canvas_abc123` |
| script | `script_` | script | `script_abc123` |
| image | `ai_` | ai | `ai_abc123` |
| video | `ai_` | ai | `ai_abc123` |
| audio | `ai_` | ai | `ai_abc123` |

---

### 4.3 AI 生成系统

#### 4.3.1 功能概述

AI 生成系统是产品核心，支持 4 种生成模式，通过对话式界面与用户交互。

#### 4.3.2 四种生成模式

##### 剧本生成 (script)

| 项目 | 说明 |
|------|------|
| 模型 | GLM5 (chat_completion) |
| 输入 | 自然语言描述需求 |
| 输出 | 文本内容 |
| 参考素材 | 支持 @引用画布节点 |
| 上下文 | 自动注入当前文件的角色、场景信息 |

##### 图片生成 (image)

| 项目 | 说明 |
|------|------|
| 模型 | Seedream 4.0 (text2img) |
| 输入 | 文本 prompt |
| 输出 | 图片 URL |
| 可调参数 | 比例（9种）、分辨率（2K/4K）、批量数（1~4） |
| 参考图 | 支持上传参考图（最多4~5张，取决于模型） |

**图片比例选项**：

| 标签 | 值 | 说明 |
|------|---|------|
| 智能 | auto | 模型自动判断 |
| 21:9 | 21:9 | 超宽屏 |
| 16:9 | 16:9 | 宽屏 |
| 3:2 | 3:2 | 标准横版 |
| 4:3 | 4:3 | 传统横版 |
| 1:1 | 1:1 | 方形 |
| 3:4 | 3:4 | 传统竖版 |
| 2:3 | 2:3 | 标准竖版 |
| 9:16 | 9:16 | 手机竖屏 |

**分辨率选项**：
- 高清 2K
- 超清 4K

##### 视频生成 (video)

| 项目 | 说明 |
|------|------|
| 模型 | Seedance 1.0 Pro / 1.5 Pro (text2video) |
| 输入 | 文本 prompt |
| 输出 | 视频 URL |
| 可调参数 | 时长（5s/10s）、比例（5种）、参考模式（3种） |
| 参考图 | 支持，上限取决于参考模式和模型 |

**视频参考模式**：

| 模式 | 标签 | 说明 | 参考图上限 |
|------|------|------|-----------|
| `all` | 全能参考 | 多张参考图综合引导 | Seedance: 5张, 其他: 3张 |
| `first` | 仅首帧 | 首帧参考图 | 1张 |
| `both` | 首帧+尾帧 | 控制起止画面 | 2张 |

**视频比例选项**：16:9、9:16、1:1、4:3、3:4

##### 音频生成 (audio)

| 项目 | 说明 |
|------|------|
| 模型 | 暂无对接模型 |
| 状态 | **UI 已实现，后端未对接** |
| 输入 | 文本 prompt |
| 输出 | 音频 URL (预留) |

#### 4.3.3 参考图系统

参考图支持两种来源：

1. **本地上传**：用户从设备选择图片文件，上传至后端 `/api/upload`
2. **画布节点引用**：通过 @mention 引用画布中已有的图片/视频节点

**参考图上限规则**：

| 生成类型 | 模型 | 上限 |
|---------|------|------|
| 图片 | Seedance 1.5 系列 | 5 张 |
| 图片 | 其他所有模型 | 4 张 |
| 视频 (all模式) | Seedance 系列 | 5 张 |
| 视频 (all模式) | 其他模型 | 3 张 |
| 视频 (first模式) | 所有 | 1 张 |
| 视频 (both模式) | 所有 | 2 张 |

#### 4.3.4 上下文感知生成

当通过单文件项目（如 `image` 类型的 CanvasFile）打开 AI 面板时：
- 自动设置对应的生成模式
- 生成结果自动添加到文件的**版本链** (mediaState.versions)
- 对话历史保存在文件的 **aiSession.messages** 中

#### 4.3.5 版本链管理

`image`/`video`/`audio` 类型项目支持版本链：

```typescript
interface CanvasFileMediaVersion {
  id: string
  url: string
  prompt: string
  createdAt: number
  model?: string              // 使用的模型名
}
```

- 每次 AI 生成成功后自动追加新版本
- 用户可切换查看不同版本 (`selectedVersionId`)
- 版本按时间倒序展示

#### 4.3.6 对话历史持久化

- 对话消息保存在 `CanvasFile.aiSession.messages` 中
- 随 CanvasFile 整体存储到后端
- 打开文件时恢复完整对话历史

---

### 4.4 画布编辑器

#### 4.4.1 功能概述

基于 React Flow 的节点图编辑器，用于组织和关联漫剧的各个元素。

#### 4.4.2 节点类型

| 节点类型 | 用途 | 拖入来源 |
|---------|------|---------|
| scriptNode | 剧本片段 | 文件树/手动创建 |
| characterNode | 角色卡 | 角色列表 |
| sceneNode | 场景卡 | 场景列表 |
| storyboardFrameNode | 分镜帧 | 分镜序列 |
| mediaNode | 素材（图片/视频/音频/文本） | 素材库/AI生成 |

#### 4.4.3 画布操作

- **缩放/平移**：鼠标滚轮缩放，拖拽平移
- **节点连线**：从端口拖出连线，建立关系
- **节点拖拽**：自由摆放节点位置
- **框选**：拖拽背景进行框选
- **快照保存**：节点和边信息保存在 `CanvasFile.snapshot`

---

### 4.5 剧本编辑器

#### 4.5.1 功能概述

纯文本编辑器 + AI 辅助写作。

#### 4.5.2 剧本数据

```typescript
interface ScriptNodeData {
  title: string       // 标题
  content: string     // 完整内容
  synopsis: string    // 摘要（自动截取前100字）
  status: GenerationStatus  // 'idle' | 'generating' | 'completed' | 'failed'
}
```

#### 4.5.3 编辑功能

- 标题编辑（输入框，修改时同步更新 synopsis）
- 内容编辑（大尺寸 textarea，min-h 400px）
- 底部字数统计

---

### 4.6 角色管理

#### 4.6.1 功能概述

创建和管理漫剧中的角色设定，角色信息可被 AI 生成引用。

#### 4.6.2 角色数据

```typescript
interface CharacterContext {
  id: string
  name: string              // 角色名
  description: string       // 角色描述/设定
  referenceImageUrl: string // 参考头像
  tags: string[]            // 标签（如：主角、反派）
  createdAt: number
}
```

#### 4.6.3 操作

- 新建角色：输入名称和描述
- 头像上传：112x112 圆角头像区域，hover 显示上传覆盖层
- 编辑角色：修改名称、描述、标签
- 标签管理：蓝色胶囊展示，支持添加/删除
- 双路径打开：支持通过画布节点 nodeId 或全局 characterId 打开
- 画布关联：在画布中创建 characterNode，自动关联 CharacterContext
- AI 引用：AI 生成时可 @角色名 注入角色描述作为上下文

---

### 4.7 场景管理

#### 4.7.1 功能概述

创建和管理漫剧中的场景设定。

#### 4.7.2 场景数据

```typescript
interface SceneContext {
  id: string
  name: string              // 场景名
  description: string       // 场景描述
  referenceImageUrl: string // 参考图
  createdAt: number
}
```

#### 4.7.3 操作

- 新建场景
- 参考图上传：16:9 宽高比区域，hover 显示上传覆盖层
- 编辑场景描述（环境、氛围、时间、天气等）
- 双路径打开：支持通过画布节点 nodeId 或全局 sceneId 打开
- 画布中创建 sceneNode 关联场景

---

### 4.8 分镜系统

#### 4.8.1 功能概述

将剧本拆解为具体的镜头帧，每帧可关联角色、场景并生成对应画面。

#### 4.8.2 分镜帧数据

```typescript
interface StoryboardFrameNodeData {
  index: number              // 帧序号
  dialogue: string           // 对白
  description: string        // 画面描述
  shot: string               // 镜头类型（如：近景、远景）
  characterIds: string[]     // 出场角色列表
  sceneId: string            // 所在场景
  versions: StoryboardVersion[]  // 生成版本
  selectedVersionId: string  // 当前选中版本
}

interface StoryboardVersion {
  id: string
  imageUrl: string
  prompt: string
  createdAt: number
}
```

#### 4.8.3 面板布局

分镜面板采用**左右双栏**布局：

- **左侧** — 图片预览区 + 版本缩略图列表
  - 4:3 宽高比大图预览（当前选中版本的画面）
  - 底部版本缩略图横向滚动，点击切换版本
- **右侧** (w-80) — 编辑表单
  - 镜头类型 (shot)：近景/远景/特写
  - 台词 (dialogue)：textarea
  - 画面描述 (description)：textarea
  - 关联角色：从全局 characters 列表多选（toggle，蓝色高亮）
  - 关联场景：从全局 scenes 列表单选 + "无场景"选项（绿色高亮）

#### 4.8.4 工作流

1. 用户填写画面描述和对白
2. 选择出场角色和所在场景
3. AI 根据描述 + 角色 + 场景信息生成画面
4. 可多次生成，自动维护版本列表
5. 用户选择最满意的版本作为最终画面

---

### 4.9 素材库

#### 4.9.1 功能概述

统一管理所有素材（AI 生成的、用户上传的、从画布导出的）。

#### 4.9.2 素材类型

| 类型 | 来源 | 展示方式 |
|------|------|---------|
| image | AI 生成 / 上传 | 缩略图网格 |
| video | AI 生成 / 上传 | 视频预览 |
| audio | AI 生成 / 上传 | 音频播放器 |
| text | AI 生成 | 文本预览 |

#### 4.9.3 素材操作

- 查看详情（MediaPane）
- 删除素材
- 素材来源标记：`generate`（AI生成）、`upload`（用户上传）、`canvas`（画布导出）

---

### 4.10 持久化与数据同步

#### 4.10.1 策略

采用**双写 + 智能合并**策略：

1. **前端 localStorage**：始终作为第一写入目标，保证离线可用
2. **后端 JSON 文件**：作为持久存储，保证数据持久性
3. **合并策略**：读取时使用 `mergeById` — remote 优先，保留 local 独有项

#### 4.10.2 数据流

```
写入: 前端操作 → localStorage → 异步写后端
读取: 请求后端 → 与 localStorage 合并 → 返回合并结果
后端不可用: 自动 fallback 到 localStorage
```

#### 4.10.3 存储项

| 数据 | localStorage Key | 后端 API | 后端存储文件 |
|------|-----------------|---------|-------------|
| 素材列表 | `poc_assets` | `/api/assets` | `data/assets.json` |
| 画布文件 | `poc_canvas_files` | `/api/canvas-files` | `data/canvas-files.json` |
| 对话历史 | `poc_generate_history` | `/api/generate-history` | `data/generate-history.json` |
| 上传文件 | - | `/api/upload` | `uploads/` 目录 |

---

## 5. 后端 API 规格

### 5.1 基础信息

- **Base URL**: `http://localhost:8000`
- **协议**: HTTP REST
- **认证**: Bearer Token（AK）
- **文档**: `http://localhost:8000/docs` (Swagger UI)

### 5.2 认证 API

#### POST /user/auth

用户认证，获取访问令牌和授权模型列表。

**请求体**：
```json
{ "userId": "testuser1" }
```

**响应体**：
```json
{
  "ak": "RWYhq1NsLPAMmieux0GC",
  "authedModels": {
    "MaaS_Seedream_4.0": ["text2img"],
    "MaaS_Seedance_1.0_pro": ["text2video"],
    "MaaS_Seedance_1.5_pro": ["text2video"],
    "GLM5": ["chat_completion"]
  }
}
```

### 5.3 模型 API

#### GET /model/list

查询可用模型列表。

**Header**: `Authorization: Bearer {ak}`

**Query Parameters**：
| 参数 | 类型 | 说明 |
|------|------|------|
| ability | string | 筛选能力：`text2img` / `text2video` / `chat_completion` |

**响应体**：
```json
{
  "models": [
    {
      "id": "model-uuid",
      "name": "MaaS_Seedream_4.0",
      "ability": "text2img",
      "provider": "volcengine",
      "description": "图片生成模型",
      "weight": 100,
      "costRate": 1.0
    }
  ],
  "total": 1
}
```

#### GET /modelmgmt/list

管理接口，获取所有模型配置（含禁用模型，仅从数据库读取，DB不可用返回503）。

**Query Parameters**：ability, enabled（可选过滤）

### 5.4 生成执行 API

#### GET /nodes

列出所有 Node（调试用）。

#### POST /nodes/run

核心 AI 生成接口，统一处理所有类型的生成请求。

**Header**: `Authorization: Bearer {ak}`

**请求体**：
```json
{
  "type": "image",                         // "text" | "image" | "video" | "audio"
  "prompt": "一个穿着红色斗篷的少女站在山顶",
  "model": "MaaS_Seedream_4.0",
  "name": "少女山顶图",                     // 可选，任务名
  "size": "16:9",                          // 可选，图片/视频比例
  "length": 5,                             // 可选，视频时长(秒)
  "watermark": false,                      // 可选，是否加水印
  "response_format": "url",               // 可选，"url" | "b64_json"
  "reference_image_urls": [],              // 可选，参考图URL列表
  "video_reference_mode": "all"            // 可选，"all" | "first" | "both"
}
```

**响应体**：
```json
{
  "status": "success",
  "outputs": {
    "content_url": "https://...",          // 生成内容URL
    "content_b64": null,                   // base64内容（备用）
    "text": null,                          // 文本内容（text类型时）
    "size": "1024x576"                     // 实际尺寸
  },
  "error": null
}
```

**失败响应**：
```json
{
  "status": "failed",
  "outputs": {},
  "error": "模型调用超时"
}
```

### 5.5 持久化 API

#### 素材 CRUD

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/assets` | 获取所有素材 |
| POST | `/api/assets` | 创建素材 |
| DELETE | `/api/assets/{asset_id}` | 删除素材 |

#### 画布文件 CRUD

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/canvas-files` | 获取所有画布文件 |
| POST | `/api/canvas-files` | 创建画布文件 |
| PUT | `/api/canvas-files/{file_id}` | 更新画布文件 |
| DELETE | `/api/canvas-files/{file_id}` | 删除画布文件 |

#### 生成历史

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/generate-history` | 获取对话历史 |
| PUT | `/api/generate-history` | 覆盖保存对话历史 |

#### 文件上传

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/upload` | 上传文件（multipart/form-data） |

上传响应：
```json
{
  "id": "a1b2c3d4e5f6.png",
  "name": "原始文件名.png",
  "url": "/uploads/a1b2c3d4e5f6.png",
  "type": "image",
  "size": 102400
}
```

### 5.6 系统 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/docs` | Swagger UI 文档 |
| GET | `/openapi.json` | OpenAPI Schema |

---

## 6. MCP Server

### 6.1 概述

Creative Forge 通过 **MCP (Model Context Protocol)** 将 AI 漫剧创作能力暴露给外部 AI Agent（如有道龙虾 LobsterAI），使用户可以在飞书等 IM 中通过自然语言指令调用图片/视频/文本生成。

**关键特性**：
- 基于 FastMCP 3.x 框架，使用 Streamable HTTP transport
- 共暴露 **10 个 MCP 工具**，分 4 个模块
- 生成图片/视频后自动在 web 端创建对应项目文件，结果在文件树中可见
- 提供一键注册脚本，写入 LobsterAI 的 SQLite 数据库和 mcp.config.json

### 6.2 架构

```
外部 AI Agent (LobsterAI)
    │
    │  MCP 协议 (Streamable HTTP)
    ▼
MCP Server (FastMCP, 端口 3001)
    │
    │  HTTP (httpx)
    ▼
Creative Forge 后端 (FastAPI, 端口 8000)
    │
    ▼
AI 模型 API (火山引擎 / 智谱)
```

### 6.3 MCP 工具列表

#### 模型查询 (tools_models)

| 工具 | 参数 | 说明 |
|------|------|------|
| `list_models` | `ability`（可选：text2img / text2video / chat_completion） | 查询可用 AI 模型列表 |

#### AI 生成 (tools_generation)

| 工具 | 参数 | 说明 |
|------|------|------|
| `generate_image` | `prompt`, `model`(默认 Seedream 4.0), `size`(1K/2K/4K) | 文生图，返回图片 URL + 自动创建 image 项目 |
| `generate_video` | `prompt`, `model`(默认 Seedance 1.5 Pro), `duration`(5/10/12秒) | 文生视频（1-5分钟异步），返回视频 URL + 自动创建 video 项目 |
| `generate_text` | `prompt`, `model`(默认 GLM5), `system_prompt`(可选) | 文本生成（剧本/对白/场景描述） |

#### 素材管理 (tools_assets)

| 工具 | 参数 | 说明 |
|------|------|------|
| `list_assets` | （无） | 列出所有已保存素材 |
| `create_asset` | `name`, `url`, `type`, `source`, `text_content` | 保存素材到库 |
| `delete_asset` | `asset_id` | 删除素材 |
| `upload_image` | `image_url` 或 `image_base64`, `filename` | 上传图片到服务器 |

#### 画布文件管理 (tools_canvas)

| 工具 | 参数 | 说明 |
|------|------|------|
| `list_canvas_files` | （无） | 列出所有画布项目文件 |
| `manage_canvas_file` | `action`(create/update/delete), `file_id`, `name`, `snapshot`, `project_type` | 创建/更新/删除画布项目 |

### 6.4 自动创建项目

通过 MCP 生成图片或视频后，系统自动调用 `create_project_for_media()` 创建对应的 CanvasFile 项目：
- `projectType` 设为 `image` 或 `video`
- `mediaState.versions` 记录生成结果 URL、prompt、模型
- `aiSession.messages` 记录对话历史
- 项目在 web 端文件树中可见（需刷新页面）

### 6.5 LobsterAI 集成

#### 注册方式

运行 `install_mcp_to_lobsterai.py` 一键注册：

```bash
# 安装
python install_mcp_to_lobsterai.py

# 卸载
python install_mcp_to_lobsterai.py --uninstall

# 自定义地址
python install_mcp_to_lobsterai.py --url http://localhost:3001/mcp
```

脚本同时写入两个位置（LobsterAI 两条 MCP 发现路径）：
1. **SQLite** (`%APPDATA%/LobsterAI/lobsterai.sqlite` → `mcp_servers` 表)
2. **JSON 配置** (`%APPDATA%/LobsterAI/SKILLs/mcp.config.json`)

#### 启动流程

```bash
# 1. 启动 Creative Forge 后端
cd 网页端/creative-forge/creative-forge
python main.py                  # 端口 8000

# 2. 启动 MCP Server
python mcp_server.py            # 端口 3001

# 3. 启动/重启 LobsterAI 桌面应用
```

### 6.6 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `CREATIVE_FORGE_BASE_URL` | `http://localhost:8000` | 后端地址 |
| `CREATIVE_FORGE_USER_ID` | `testuser1` | 自动认证用户 ID |
| `MCP_SERVER_PORT` | `3001` | MCP Server 端口 |

### 6.7 依赖

| 依赖 | 用途 |
|------|------|
| `fastmcp` >= 3.1 | MCP 协议框架 |
| `httpx` | 异步 HTTP 客户端 |
| `python-dotenv` | 环境变量加载 |
| `Pillow` | 图片压缩（可选，用于 compress_image） |

---

## 7. AI 模型集成

### 7.1 模型注册表

当前注册 4 个模型：

| 模型名 | 能力 | 执行器 | 提供商 |
|--------|------|--------|--------|
| MaaS_Seedream_4.0 | text2img | SyncHttpExecutor | 火山引擎 |
| MaaS_Seedance_1.0_pro | text2video | AsyncPollingExecutor | 火山引擎 |
| MaaS_Seedance_1.5_pro | text2video | AsyncPollingExecutor | 火山引擎 |
| GLM5 | chat_completion | ChatCompletionExecutor | 智谱 |

### 7.2 执行器类型

#### SyncHttpExecutor（同步 HTTP）

- 用于：Seedream 图片生成
- 模式：发送 POST 请求 → 等待响应 → 从 `data[0]` 取 `url`/`b64_json`/`size`
- 超时：120 秒

#### AsyncPollingExecutor（异步轮询）

- 用于：Seedance 视频生成
- 模式：POST 创建任务 → 轮询 GET `/{task_id}` → 取 `content.video_url`
- 轮询间隔：5 秒
- 最大超时：300 秒（5 分钟）
- 状态流转：submitted → running → succeeded / failed

#### ChatCompletionExecutor（聊天补全）

- 用于：GLM5 文本生成
- 模式：流式 SSE 响应
- 支持上下文对话

### 7.3 执行器工厂

通过 `get_executor(model_name)` 自动匹配执行器：
- 根据 `model_registry.json` 中模型的 `executor_class_name` 字段
- 通过 `_EXECUTOR_CLASS_MAP` 字典映射到 Python 类
- 自动注入模型对应的 `endpoint_url` 和 `api_key`

> 注：还存在 2 个遗留的专用执行器（SeedreamExecutor、SeedanceExecutor），已标记为 deprecated，当前使用通用执行器替代。

---

## 8. UI/UX 设计规范

### 8.1 整体布局

```
┌───────────────────────────────────────────────┐
│ flex-col h-screen                             │
│ ┌─────────────────────────────────────────────┤
│ │ flex (水平)                                 │
│ │┌──┬────────┬─┬─────────────────────────────┐│
│ ││  │ Side   │ │                             ││
│ ││R │ Panel  │S│     主面板区域               ││
│ ││i │ (File  │e│  ┌─────────┬───────────┐    ││
│ ││b │  Tree) │p│  │  Pane A  │  Pane B   │    ││
│ ││b │ 可拖拽  │ │  │ (TabBar) │ (TabBar)  │    ││
│ ││o │ 宽度   │ │  │ (内容)   │ (内容)    │    ││
│ ││n │ 160-   │ │  └─────────┴───────────┘    ││
│ ││  │ 400px  │ │                             ││
│ │└──┴────────┴─┴─────────────────────────────┘│
│ └─────────────────────────────────────────────┘
└───────────────────────────────────────────────┘
```

- **Ribbon**：左侧竖条 (w-11 = 44px)，始终可见，包含 Menu 按钮（切换侧边栏）和 FolderOpen 按钮
- **SidePanel**：通过 `react-resizable-panels` 可拖拽调整宽度（默认 220px，最小 160px，最大 400px）
- **Separator**：1px 分隔线
- **主面板**：PaneContainer 递归渲染 PaneNode 树
- 无传统顶栏，侧边栏可通过 Ribbon 按钮折叠/展开

### 8.2 色彩系统

通过 **Tailwind Config** `theme.extend.colors` 定义，以 CSS class 形式使用（如 `text-ds-on-surface`、`bg-apple-bg-secondary`），非原生 CSS 变量。

**三套并存的色彩体系**：

#### Brand 品牌色

| Token | 值 | 用途 |
|-------|---|------|
| `brand` | `#1D51DF` | 品牌主色 |
| `brand-light` | `#4670FE` | 品牌亮色 |
| `brand-dark` | `#0043D1` | 品牌暗色 |
| `brand-50` | `#EEF2FE` | 品牌极浅 |

#### DS (Material Design 3 风格)

| Token | 值 | 用途 |
|-------|---|------|
| `ds-surface` | `#FCF8FB` | 主背景 |
| `ds-surface-container` | `#F0EDF1` | 容器背景 |
| `ds-surface-container-high` | `#EAE7EC` | 高层容器 |
| `ds-surface-container-lowest` | `#FFFFFF` | 最低容器（白色） |
| `ds-on-surface` | `#333236` | 主文字色 |
| `ds-on-surface-variant` | `#605E63` | 次要文字色 |
| `ds-primary` | `#1D51DF` | 主色调 |
| `ds-on-primary` | `#FAF8FF` | 主色上文字 |
| `ds-outline` | `#7C7A7F` | 轮廓色 |
| `ds-outline-variant` | `#B3B1B7` | 轮廓变体 |

#### Apple (Apple HIG 语义色)

| Token | 值 | 用途 |
|-------|---|------|
| `apple-text` | `#333236` | 主文字 |
| `apple-text-secondary` | `#605E63` | 次要文字 |
| `apple-text-tertiary` | `#7C7A7F` | 三级文字 |
| `apple-border` | `#B3B1B7` | 边框 |
| `apple-border-light` | `rgba(179,177,183,0.2)` | 浅边框 |
| `apple-bg` | `#FCF8FB` | 主背景 |
| `apple-bg-secondary` | `#F6F2F6` | 次级背景 |

#### 自定义圆角和阴影

| Token | 值 |
|-------|---|
| `rounded-ds` | 8px |
| `rounded-ds-lg` | 12px |
| `shadow-ambient` | 品牌色微光阴影 |
| `shadow-capsule` | 胶囊卡片阴影 |

### 8.3 组件规范

| 组件 | 样式特征 |
|------|---------|
| Ribbon 竖条 | w-11 (44px)，始终可见，图标按钮 |
| 侧边栏 | 可拖拽宽度 (160-400px)，白色背景 |
| 文件树 | 缩进层级，图标+文字，hover高亮，缩进线 |
| TabBar | 底部无边框指示器，active态高亮 |
| 面板分隔条 | 3px 宽/高，hover 变色 (`bg-brand/20`) |
| AI 对话界面 | 类 ChatGPT 气泡式布局 |
| 参数面板 | 底部固定区域，tag 选择器 |
| 欢迎页 | 渐变背景，5功能卡片 grid，最近打开列表 |
| 按钮 | `btn-primary-atelier` 石版印刷渐变 (135deg, #1D51DF → #4670FE) |
| 输入框 | `input-atelier` 统一样式 |
| 卡片 | `card-atelier` 悬浮动效 |

### 8.4 自定义 CSS 类（index.css）

| 类名前缀 | 用途 |
|---------|------|
| `.ribbon-*` | Ribbon 竖条按钮样式 |
| `.side-panel-*` | 侧面板容器 + 毛玻璃头部 |
| `.filetree-*` | 文件树所有样式 (folder-row, file-row, chevron, indent-line 等) |
| `.search-*` | 搜索面板样式 |
| `.card-atelier` | Digital Atelier 风格卡片悬浮动效 |
| `.glass-nav` | 毛玻璃导航 (blur 20px) |
| `.fade-in-up` / `.stagger-*` | 渐入上浮动画 + 交错延时 |
| `.canvas-editor-mode` | 画布深色主题覆盖 |

### 8.5 图标库

使用 **lucide-react** 图标库。

关键图标映射：
- 文件夹：`FolderOpen` / `FolderClosed`
- 画布：`LayoutDashboard`
- 剧本：`FileText`
- 图片：`Image`
- 视频：`Video`
- 音频：`Music`
- 分屏：`Columns` / `Rows`
- AI：`Sparkles`

---

## 9. 非功能性需求

### 9.1 性能

| 指标 | 要求 |
|------|------|
| 首屏加载 | < 3s (Vite HMR 开发环境) |
| 画布节点数 | 支持 100+ 节点流畅操作 |
| AI 生成响应 | 图片 < 30s，视频 < 300s |
| 文件保存 | 自动保存 + 防抖，无需手动 |

### 9.2 兼容性

| 项目 | 要求 |
|------|------|
| 浏览器 | Chrome 90+, Edge 90+, Firefox 90+ |
| 分辨率 | 最低 1280x720，推荐 1920x1080 |
| 操作系统 | Windows / macOS / Linux |

### 8.3 安全

| 项目 | 当前状态 | 目标 |
|------|---------|------|
| 认证 | 简单 userId + AK | 需升级为 OAuth/JWT |
| API 防护 | CORS allow all | 需限制为前端域名 |
| 文件上传 | 无类型/大小校验 | 需添加白名单校验 |
| 数据存储 | JSON 文件 | 需升级为数据库 |

### 8.4 可观测性

| 项目 | 当前状态 |
|------|---------|
| 日志 | 仅 console.log / Python print |
| 监控 | 无 |
| 错误追踪 | 前端 ErrorBoundary |

---

## 10. 当前状态与待完善项

### 10.1 已实现功能状态

| 功能 | 状态 | 备注 |
|------|------|------|
| 工作区布局（分屏/Tab） | ✅ 已实现 | react-resizable-panels v4 |
| 文件树（平铺+自定义文件夹） | ✅ 已实现 | 拖拽+多选+右键菜单+移动弹窗 |
| AI 剧本生成 | ✅ 已实现 | GLM5 对接完成 |
| AI 图片生成 | ✅ 已实现 | Seedream 4.0 对接完成 |
| AI 视频生成 | ✅ 已实现 | Seedance 1.0/1.5 Pro 对接完成 |
| AI 音频生成 | ⚠️ UI已实现 | **后端未对接模型** |
| 参考图上传 | ✅ 已实现 | 文件上传 + 画布引用 |
| 版本链管理 | ✅ 已实现 | image/video/audio 项目 |
| 画布编辑器 | ✅ 已实现 | React Flow，5种节点 |
| 角色管理 | ✅ 已实现 | CRUD + 画布关联 |
| 场景管理 | ✅ 已实现 | CRUD + 画布关联 |
| 分镜系统 | ✅ 已实现 | 版本管理 |
| 素材库 | ✅ 已实现 | 分类展示 |
| 数据持久化 | ✅ 已实现 | 后端JSON + localStorage双写 |
| 用户认证 | ⚠️ 基础 | 仅简单AK认证 |
| 协同编辑 | ❌ 未实现 | - |
| 导出/发布 | ❌ 未实现 | - |

### 10.2 技术债务

| 项目 | 说明 | 优先级 |
|------|------|--------|
| 节点类型迁移 | 5种旧节点类型待迁移至新类型 | 中 |
| 数据库接入 | JSON 文件存储替换为数据库 | 高 |
| 认证升级 | AK 认证替换为 JWT/OAuth | 高 |
| 异步任务优化 | 轮询改为 WebSocket 推送 | 中 |
| 音频模型对接 | 对接 TTS/音乐生成模型 | 中 |
| 错误处理完善 | 统一错误处理和用户提示 | 中 |
| 性能优化 | 大画布虚拟化、图片懒加载 | 低 |

### 10.3 后续规划方向

| 方向 | 说明 |
|------|------|
| 多用户协作 | 实时协同编辑，权限管理 |
| 导出功能 | 导出为视频/PDF/图片序列 |
| 模板系统 | 预设漫剧模板，一键套用 |
| 批量生成 | 分镜批量生成所有画面 |
| 云端部署 | Docker 容器化，对象存储 |
| 移动端适配 | 响应式布局 / PWA |

---

## 附录

### A. 项目启动方式

**前端**：
```bash
cd 网页端
npm install
npm run dev
# 访问 http://localhost:5173
```

**后端 (creative-forge)**：
```bash
cd 网页端/creative-forge/creative-forge
pip install -r requirements.txt
# 配置 .env 文件（API Keys）
python main.py
# 访问 http://localhost:8000/docs
```

### B. 环境变量

后端需要配置 `.env` 文件，包含各 AI 服务的 API Key（具体字段参考 `config/model_registry.json` 中各模型的 `api_key_env` 配置）。

### C. 开发约定

| 约定 | 说明 |
|------|------|
| 前端命名 | camelCase（变量/函数），PascalCase（组件） |
| 后端命名 | snake_case（Python），camelCase（API JSON） |
| API 前缀 | 所有业务接口以 `/api/` 开头 |
| 分层架构 | Controller → Service → Repository → Entity |
| 状态管理 | canvasStore（数据）+ workspaceStore（布局），禁止混用 |
