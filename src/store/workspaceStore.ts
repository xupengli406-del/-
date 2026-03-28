import { create } from 'zustand'
import type {
  PaneNode,
  PaneLeaf,
  PaneSplit,
  DocumentId,
  WorkspaceTab,
  FileTreeItem,
} from './workspaceTypes'
import { generatePaneId, isDocIdEqual, getDocumentLabel } from './documentHelpers'
import { useCanvasStore } from './canvasStore'

// 侧边栏面板类型 — 对应 Obsidian Sidebar 中不同的 tab
export type SidePanelType = 'files'

interface WorkspaceState {
  // Pane 布局树
  paneLayout: PaneNode
  // 当前聚焦的 pane id
  activePaneId: string
  // 侧边栏面板（null = 侧面板折叠，但 Ribbon 始终可见）
  activeSidePanel: SidePanelType | null
  // 文件树展开状态
  fileTreeExpandedFolders: Set<string>

  // === 动作 ===
  openDocument: (docId: DocumentId, targetPaneId?: string) => void
  openDocumentInPlace: (docId: DocumentId, targetPaneId?: string) => void
  closeTab: (paneId: string, tabIndex: number) => void
  setActiveTab: (paneId: string, tabIndex: number) => void
  setActivePaneId: (paneId: string) => void
  splitPane: (paneId: string, direction: 'horizontal' | 'vertical', docId?: DocumentId) => void
  updatePaneSizes: (splitId: string, sizes: number[]) => void
  setActiveSidePanel: (panel: SidePanelType | null) => void
  toggleSidePanel: (panel: SidePanelType) => void
  toggleFolder: (folderId: string) => void
  buildFileTree: () => FileTreeItem[]
  /** 画布文件名变更后同步所有 pane 内标签标题 */
  refreshTabLabels: () => void
}

const initialPaneId = generatePaneId()

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  paneLayout: {
    kind: 'leaf',
    id: initialPaneId,
    tabs: [],
    activeTabIndex: -1,
  } as PaneLeaf,

  activePaneId: initialPaneId,
  activeSidePanel: 'files' as SidePanelType | null,
  fileTreeExpandedFolders: new Set<string>(),

  setActiveSidePanel: (panel: SidePanelType | null) => set({ activeSidePanel: panel }),

  toggleSidePanel: (panel: SidePanelType) => set((s) => ({
    activeSidePanel: s.activeSidePanel === panel ? null : panel,
  })),

  toggleFolder: (folderId: string) => set((s) => {
    const next = new Set(s.fileTreeExpandedFolders)
    if (next.has(folderId)) next.delete(folderId)
    else next.add(folderId)
    return { fileTreeExpandedFolders: next }
  }),

  refreshTabLabels: () => {
    const canvasState = useCanvasStore.getState()
    set((s) => ({
      paneLayout: mapPaneLabels(s.paneLayout, canvasState),
    }))
  },

  setActivePaneId: (paneId: string) => set({ activePaneId: paneId }),

  // 打开文档: 在目标 pane 中添加或聚焦 tab
  openDocument: (docId: DocumentId, targetPaneId?: string) => {
    const state = get()
    const paneId = targetPaneId || state.activePaneId

    // 先查找是否已经在某个 pane 中打开了
    const existingPane = findTabInTree(state.paneLayout, docId)
    if (existingPane) {
      set({
        paneLayout: updateLeafInTree(state.paneLayout, existingPane.paneId, (leaf) => ({
          ...leaf,
          activeTabIndex: existingPane.tabIndex,
        })),
        activePaneId: existingPane.paneId,
      })
      return
    }

    // 获取标签文本
    const canvasState = useCanvasStore.getState()
    const label = getDocumentLabel(docId, canvasState)

    const newTab: WorkspaceTab = { docId, label }

    set({
      paneLayout: updateLeafInTree(state.paneLayout, paneId, (leaf) => {
        const tabs = [...leaf.tabs, newTab]
        return { ...leaf, tabs, activeTabIndex: tabs.length - 1 }
      }),
      activePaneId: paneId,
    })
  },

  // 在当前标签页就地打开文档（替换当前活跃 tab 的内容，不新增 tab）
  // 始终在当前 pane 操作，不会跳到其他 pane
  openDocumentInPlace: (docId: DocumentId, targetPaneId?: string) => {
    const state = get()
    const paneId = targetPaneId || state.activePaneId

    // 只在当前 pane 中查找是否已打开该文档
    const currentLeaf = findLeafById(state.paneLayout, paneId)
    if (currentLeaf) {
      const existingTabIdx = currentLeaf.tabs.findIndex((t) => isDocIdEqual(t.docId, docId))
      if (existingTabIdx >= 0) {
        // 当前 pane 已有该文档，切换到该 tab
        set({
          paneLayout: updateLeafInTree(state.paneLayout, paneId, (leaf) => ({
            ...leaf,
            activeTabIndex: existingTabIdx,
          })),
        })
        return
      }
    }

    const canvasState = useCanvasStore.getState()
    const label = getDocumentLabel(docId, canvasState)
    const newTab: WorkspaceTab = { docId, label }

    set({
      paneLayout: updateLeafInTree(state.paneLayout, paneId, (leaf) => {
        if (leaf.tabs.length === 0 || leaf.activeTabIndex < 0) {
          // 没有标签页，直接添加
          return { ...leaf, tabs: [newTab], activeTabIndex: 0 }
        }
        // 替换当前活跃标签页
        const tabs = leaf.tabs.map((t, i) => i === leaf.activeTabIndex ? newTab : t)
        return { ...leaf, tabs }
      }),
      activePaneId: paneId,
    })
  },

  // 关闭 tab
  closeTab: (paneId: string, tabIndex: number) => {
    const state = get()
    const updated = updateLeafInTree(state.paneLayout, paneId, (leaf) => {
      const tabs = leaf.tabs.filter((_, i) => i !== tabIndex)
      let activeTabIndex = leaf.activeTabIndex
      if (tabs.length === 0) {
        activeTabIndex = -1
      } else if (tabIndex <= activeTabIndex) {
        activeTabIndex = Math.max(0, activeTabIndex - 1)
      }
      return { ...leaf, tabs, activeTabIndex }
    })

    // 如果 leaf 为空且在 split 中，折叠它
    const collapsed = collapseEmptyLeaves(updated)

    // 如果当前活跃 pane 被折叠了，切换到第一个剩余 leaf
    let newActivePaneId = state.activePaneId
    if (!findLeafById(collapsed, newActivePaneId)) {
      newActivePaneId = getFirstLeafId(collapsed)
    }

    set({ paneLayout: collapsed, activePaneId: newActivePaneId })
  },

  // 切换 tab
  setActiveTab: (paneId: string, tabIndex: number) => {
    const state = get()
    set({
      paneLayout: updateLeafInTree(state.paneLayout, paneId, (leaf) => ({
        ...leaf,
        activeTabIndex: tabIndex,
      })),
      activePaneId: paneId,
    })
  },

  // 分屏 — 复制当前活跃标签页到新 pane（类似 VS Code / Obsidian 行为）
  splitPane: (paneId: string, direction: 'horizontal' | 'vertical', docId?: DocumentId) => {
    const state = get()
    const newLeafId = generatePaneId()

    // 如果没有指定 docId，复制当前 pane 的活跃标签页文档
    let targetDocId = docId
    if (!targetDocId) {
      const sourceLeaf = findLeafById(state.paneLayout, paneId)
      if (sourceLeaf && sourceLeaf.activeTabIndex >= 0 && sourceLeaf.tabs[sourceLeaf.activeTabIndex]) {
        targetDocId = sourceLeaf.tabs[sourceLeaf.activeTabIndex].docId
      }
    }

    const newLeafTabs: WorkspaceTab[] = []
    if (targetDocId) {
      const canvasState = useCanvasStore.getState()
      const label = getDocumentLabel(targetDocId, canvasState)
      newLeafTabs.push({ docId: targetDocId, label })
    }

    const newLeaf: PaneLeaf = {
      kind: 'leaf',
      id: newLeafId,
      tabs: newLeafTabs,
      activeTabIndex: newLeafTabs.length > 0 ? 0 : -1,
    }

    const updated = replaceNodeInTree(state.paneLayout, paneId, (node): PaneSplit => ({
      kind: 'split',
      id: generatePaneId(),
      direction,
      children: [node, newLeaf],
      sizes: [50, 50],
    }))

    set({
      paneLayout: updated,
      activePaneId: newLeafId,
    })
  },

  // 更新分割大小
  updatePaneSizes: (splitId: string, sizes: number[]) => {
    const state = get()
    set({
      paneLayout: updateSplitInTree(state.paneLayout, splitId, (split) => ({
        ...split,
        sizes,
      })),
    })
  },

  // 构建文件树 — Obsidian 式：初始为空，文件和文件夹平级，完全由用户创建
  buildFileTree: (): FileTreeItem[] => {
    const cs = useCanvasStore.getState()

    // 将每个 canvasFile 转换为 FileTreeItem
    const toFileItem = (f: { id: string; name: string; projectType?: string }): FileTreeItem => {
      const typeMap: Record<string, { type: import('./workspaceTypes').DocumentType; prefix: string }> = {
        script: { type: 'script', prefix: 'script_' },
        image: { type: 'ai', prefix: 'ai_' },
        video: { type: 'ai', prefix: 'ai_' },
        audio: { type: 'ai', prefix: 'ai_' },
      }
      const mapped = typeMap[f.projectType || ''] || { type: 'canvas' as const, prefix: 'canvas_' }
      return {
        id: `${mapped.prefix}${f.id}`,
        type: mapped.type,
        label: f.name,
        docId: { type: mapped.type, id: f.id },
      }
    }

    // 递归构建文件夹树
    const buildFolderTree = (parentId: string | null): FileTreeItem[] => {
      const items: FileTreeItem[] = []

      // 该层级的文件夹
      for (const folder of cs.customFolders) {
        if ((folder.parentId ?? null) !== parentId) continue
        const children = buildFolderTree(folder.id)
        items.push({
          id: folder.id,
          type: 'folder',
          label: folder.name,
          children,
          count: children.length,
        })
      }

      // 该层级的文件（folderId 匹配当前层级）
      for (const f of cs.canvasFiles) {
        if ((f.folderId ?? null) !== parentId) continue
        items.push(toFileItem(f))
      }

      return items
    }

    return buildFolderTree(null)
  },
}))

// ===== 树操作辅助函数 =====

// 在树中找到某个 tab 所在的 pane
function findTabInTree(node: PaneNode, docId: DocumentId): { paneId: string, tabIndex: number } | null {
  if (node.kind === 'leaf') {
    const idx = node.tabs.findIndex((t) => isDocIdEqual(t.docId, docId))
    if (idx >= 0) return { paneId: node.id, tabIndex: idx }
    return null
  }
  for (const child of node.children) {
    const result = findTabInTree(child, docId)
    if (result) return result
  }
  return null
}

function mapPaneLabels(node: PaneNode, canvasState: ReturnType<typeof useCanvasStore.getState>): PaneNode {
  if (node.kind === 'leaf') {
    return {
      ...node,
      tabs: node.tabs.map((t) => ({
        ...t,
        label: getDocumentLabel(t.docId, canvasState),
      })),
    }
  }
  return {
    ...node,
    children: node.children.map((c) => mapPaneLabels(c, canvasState)),
  }
}

// 更新树中某个 leaf
function updateLeafInTree(node: PaneNode, leafId: string, updater: (leaf: PaneLeaf) => PaneLeaf): PaneNode {
  if (node.kind === 'leaf') {
    return node.id === leafId ? updater(node) : node
  }
  return {
    ...node,
    children: node.children.map((c) => updateLeafInTree(c, leafId, updater)),
  }
}

// 更新树中某个 split
function updateSplitInTree(node: PaneNode, splitId: string, updater: (split: PaneSplit) => PaneSplit): PaneNode {
  if (node.kind === 'split') {
    const updated = node.id === splitId ? updater(node) : node
    return {
      ...updated,
      children: (updated as PaneSplit).children.map((c) => updateSplitInTree(c, splitId, updater)),
    }
  }
  return node
}

// 替换树中某个节点
function replaceNodeInTree(node: PaneNode, targetId: string, replacer: (node: PaneNode) => PaneNode): PaneNode {
  if (node.kind === 'leaf') {
    return node.id === targetId ? replacer(node) : node
  }
  if (node.id === targetId) return replacer(node)
  return {
    ...node,
    children: node.children.map((c) => replaceNodeInTree(c, targetId, replacer)),
  }
}

// 折叠空的 leaf 节点 — 如果 split 只剩一个子节点，用那个子节点替换 split
function collapseEmptyLeaves(node: PaneNode): PaneNode {
  if (node.kind === 'leaf') return node

  // 先递归处理子节点
  let children = node.children.map((c) => collapseEmptyLeaves(c))

  // 移除空的 leaf（tabs 为空且不是根节点唯一的 leaf）
  children = children.filter((c) => {
    if (c.kind === 'leaf' && c.tabs.length === 0 && children.length > 1) return false
    return true
  })

  // 如果只剩一个子节点，直接返回那个子节点
  if (children.length === 1) return children[0]

  // 如果没有子节点了，返回一个空 leaf
  if (children.length === 0) {
    return { kind: 'leaf', id: generatePaneId(), tabs: [], activeTabIndex: -1 }
  }

  return { ...node, children }
}

// 在树中找到某个 leaf（按 id）
function findLeafById(node: PaneNode, leafId: string): PaneLeaf | null {
  if (node.kind === 'leaf') {
    return node.id === leafId ? node : null
  }
  for (const child of node.children) {
    const result = findLeafById(child, leafId)
    if (result) return result
  }
  return null
}

// 获取树中第一个 leaf 的 id
function getFirstLeafId(node: PaneNode): string {
  if (node.kind === 'leaf') return node.id
  return getFirstLeafId(node.children[0])
}
