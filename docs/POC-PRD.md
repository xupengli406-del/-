# 漫剧创作平台 POC v0.0.0.2 — 产品需求文档

> 版本：v0.0.0.2 POC
> 更新日期：2026-03-11
> 状态：开发中

---

## 一、产品概述

### 1.1 产品定位
漫剧创作平台是一个基于 AI 的多模态内容创作工具，以**无限画布**为核心，让创作者通过节点化的方式组合文本、图片、视频、音频等多种内容，利用 AI 模型自动生成素材，最终产出完整的漫剧作品。

### 1.2 POC 目标
快速验证核心技术可行性，完成内部演示：
- 主页面导航（画布项目管理 + 资产库浏览）
- 基础画布 + 多类型节点 + 依赖连线
- 多模态内容生成（图像/文本/视频/音频）
- 素材导入与管理
- 项目文件保存/加载

### 1.3 技术栈

| 层级 | 技术选型 |
|------|---------|
| 前端框架 | React 18 + TypeScript |
| 画布引擎 | React Flow (@xyflow/react v12) |
| 状态管理 | Zustand v5 |
| UI 样式 | TailwindCSS v3.3 |
| 图标库 | Lucide React |
| 构建工具 | Vite 5 |
| 后端框架 | Python FastAPI |
| 后端运行 | Uvicorn |

---

## 二、应用导航与页面架构

### 2.1 双模式架构

应用采用**双模式**设计，无需路由库，通过 Zustand 状态 + URL 参数实现视图切换：

| 模式 | 触发方式 | 说明 |
|------|---------|------|
| **仪表板模式** | 默认进入 | 左侧导航栏 + 右侧主视图（项目管理或资产浏览） |
| **画布编辑模式** | 点击项目卡片（新标签页） / URL 带 `?mode=canvas` | 全屏 ReactFlow 画布编辑器 |

### 2.2 仪表板模式布局

```
┌──────┬─────────────────────────────────────────────────┐
│      │                                                 │
│ 画布 │            右侧主视图                              │
│      │     （CanvasProjectsView 或 AssetsView）           │
│ 资产 │                                                 │
│      │                                                 │
│60px  │                                                 │
└──────┴─────────────────────────────────────────────────┘
```

**左侧导航栏**（60px 宽，背景色 `#0d0d1f`）：
- **画布**按钮（LayoutGrid 图标）→ 显示画布项目列表视图
- **资产**按钮（FolderOpen 图标）→ 显示资产管理视图
- 选中态：紫色高亮（`bg-violet-600/15 text-violet-400`）
- 未选中态：灰色（`text-gray-600`），悬停变亮

### 2.3 画布编辑模式布局

```
┌─────────────────────────────────────────────────────────┐
│ [← 返回]            TopBar 顶部栏                         │
├─────────────────────────────────────────────────────────┤
│ ┌──┐                                                    │
│ │上│                                                    │
│ │传│         ReactFlow 无限画布                           │
│ │  │         + 右键菜单 / 双击菜单                        │
│ │导│         + 空画布欢迎引导                              │
│ │入│                                                    │
│ └──┘                            ┌───────────────────┐   │
│                                 │ 底部工具栏          │   │
│                                 │ 小地图|缩放|适应|重置│   │
│                                 └───────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

- 左上角浮动"返回"按钮（新标签页打开时点击关闭标签页，否则返回仪表板）
- 左侧竖排操作栏（CanvasLeftBar）：本地上传 + 导入素材
- 画布区域：ReactFlow 画布 + 背景网格点
- 右下角浮动底部工具栏

---

## 三、仪表板视图

### 3.1 画布项目列表（CanvasProjectsView）

**入口**：仪表板模式 → 左侧导航点击"画布"

**UI 结构**：
- 标题："最近项目"
- 2 列网格卡片布局（最大宽度 4xl）
- 第一张卡片固定为"新建项目"（`+` 号居中）
- 后续卡片展示已保存的画布文件

**项目卡片内容**：
- 缩略图区域（4:3 比例）：有图显示图片，无图显示 LayoutGrid 占位 icon
- 项目名称
- 修改时间（相对时间格式："刚刚修改" / "X分钟前修改" / "X小时前修改" / "X天前修改"）

**用户交互**：

| 操作 | 行为 |
|------|------|
| 点击"新建项目"卡片 | **新标签页**打开空白画布（URL: `?mode=canvas`） |
| 点击已有项目卡片 | **新标签页**打开该项目（URL: `?mode=canvas&project=<id>`） |

### 3.2 资产管理视图（AssetsView）

**入口**：仪表板模式 → 左侧导航点击"资产"

**UI 结构**：

1. **主标签栏**（5 个标签）：

| 标签 | 图标 | 显示内容 |
|------|------|---------|
| 画布 | LayoutGrid | 已保存的画布文件卡片网格 |
| 文本 | Type | 文本类型素材卡片网格 |
| 图片 | ImageIcon | 图片类型素材卡片网格 |
| 视频 | Video | 视频类型素材卡片网格 |
| 音频 | Music | 音频类型素材卡片网格 |

2. **子标签栏**（非画布标签时显示，圆角胶囊风格）：

| 素材类型 | 子标签 |
|---------|-------|
| 图片 | 所有图片 · 超清 · 收藏 |
| 视频 | 所有视频 · 收藏 |
| 文本 | 所有文本 · 剧本/脚本 · 收藏 |
| 音频 | 所有音频 · 收藏 |

3. **内容区**：
- 卡片网格布局（3-5 列响应式）
- 正方形宽高比卡片，圆角 `rounded-xl`
- 有媒体 URL 的素材显示缩略图
- 无媒体的素材显示类型图标 + 名称
- 悬停显示删除按钮（右上角）
- 空状态：居中显示类型图标 + "暂无XX素材" + "上传或生成素材后将在此显示"

---

## 四、画布编辑器

### 4.1 画布左侧操作栏（CanvasLeftBar）

**位置**：画布区域左侧，绝对定位，52px 宽

**按钮列表（从上到下）**：

| 按钮 | 图标 | 功能 |
|------|------|------|
| 本地上传 | Upload | 打开系统文件选择器，支持上传图片、视频、音频、文本文件（.txt/.md/.doc/.docx/.csv） |
| 导入素材 | FolderInput | 点击展开导入菜单 |

**导入菜单**（从"导入素材"按钮右侧弹出）：

| 菜单项 | 图标 | 颜色 | 功能 |
|--------|------|------|------|
| 导入文本 | Type | 蓝色 | 打开文本素材选取弹窗 |
| 导入图片 | ImageIcon | 绿色 | 打开图片素材选取弹窗 |
| 导入视频 | Video | 玫红色 | 打开视频素材选取弹窗 |

**交互细节**：
- 点击"导入素材"按钮时，按钮高亮为紫色态
- 菜单外点击关闭菜单
- 每个按钮悬停时右侧显示文字 tooltip

### 4.2 资产选取弹窗（AssetPickerModal）

**触发方式**：画布左侧操作栏 → 导入素材 → 选择类型

**弹窗样式**：
- 全屏居中弹窗，宽 900px，最大高度 80vh
- 半透明黑色遮罩（`bg-black/60 backdrop-blur-sm`）
- 深色背景（`bg-[#1a1a2e]`），圆角 `rounded-2xl`

**UI 结构**：

```
┌────────────────────────────────────────────┐
│  资产选取                              [✕]  │
│                                            │
│  [所有图片]  [超清]  [收藏]                  │
│                                            │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│  │    │ │    │ │    │ │    │ │    │       │
│  │ ✓  │ │    │ │    │ │    │ │    │       │
│  └────┘ └────┘ └────┘ └────┘ └────┘       │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│  │    │ │    │ │    │ │    │ │    │       │
│  └────┘ └────┘ └────┘ └────┘ └────┘       │
│                                            │
│  已选 2 张图片                      [确认]   │
└────────────────────────────────────────────┘
```

**各类型子标签配置**：

| 素材类型 | 子标签 | 计数单位 |
|---------|-------|---------|
| 图片 | 所有图片 / 超清 / 收藏 | 张图片 |
| 视频 | 所有视频 / 收藏 | 个视频 |
| 文本 | 所有文本 / 剧本/脚本 / 收藏 | 个文本 |

**用户交互**：

| 操作 | 行为 |
|------|------|
| 点击素材卡片 | 切换选中状态（紫色边框 + 勾选图标） |
| 点击"确认" | 将选中素材导入当前画布资产库，关闭弹窗 |
| 点击遮罩或 ✕ 按钮 | 取消选择，关闭弹窗 |
| 切换子标签 | 按条件过滤显示素材 |

**与资产管理视图的关系**：弹窗的卡片网格布局、子标签栏样式与仪表板的 AssetsView 保持一致。

### 4.3 顶部栏（TopBar）

**高度**：48px，背景 `#0d0d1f`

**内容**：
- 左侧：六边形 Logo + "漫剧创作平台" 品牌文字 + "POC v0.0.0.1" 版本标签
- 右侧："导出" 按钮 → 下载画布 JSON 文件（包含所有节点、连线、视口状态）

### 4.4 底部工具栏（CanvasBottomBar）

**位置**：画布区域右下角浮动，圆角胶囊形

**按钮列表（从左到右）**：

| 按钮 | 图标 | 功能 |
|------|------|------|
| 小地图 | MapPin | 切换显示/隐藏小地图预览窗口 |
| 网格 | LayoutGrid | 网格显示切换（预留） |
| 适应画布 | Maximize | 自动缩放使所有节点适应当前视口 |
| 缩放滑块 | 滑动条 | 0.1x ~ 4x 缩放范围 |
| 重置 | 文字按钮 | 重置画布视图到初始位置和 1x 缩放 |
| 帮助 | HelpCircle | 帮助信息（预留） |

**小地图面板**：
- 点击小地图按钮后在底部工具栏上方弹出
- 节点按类型着色（文本蓝/图片绿/视频玫红/音频青）
- 底部有"关闭小地图"按钮

### 4.5 右键/双击菜单（ContextMenu）

**触发方式**：
- 右键点击画布空白处
- 双击画布空白处

**菜单项**（4种节点类型）：

| 选项 | 快捷键标识 | 图标颜色 |
|------|----------|---------|
| 文本节点 | T | 蓝色 |
| 图片节点 | I | 绿色 |
| 视频节点 | V | 玫红色 |
| 音频节点 | A | 青色 |

点击后在画布对应位置创建该类型节点。

### 4.6 空画布欢迎引导

当画布上没有任何节点时，居中显示引导面板：
- 六边形渐变 Logo
- 标题："开始创作你的漫剧"
- 说明："双击画布创建节点 · 右键打开菜单 · 拖拽素材到画布 · 从节点+号扩展连线"
- 2×3 网格展示 5 种元素（文本节点/图片节点/视频节点/音频节点/依赖连线）

---

## 五、画布交互行为

### 5.1 画布操作

| 用户操作 | 行为描述 |
|---------|---------|
| 鼠标左键单击画布空白处 | 取消当前选中节点，关闭右键菜单 |
| 鼠标左键拖拽画布空白处 | 框选节点（Partial 模式：部分重叠即选中） |
| 鼠标中键拖拽 | 平移画布 |
| 鼠标滚轮滚动 | 平移画布（上下方向，非缩放） |
| 鼠标左键双击画布空白处 | 弹出节点类型选择菜单 |
| 鼠标右键点击画布空白处 | 弹出右键上下文菜单 |
| 鼠标左键点击节点 | 选中节点，显示左右扩展按钮 |
| 鼠标左键拖拽节点 | 移动节点位置（16px 网格吸附） |
| Delete / Backspace | 删除选中节点或连线 |
| 拖拽素材到画布 | 在放置位置创建对应类型节点 |

### 5.2 节点操作

| 操作 | 描述 |
|------|------|
| 创建节点 | 双击/右键菜单/工具栏/拖拽素材/扩展按钮 |
| 选中节点 | 左键单击 → 显示左右两侧 "+" 扩展按钮 |
| 扩展节点 | 点击 "+" 按钮 → 选择类型 → 在该侧创建新节点并自动建立连线 |
| 移动节点 | 拖拽，支持 16px 网格吸附 |
| 调整大小 | 右下角拖拽手柄 |
| 删除节点 | Delete 键 / 节点内删除按钮 → 同时删除关联连线和素材 |

### 5.3 连线操作

| 操作 | 描述 |
|------|------|
| 手动连线 | 从节点 Handle（左右两侧 source/target 端）拖拽到另一节点 Handle |
| 自动连线 | 通过 "+" 扩展按钮创建新节点时自动建立连线 |
| 删除连线 | 选中连线后点击中间的红色删除按钮 / Delete 键 |

**连线样式**：
- 类型：贝塞尔曲线（Bezier）
- 颜色：紫色 `#8b5cf6`，选中时浅紫色 `#a78bfa`
- 线宽：2px，选中时 3px
- 虚线：`strokeDasharray: 6 3`
- 箭头：连线末端紫色闭合箭头（ArrowClosed）
- 动画：`animated: true`
- 选中态：发光效果（drop-shadow）+ 中间删除按钮

---

## 六、节点详细设计

### 6.1 节点类型总览

| 节点类型 | 组件 | 标识色 | 默认宽度 | Handle 颜色 |
|---------|------|-------|---------|------------|
| 文本节点 | TextNode | 蓝色/紫色 `#3b82f6` | 400px | 紫色 |
| 图片节点 | ImageNode | 绿色 `#10b981` | 420px | 绿色 |
| 视频节点 | VideoNode | 玫红色 `#f43f5e` | 320px | 玫红色 |
| 音频节点 | AudioNode | 青色 `#06b6d4` | 280px | 青色 |

所有节点均使用 `React.memo()` 优化渲染性能。每个节点有 4 个连接 Handle（left-target, left-source, right-target, right-source）。

### 6.2 文本节点（TextNode）

**UI 结构（自上而下）**：

1. **富文本工具栏**（顶部）
   - 拖拽手柄（GripVertical）
   - 标题按钮组：H1 / H2 / H3（互斥切换）
   - 段落按钮：P
   - 分隔线
   - 格式按钮：**B**（加粗）、*I*（斜体）
   - 列表按钮：无序列表、有序列表
   - 分隔线
   - 工具按钮：水平分割线、复制、全屏编辑
   - 删除按钮

2. **类型标签**："≡ Text"

3. **文本编辑区**
   - textarea 编辑区域
   - placeholder: "Tap into your words..."
   - 字体大小动态变化：H1=24px, H2=20px, H3=16px

4. **AI 生成输入区**（底部）
   - Prompt 输入框："Describe anything you want to generate"
   - 模型选择器下拉
   - 生成数量 "1x"
   - 发送按钮

**预置模型（文本生成）**：

| 模型 ID | 显示名称 | 预估耗时 |
|---------|---------|---------|
| gemini-3.1-pro | Gemini 3.1 Pro | 10 ~ 20s |
| gemini-3.1-flash-lite | Gemini 3.1 Flash Lite | 5 ~ 10s |
| gemini-3-flash | Gemini 3 Flash | 10 ~ 20s |
| gemini-2.5-flash | Gemini 2.5 Flash | 5 ~ 10s |
| gemini-2.5-pro | Gemini 2.5 Pro | 20s |

### 6.3 图片节点（ImageNode）

**UI 结构（自上而下）**：

1. **头部**：拖拽手柄 + Upload 按钮（居中胶囊形）+ 删除按钮

2. **类型标签**："⊘ Image"

3. **图片预览区**（4:3 比例）
   - 空状态：灰色虚线边框 + 图片 icon
   - 已有图片：object-cover 填充
   - 生成中：loading spinner + "生成中..."
   - 错误：红色提示条 + 重试按钮
   - 左右两侧 "+" 扩展按钮

4. **Prompt 输入区**
   - 参考图按钮
   - Prompt 文本框
   - 底部工具行：模型选择器 | 宽高比+画质 | 设置 | 生成数量 | 积分 | 发送

**宽高比 + 画质设置面板**（浮动弹出）：
- **画质**：Auto / High Quality / Standard（三选一）
- **宽高比**：1:1 / 16:9 / 9:16 / 4:3 / 3:4 / 2:3 / 3:2 / 7:4 / 4:7

**预置模型（图片生成）**：

| 模型 ID | 显示名称 | 预估耗时 | 备注 |
|---------|---------|---------|------|
| banana-2 | Banana 2 | 1min | NEW |
| banana-pro | Banana Pro | 1min | |
| banana | Banana | 1min | |
| seedream-5-lite | Seedream 5.0 Lite | 1min | |
| tapnow-flash | TapNow Flash | 15s | |
| grok2-image | Grok2 Image | 1min | |
| seedream-4 | Seedream 4.0 | 1min | |
| seedream-4.5 | Seedream 4.5 | 1min | |
| mj-niji7 | MJ Niji7 | 1min | 默认 |

### 6.4 视频节点（VideoNode）

**UI 结构**：
1. 头部：拖拽手柄 + Video 图标 + 可编辑名称输入框 + 删除按钮
2. 视频预览区（16:9）：HTML5 `<video>` 播放器 / 占位符 / loading
3. 错误提示
4. Prompt 文本框
5. AI 生成按钮（渐变玫红色，全宽）

**交互**：输入 Prompt → 点击生成 → 调用后端 API → 视频回填播放器

### 6.5 音频节点（AudioNode）

**UI 结构**：
1. 头部：拖拽手柄 + Music 图标 + 可编辑名称输入框 + 删除按钮
2. 音频预览区：HTML5 `<audio>` 播放器 / 占位符 / loading
3. 错误提示
4. Prompt 文本框
5. AI 生成按钮（渐变青色，全宽）

**交互**：输入 Prompt → 点击生成 → 调用后端 API → 音频回填播放器

### 6.6 节点扩展按钮（ExpandButton）

- 选中节点时在左右两侧显示紫色 "+" 圆形按钮
- 点击后弹出下拉菜单，可选 4 种节点类型
- 选择后在该侧创建新节点 + 自动建立依赖连线

---

## 七、状态管理

### 7.1 Store 架构（单一 Zustand Store）

所有应用状态集中在 `canvasStore` 中管理：

```typescript
interface CanvasStore {
  // ===== 导航状态 =====
  activeView: 'canvas' | 'assets'         // 仪表板当前视图
  editingProjectId: string | null          // 正在编辑的项目 ID（null = 仪表板模式）
  setActiveView(view): void
  setEditingProjectId(id): void

  // ===== 画布状态（React Flow） =====
  nodes: Node[]                            // 画布节点
  edges: Edge[]                            // 画布连线
  onNodesChange: OnNodesChange             // React Flow 节点变更处理
  onEdgesChange: OnEdgesChange             // React Flow 连线变更处理
  onConnect: OnConnect                     // React Flow 连接处理

  // ===== 选中状态 =====
  selectedNodeId: string | null            // 当前选中节点 ID

  // ===== 节点创建（同步创建关联素材） =====
  addTextNode(position): void
  addImageNode(position): void
  addVideoNode(position): void
  addAudioNode(position): void
  addNodeFromAsset(asset, position): void  // 从素材创建节点
  expandNode(sourceNodeId, nodeType, side): void  // 扩展节点

  // ===== 节点管理 =====
  updateNodeData(nodeId, data): void       // 更新节点数据
  deleteNode(nodeId): void                 // 删除节点（级联删除连线+素材）

  // ===== 素材库 =====
  assets: AssetItem[]
  addAsset(asset): void
  removeAsset(id): void                    // 删除素材（级联删除关联节点）

  // ===== 画布文件管理 =====
  canvasFiles: CanvasFile[]
  saveCanvasAsFile(name?): void            // 保存画布快照
  loadCanvasFile(id): void                 // 加载画布快照
  removeCanvasFile(id): void
  renameCanvasFile(id, name): void
  exportNodeAsAsset(nodeId): void          // 导出节点为独立素材
  importAssetToCanvas(asset, position): void

  // ===== 画布操作 =====
  clearCanvas(): void                      // 清空画布（保留独立素材）
}
```

### 7.2 核心设计模式：节点-素材双向链接

每次创建画布节点时，同步创建一个关联的 `AssetItem`（通过 `nodeId` / `nodeType` 字段双向绑定）：

- 删除节点 → 自动删除关联素材 + 连线
- 删除素材 → 自动删除关联节点 + 连线
- 清空画布 → 只移除节点关联素材，保留独立素材

### 7.3 数据类型定义

```typescript
// 节点类型
type CanvasNodeType = 'text' | 'image' | 'video' | 'audio'

// 生成状态
type GenerationStatus = 'idle' | 'generating' | 'completed' | 'failed'

// 文本节点数据
interface TextNodeData {
  label: string
  text: string
  prompt: string
  generatedText: string
  status: GenerationStatus
  selectedModel?: string
  formatting?: {
    heading?: 'h1' | 'h2' | 'h3' | 'p'
    bold?: boolean
    italic?: boolean
    listType?: 'ul' | 'ol' | null
  }
}

// 图片节点数据
interface ImageNodeData {
  label: string
  imageUrl: string
  prompt: string
  status: GenerationStatus
  selectedModel?: string
  quality?: 'auto' | 'high' | 'standard'
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '2:3' | '3:2' | '7:4' | '4:7'
  batchSize?: number
  referenceImageUrl?: string
}

// 视频节点数据
interface VideoNodeData {
  label: string
  videoUrl: string
  prompt: string
  status: GenerationStatus
  selectedModel?: string
}

// 音频节点数据
interface AudioNodeData {
  label: string
  audioUrl: string
  prompt: string
  status: GenerationStatus
  selectedModel?: string
}

// 素材项（支持双向节点关联）
interface AssetItem {
  id: string
  name: string
  url: string
  type: 'image' | 'video' | 'text' | 'audio'
  createdAt: number
  nodeId?: string       // 关联画布节点 ID
  nodeType?: string     // 关联节点类型
}

// 画布文件（快照）
interface CanvasFile {
  id: string
  name: string
  snapshot: { nodes: Node[]; edges: Edge[] }
  thumbnailUrl: string
  nodeCount: number
  edgeCount: number
  createdAt: number
  updatedAt: number
}
```

---

## 八、API 接口

### 8.1 后端基础信息
- **框架**：Python FastAPI
- **端口**：8000
- **CORS**：允许所有来源（开发阶段）
- **模式**：当前为 Mock 模式（模拟生成，1-3s 延迟，10% 随机失败率）

### 8.2 接口列表

| 方法 | 路径 | 描述 | 状态 |
|------|------|------|------|
| GET | `/` | 健康检查 | ✅ |
| GET | `/api/model/list` | 获取可用模型列表（6个预置模型） | ✅ Mock |
| POST | `/api/model/run` | 调用 AI 模型生成内容 | ✅ Mock |
| GET | `/api/generation/history` | 获取生成历史记录（内存存储） | ✅ Mock |
| DELETE | `/api/generation/{gen_id}` | 删除生成记录 | ✅ Mock |
| POST | `/api/upload` | 上传素材文件（存储到 uploads/） | ✅ |
| POST | `/api/prompt/optimize` | 模板化 Prompt 优化 | ✅ Mock |

### 8.3 核心接口详情

#### POST `/api/model/run`

```json
// 请求
{
  "model_type": "image",          // "image" | "text" | "video" | "audio"
  "prompt": "一个女孩站在樱花树下",
  "negative_prompt": "",
  "width": 512, "height": 512,
  "model_id": "mj-niji7",
  "quality": "auto",
  "aspect_ratio": "16:9",
  "batch_size": 4
}

// 响应
{
  "id": "gen_abc123",
  "model_type": "image",
  "status": "completed",          // "completed" | "failed"
  "result_url": "https://...",
  "result_text": null,
  "revised_prompt": "...",
  "error": null,
  "created_at": 1709971200.0
}
```

### 8.4 前端服务层

| 服务函数 | 文件 | 描述 |
|---------|------|------|
| `generateContent(modelType, prompt, options?)` | imageGeneration.ts | 通用内容生成 |
| `generateImage(request)` | imageGeneration.ts | 图片生成 |
| `generateText(prompt)` | imageGeneration.ts | 文本生成 |
| `generateVideo(prompt)` | imageGeneration.ts | 视频生成 |
| `listModels()` | imageGeneration.ts | 获取模型列表 |
| `optimizePrompt(prompt, modelType)` | imageGeneration.ts | Prompt 优化 |
| `getGenerationHistory(limit)` | imageGeneration.ts | 获取生成历史 |
| `uploadImage(file)` | upload.ts | 文件上传（后端不可用时自动降级为本地 blob URL） |

---

## 九、用户流程

### 流程 1：创建新项目
1. 用户打开应用 → 仪表板模式，默认显示"画布"标签
2. 点击"新建项目"卡片 → 新浏览器标签页打开
3. 进入空白画布编辑器，显示欢迎引导

### 流程 2：创建节点并连线
1. 双击或右键画布空白处 → 弹出节点类型菜单
2. 选择"图片节点" → 节点出现在点击位置
3. 点击节点选中 → 左右出现 "+" 扩展按钮
4. 点击右侧 "+" → 选择"文本节点"
5. 新文本节点出现在右侧，紫色虚线连线自动建立

### 流程 3：AI 生成图片
1. 选中图片节点
2. 输入 Prompt（如："一个女孩站在樱花树下"）
3. 选择模型（如："Banana 2"）
4. 设置宽高比和画质
5. 点击发送按钮 → 节点显示 loading
6. 后端返回图片 URL → 预览区显示生成图片

### 流程 4：导入素材到画布
1. 点击画布左侧"导入素材"按钮
2. 弹出菜单选择"导入图片"
3. 弹出资产选取弹窗，显示所有图片素材
4. 点击选中需要的图片（可多选）
5. 点击"确认" → 素材导入到画布资产库

### 流程 5：本地上传文件
1. 点击画布左侧"本地上传"按钮
2. 系统文件选择器打开
3. 选择文件（图片/视频/音频/文本）
4. 文件上传到后端（或本地 blob URL 降级）
5. 素材出现在资产库中

### 流程 6：浏览和管理资产
1. 从仪表板点击左侧"资产"按钮
2. 进入资产管理视图，5 个主标签可切换
3. 每个标签下有子标签过滤
4. 悬停资产卡片可删除

### 流程 7：保存和加载项目
1. 画布编辑完成后，通过侧边栏保存画布快照
2. 返回仪表板可看到项目卡片
3. 点击项目卡片在新标签页中加载恢复

---

## 十、项目结构

```
网页端/
├── docs/
│   └── POC-PRD.md                    # 本文档
├── server/                            # 后端 Python/FastAPI
│   ├── main.py                        # API 服务主文件（Mock 模式）
│   ├── config.py                      # 配置管理（预留）
│   ├── database.py                    # 数据库连接（预留）
│   ├── models.py                      # ORM 模型（预留）
│   ├── schemas.py                     # Pydantic 模式（预留）
│   ├── routers/                       # 路由模块（预留）
│   ├── adapters/                      # AI 适配器（预留）
│   ├── requirements.txt               # Python 依赖
│   └── uploads/                       # 上传文件存储
├── src/                               # 前端 React/TypeScript
│   ├── App.tsx                        # 应用入口（双模式路由）
│   ├── main.tsx                       # 渲染入口
│   ├── index.css                      # 全局样式
│   ├── store/
│   │   ├── types.ts                   # 类型定义
│   │   ├── canvasStore.ts             # Zustand 全局状态
│   │   └── index.ts                   # 导出
│   ├── services/
│   │   ├── imageGeneration.ts         # AI 生成 API 服务
│   │   └── upload.ts                  # 文件上传服务
│   └── components/
│       ├── Canvas.tsx                 # 主画布组件
│       ├── AssetPickerModal.tsx        # 资产选取弹窗（共享组件）
│       ├── nodes/
│       │   ├── TextNode.tsx           # 文本节点
│       │   ├── ImageNode.tsx          # 图片节点
│       │   ├── VideoNode.tsx          # 视频节点
│       │   ├── AudioNode.tsx          # 音频节点
│       │   └── ExpandButton.tsx       # 节点扩展按钮
│       ├── edges/
│       │   └── DependencyEdge.tsx     # 依赖连线
│       ├── panels/
│       │   ├── TopBar.tsx             # 顶部栏
│       │   ├── CanvasLeftBar.tsx       # 画布左侧操作栏（上传+导入）
│       │   ├── CanvasBottomBar.tsx     # 底部工具栏
│       │   └── ContextMenu.tsx        # 右键菜单
│       └── views/
│           ├── CanvasProjectsView.tsx  # 画布项目列表视图
│           └── AssetsView.tsx          # 资产管理视图
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## 十一、UI/UX 设计规范

### 11.1 色彩体系

| 用途 | 色值 | 说明 |
|------|------|------|
| 主背景 | `#0a0a0a` | 全局深色背景 |
| 次级背景 | `#0d0d1f` | 导航栏、顶部栏、面板背景 |
| 卡片背景 | `#1a1a2e` | 项目卡片、素材卡片 |
| 主题色 | `#8b5cf6` (violet-500) | 连线、选中态、按钮高亮 |
| 文本节点色 | `#3b82f6` (blue-500) | 文本节点标识 |
| 图片节点色 | `#10b981` (emerald-500) | 图片节点标识 |
| 视频节点色 | `#f43f5e` (rose-500) | 视频节点标识 |
| 音频节点色 | `#06b6d4` (cyan-500) | 音频节点标识 |
| 主文本 | `text-gray-200` | 标题、重要文本 |
| 次级文本 | `text-gray-400 ~ text-gray-500` | 描述、标签 |
| 弱文本 | `text-gray-600 ~ text-gray-700` | 时间戳、占位符 |

### 11.2 边框与圆角

| 元素 | 样式 |
|------|------|
| 项目卡片 | `rounded-lg border border-gray-700/50` |
| 素材卡片 | `rounded-xl border border-gray-700/50` |
| 弹窗 | `rounded-2xl border border-gray-700/50` |
| 按钮 | `rounded-lg` |
| 子标签 | `rounded-full`（胶囊形） |

### 11.3 交互反馈

| 交互 | 效果 |
|------|------|
| 卡片悬停 | 边框变亮 `hover:border-gray-600` + 背景变亮 |
| 按钮悬停 | 文本变亮 + 背景微亮（`hover:bg-white/5`） |
| 选中态 | 紫色背景 `bg-violet-600/15` + 紫色文本 `text-violet-400` |
| 删除按钮 | 默认透明，悬停显示（`opacity-0 group-hover:opacity-100`） |
| 节点选中 | 显示扩展按钮，连线发光 |

### 11.4 字体

- 系统字体栈：`-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif`
- 标题：`text-lg font-medium` (18px)
- 正文：`text-sm` (14px)
- 辅助：`text-xs` (12px)
- 微标签：`text-[10px]`

### 11.5 滚动条

- 宽度 6px
- 轨道色 `#1a1a1a`
- 滑块色 `#333`，悬停 `#555`
- 圆角 3px

---

## 十二、启动方式

### 后端
```bash
cd server
pip install -r requirements.txt
python main.py
# 服务运行在 http://localhost:8000
```

### 前端
```bash
npm install
npm run dev
# 服务运行在 http://localhost:5173
```

---

## 十三、功能验收清单

| # | 模块 | 功能 | 描述 | 状态 |
|---|------|------|------|------|
| 1.1 | 导航 | 仪表板双栏布局 | 左侧 60px 导航栏 + 右侧主视图切换 | ✅ |
| 1.2 | 导航 | 画布项目列表 | 网格卡片展示项目 + 新建项目 | ✅ |
| 1.3 | 导航 | 新标签页打开项目 | 点击项目卡片在新浏览器标签页中打开画布编辑器 | ✅ |
| 1.4 | 导航 | 资产管理视图 | 5 主标签 + 子标签 + 素材网格浏览 | ✅ |
| 2.1 | 画布 | 无限画布 | 缩放 0.1x-4x、中键平移、网格吸附 16px、小地图 | ✅ |
| 2.2 | 画布 | 创建节点 | 双击/右键菜单/扩展按钮 创建 4 种节点 | ✅ |
| 2.3 | 画布 | 扩展节点 | +号按钮创建子节点 + 自动连线 | ✅ |
| 2.4 | 画布 | 节点操作 | 拖拽移动、调整大小、Delete 删除 | ✅ |
| 2.5 | 画布 | 手动连线 | Handle 拖拽连线、紫色虚线箭头动画 | ✅ |
| 2.6 | 画布 | 框选 | 左键拖拽框选（Partial 模式） | ✅ |
| 2.7 | 画布 | 底部工具栏 | 小地图/适应画布/缩放滑块/重置 | ✅ |
| 2.8 | 画布 | 空画布引导 | 欢迎引导面板 | ✅ |
| 3.1 | 操作栏 | 本地上传 | 支持图片/视频/音频/文本文件上传 | ✅ |
| 3.2 | 操作栏 | 导入素材菜单 | 导入文本/图片/视频 三项 | ✅ |
| 3.3 | 操作栏 | 资产选取弹窗 | 多选 + 子标签过滤 + 确认导入 | ✅ |
| 4.1 | 节点 | 文本节点 | 富文本工具栏 + AI 文本生成 + 模型选择 | ✅ |
| 4.2 | 节点 | 图片节点 | 上传 + AI 生成 + 模型/宽高比/画质设置 | ✅ |
| 4.3 | 节点 | 视频节点 | AI 生成 + 视频播放器预览 | ✅ |
| 4.4 | 节点 | 音频节点 | AI 生成 + 音频播放器预览 | ✅ |
| 4.5 | 连线 | 依赖连线 | 紫色虚线贝塞尔曲线 + 箭头 + 选中删除 | ✅ |
| 5.1 | 后端 | Mock API | 模拟生成（1-3s 延迟、10% 失败率） | ✅ |
| 5.2 | 后端 | 文件上传 | 上传到 uploads/ 目录 | ✅ |
| 5.3 | 前端 | 降级处理 | 后端不可用时上传降级为本地 blob URL | ✅ |

---

## 十四、已知问题

| # | 文件 | 问题描述 | 严重程度 |
|---|------|---------|---------|
| 1 | TopBar.tsx | `handleExportJSON` 引用了未定义的 `nodes`/`edges` 变量，导出功能运行时会报错 | 中 |
| 2 | TextNode.tsx | AI 文本生成使用 `setTimeout` 模拟，未调用后端 API | 低（POC 阶段） |
| 3 | ImageNode.tsx | AI 图片生成使用 `setTimeout` 模拟，未调用后端 API | 低（POC 阶段） |

---

## 十五、后续 MVP 规划

POC 完成后，下一阶段 MVP (v0.0.1.0) 需要补充：
- 真实 AI 模型接入（替换 Mock 模式）
- 素材库持久化存储（当前为内存存储）
- 资产子标签过滤逻辑（超清/收藏）
- 视频/音频节点模型选择器 UI（与图片节点一致）
- 项目文件持久化（当前为内存存储，刷新丢失）
- 成品导出/下载
- 用户账号系统
- 性能优化
- 后端数据库集成（SQLAlchemy ORM 模型已预留）
