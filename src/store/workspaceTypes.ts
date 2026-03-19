// ===== 工作区类型定义 =====

// 文档类型 — 每个可以在 tab 中打开的实体
export type DocumentType = 'canvas' | 'script' | 'character' | 'scene' | 'storyboardFrame' | 'media' | 'ai' | 'welcome'

// 文档标识
export interface DocumentId {
  type: DocumentType
  id: string  // 'ai' 类型用 canvasFile id 标识不同的 AI 文件
}

// 工作区 Tab
export interface WorkspaceTab {
  docId: DocumentId
  label: string
  dirty?: boolean
}

// Pane 叶子节点 — 包含 tabs
export interface PaneLeaf {
  kind: 'leaf'
  id: string
  tabs: WorkspaceTab[]
  activeTabIndex: number
}

// Pane 分割节点 — 包含子 pane
export interface PaneSplit {
  kind: 'split'
  id: string
  direction: 'horizontal' | 'vertical'
  children: PaneNode[]
  sizes: number[]
}

// Pane 节点（递归树结构）
export type PaneNode = PaneLeaf | PaneSplit

// 文件树项类型
export type FileTreeItemType = 'folder' | DocumentType

// 文件树项
export interface FileTreeItem {
  id: string
  type: FileTreeItemType
  label: string
  children?: FileTreeItem[]
  docId?: DocumentId
  count?: number  // 文件夹中的文件数量
}
