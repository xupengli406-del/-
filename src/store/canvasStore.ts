import { create } from 'zustand'
import type { AssetItem, CanvasFile, CanvasFileMediaVersion, CustomFolder, ChatMessage, ChatReference, ModelInfo, AssetSortBy, AssetSortOrder, AssetViewMode } from './types'
import {
  fetchAssets,
  fetchCanvasFiles,
  fetchGenerateHistory,
  saveGenerateHistoryAPI,
  createAssetAPI,
  deleteAssetAPI,
  createCanvasFileAPI,
  updateCanvasFileAPI,
  deleteCanvasFileAPI,
  canvasFileToPayload,
} from '../services/persistence'
import type { GenerateHistoryPayload } from '../services/persistence'
import { authenticate, listModels } from '../services/imageGeneration'

// 跨标签页同步通道
const canvasChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('canvas_sync')
  : null

function canonicalMediaUrlFromFile(file: CanvasFile | undefined): string | null {
  const ms = file?.mediaState
  if (!ms?.selectedVersionId) return null
  return ms.versions.find((v) => v.id === ms.selectedVersionId)?.url ?? null
}

interface CanvasStore {
  // 认证状态
  ak: string
  authedModels: Record<string, string[]>
  availableModels: ModelInfo[]
  authError: string | null
  authenticateAndLoadModels: () => Promise<void>

  // 导航状态
  editingProjectId: string | null
  setEditingProjectId: (id: string | null) => void

  // 对话消息
  chatMessages: ChatMessage[]
  addChatMessage: (message: ChatMessage) => void
  updateChatMessage: (id: string, updates: Partial<ChatMessage>) => void

  // 对话引用（"添加到对话"缓冲区）
  chatReferences: ChatReference[]
  removeChatReference: (nodeId: string) => void
  clearChatReferences: () => void

  // 素材库（仅主页生成/上传内容）
  assets: AssetItem[]
  addAsset: (asset: AssetItem) => void
  addGeneratedAsset: (asset: AssetItem) => void
  removeAsset: (id: string) => void

  // 画布文件
  canvasFiles: CanvasFile[]
  saveCanvasAsFile: (name?: string, projectType?: import('./types').CanvasFileProjectType) => string
  loadCanvasFile: (id: string) => void
  removeCanvasFile: (id: string) => void
  renameCanvasFile: (id: string, name: string) => void
  updateCurrentCanvasFile: () => void

  // 画布操作
  clearCanvas: () => void

  // 生成页对话历史（持久化）
  generateHistory: GenerateHistoryPayload[]
  addGenerateHistoryItem: (item: GenerateHistoryPayload) => void
  updateGenerateHistoryItem: (id: string, updates: Partial<GenerateHistoryPayload>) => void
  removeGenerateHistoryItem: (id: string) => void

  // 初始化（从后端加载）
  initializeFromBackend: () => Promise<void>

  // AI 面板初始模式
  initialAIMode: 'image' | 'video' | null
  setInitialAIMode: (mode: 'image' | 'video' | null) => void

  // 生成视图历史面板
  isHistoryPanelOpen: boolean
  toggleHistoryPanel: () => void

  // 资产视图筛选/排序/视图模式
  assetSearchQuery: string
  setAssetSearchQuery: (query: string) => void
  assetSortBy: AssetSortBy
  assetSortOrder: AssetSortOrder
  setAssetSort: (sortBy: AssetSortBy, order: AssetSortOrder) => void
  assetViewMode: AssetViewMode
  setAssetViewMode: (mode: AssetViewMode) => void

  // 自定义文件夹管理
  customFolders: CustomFolder[]
  addCustomFolder: (name: string, parentId?: string | null) => string
  renameCustomFolder: (id: string, name: string) => void
  removeCustomFolder: (id: string) => void
  // 文件归属操作（拖拽文件到文件夹）
  moveFileToFolder: (fileId: string, folderId: string | undefined) => void
  // 文件夹归属操作（拖拽文件夹到另一个文件夹）
  moveFolderToFolder: (folderId: string, targetParentId: string | undefined) => void

  appendCanvasFileMediaVersion: (
    fileId: string,
    payload: { url: string; prompt: string; model?: string }
  ) => void
  setCanvasFileSelectedMediaVersion: (fileId: string, versionId: string | null) => void
  addCanvasFileChatMessage: (fileId: string, message: ChatMessage) => void
  updateCanvasFileChatMessage: (fileId: string, messageId: string, updates: Partial<ChatMessage>) => void
  getCanvasFileCanonicalMediaUrl: (fileId: string) => string | null
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // 认证状态
  ak: '',
  authedModels: {},
  availableModels: [],
  authError: null,

  authenticateAndLoadModels: async () => {
    try {
      const authRes = await authenticate('testuser1')
      set({ ak: authRes.ak, authedModels: authRes.authedModels, authError: null })

      const modelRes = await listModels(authRes.ak)
      set({ availableModels: modelRes.models })
    } catch (err) {
      const msg = err instanceof Error ? err.message : '认证失败'
      console.warn('[Auth] 认证或加载模型失败:', msg)
      set({ authError: msg })
    }
  },

  editingProjectId: null,
  setEditingProjectId: (id) => set({ editingProjectId: id }),

  chatMessages: [],
  chatReferences: [],
  assets: [],
  canvasFiles: [],
  generateHistory: [],

  // ===== 对话消息管理 =====

  addChatMessage: (message) => {
    set({ chatMessages: [...get().chatMessages, message] })
  },

  updateChatMessage: (id, updates) => {
    set({
      chatMessages: get().chatMessages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    })
  },

  // ===== 对话引用 =====

  removeChatReference: (nodeId) => {
    set({ chatReferences: get().chatReferences.filter((r) => r.nodeId !== nodeId) })
  },

  clearChatReferences: () => set({ chatReferences: [] }),

  // ===== 素材库（仅主页生成+上传内容） =====

  addAsset: (asset) => {
    set({ assets: [...get().assets, asset] })
    // 持久化到后端
    createAssetAPI({
      id: asset.id,
      name: asset.name,
      url: asset.url,
      type: asset.type as 'image' | 'video' | 'text',
      source: asset.source || 'upload',
      textContent: asset.textContent,
      createdAt: asset.createdAt,
    })
  },

  addGeneratedAsset: (asset) => {
    set({ assets: [...get().assets, asset] })
    // 持久化到后端
    createAssetAPI({
      id: asset.id,
      name: asset.name,
      url: asset.url,
      type: asset.type as 'image' | 'video' | 'text',
      source: 'generate',
      textContent: asset.textContent,
      createdAt: asset.createdAt,
    })
  },

  removeAsset: (id) => {
    set({
      assets: get().assets.filter((a) => a.id !== id),
    })
    // 持久化删除
    deleteAssetAPI(id)
  },

  // ===== 画布文件管理 =====

  saveCanvasAsFile: (name, projectType) => {
    const { canvasFiles } = get()
    const isDedicatedMedia = projectType === 'image' || projectType === 'video'
    const file: CanvasFile = {
      id: `canvas_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: name || `画布 ${canvasFiles.length + 1}`,
      projectType,
      ...(isDedicatedMedia
        ? {
            mediaState: { versions: [], selectedVersionId: null },
            aiSession: { messages: [] },
          }
        : {}),
      snapshot: {
        nodes: [],
        edges: [],
      },
      thumbnailUrl: '',
      nodeCount: 0,
      edgeCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    set({ canvasFiles: [...canvasFiles, file] })
    createCanvasFileAPI(canvasFileToPayload(file))
    return file.id
  },

  loadCanvasFile: (id) => {
    const file = get().canvasFiles.find((f) => f.id === id)
    if (!file) return
    // 画布系统已移除，loadCanvasFile 仅用于设置当前编辑项目
    // 旧 snapshot 中的 nodes/edges 数据不再加载到内存
  },

  removeCanvasFile: (id) => {
    set({ canvasFiles: get().canvasFiles.filter((f) => f.id !== id) })
    // 持久化删除
    deleteCanvasFileAPI(id)
  },

  renameCanvasFile: (id, name) => {
    set({
      canvasFiles: get().canvasFiles.map((f) =>
        f.id === id ? { ...f, name, updatedAt: Date.now() } : f
      ),
    })
    canvasChannel?.postMessage({ type: 'rename', id, name })
    const file = get().canvasFiles.find((f) => f.id === id)
    if (file) {
      updateCanvasFileAPI(id, canvasFileToPayload(file))
    }
  },

  updateCurrentCanvasFile: () => {
    const { editingProjectId, canvasFiles } = get()
    if (!editingProjectId || editingProjectId === '__new__') return
    const prevFile = canvasFiles.find((f) => f.id === editingProjectId)
    const thumbCanonical = canonicalMediaUrlFromFile(prevFile)
    const thumbnailUrl =
      (typeof thumbCanonical === 'string' && thumbCanonical) ||
      prevFile?.thumbnailUrl ||
      ''
    const updatedFiles = canvasFiles.map((f) =>
      f.id === editingProjectId
        ? {
            ...f,
            thumbnailUrl,
            updatedAt: Date.now(),
          }
        : f
    )
    set({ canvasFiles: updatedFiles })
    const updated = updatedFiles.find((f) => f.id === editingProjectId)
    if (updated) {
      updateCanvasFileAPI(editingProjectId, canvasFileToPayload(updated))
    }
  },

  appendCanvasFileMediaVersion: (fileId, payload) => {
    const versionId = `ver_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const version: CanvasFileMediaVersion = {
      id: versionId,
      url: payload.url,
      prompt: payload.prompt,
      createdAt: Date.now(),
      model: payload.model,
    }
    set((s) => ({
      canvasFiles: s.canvasFiles.map((f) => {
        if (f.id !== fileId) return f
        const prev = f.mediaState ?? { versions: [], selectedVersionId: null }
        return {
          ...f,
          mediaState: {
            versions: [...prev.versions, version],
            selectedVersionId: versionId,
          },
          thumbnailUrl: payload.url,
          updatedAt: Date.now(),
        }
      }),
    }))
    const file = get().canvasFiles.find((x) => x.id === fileId)
    if (file) updateCanvasFileAPI(fileId, canvasFileToPayload(file))
  },

  setCanvasFileSelectedMediaVersion: (fileId, versionId) => {
    set((s) => ({
      canvasFiles: s.canvasFiles.map((f) => {
        if (f.id !== fileId) return f
        const prev = f.mediaState ?? { versions: [], selectedVersionId: null }
        const v = versionId ? prev.versions.find((x) => x.id === versionId) : null
        return {
          ...f,
          mediaState: { ...prev, selectedVersionId: versionId },
          thumbnailUrl: v?.url ?? f.thumbnailUrl,
          updatedAt: Date.now(),
        }
      }),
    }))
    const file = get().canvasFiles.find((x) => x.id === fileId)
    if (file) updateCanvasFileAPI(fileId, canvasFileToPayload(file))
  },

  addCanvasFileChatMessage: (fileId, message) => {
    set((s) => ({
      canvasFiles: s.canvasFiles.map((f) => {
        if (f.id !== fileId) return f
        const messages = f.aiSession?.messages ?? []
        return {
          ...f,
          aiSession: { messages: [...messages, message] },
          updatedAt: Date.now(),
        }
      }),
    }))
    const file = get().canvasFiles.find((x) => x.id === fileId)
    if (file) updateCanvasFileAPI(fileId, canvasFileToPayload(file))
  },

  updateCanvasFileChatMessage: (fileId, messageId, updates) => {
    set((s) => ({
      canvasFiles: s.canvasFiles.map((f) => {
        if (f.id !== fileId) return f
        const messages = f.aiSession?.messages ?? []
        return {
          ...f,
          aiSession: {
            messages: messages.map((m) => (m.id === messageId ? { ...m, ...updates } : m)),
          },
          updatedAt: Date.now(),
        }
      }),
    }))
    const file = get().canvasFiles.find((x) => x.id === fileId)
    if (file) updateCanvasFileAPI(fileId, canvasFileToPayload(file))
  },

  getCanvasFileCanonicalMediaUrl: (fileId) => {
    const f = get().canvasFiles.find((x) => x.id === fileId)
    return canonicalMediaUrlFromFile(f)
  },

  clearCanvas: () => {
    set({
      chatMessages: [],
      chatReferences: [],
    })
  },

  // ===== 生成页对话历史（持久化） =====

  addGenerateHistoryItem: (item) => {
    const updated = [...get().generateHistory, item]
    set({ generateHistory: updated })
    saveGenerateHistoryAPI(updated)
  },

  updateGenerateHistoryItem: (id, updates) => {
    const updated = get().generateHistory.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    )
    set({ generateHistory: updated })
    saveGenerateHistoryAPI(updated)
  },

  removeGenerateHistoryItem: (id) => {
    // 找到对应的历史项，删除关联的资产
    const item = get().generateHistory.find((h) => h.id === id)
    if (item) {
      // 查找与该历史项关联的资产（通过 prompt + createdAt 近似匹配，或通过 resultUrl 匹配）
      const matchingAsset = get().assets.find((a) => {
        if (item.resultUrl && a.url && a.url === item.resultUrl) return true
        // 文本类型通过 name 匹配 prompt
        if (a.name === item.prompt.slice(0, 30) && Math.abs(a.createdAt - item.createdAt) < 60000) return true
        return false
      })
      if (matchingAsset) {
        get().removeAsset(matchingAsset.id)
      }
    }
    const updated = get().generateHistory.filter((h) => h.id !== id)
    set({ generateHistory: updated })
    saveGenerateHistoryAPI(updated)
  },

  // ===== 初始化（从后端加载持久化数据） =====

  initializeFromBackend: async () => {
    // 先认证和加载模型
    await get().authenticateAndLoadModels()

    const [assets, canvasFiles, generateHistory] = await Promise.all([
      fetchAssets(),
      fetchCanvasFiles(),
      fetchGenerateHistory(),
    ])
    set({
      assets: assets.map((a) => ({
        id: a.id,
        name: a.name,
        url: a.url,
        type: a.type as AssetItem['type'],
        source: (a.source || 'generate') as AssetItem['source'],
        textContent: a.textContent,
        createdAt: a.createdAt,
      })),
      canvasFiles: canvasFiles.map((f) => ({
        id: f.id,
        name: f.name,
        projectType: f.projectType as CanvasFile['projectType'],
        folderId: f.folderId,
        mediaState: f.mediaState,
        aiSession: f.aiSession,
        snapshot: f.snapshot as CanvasFile['snapshot'],
        thumbnailUrl: f.thumbnailUrl,
        nodeCount: f.nodeCount,
        edgeCount: f.edgeCount,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      })),
      generateHistory,
    })
  },

  // AI 面板初始模式
  initialAIMode: null,
  setInitialAIMode: (mode) => set({ initialAIMode: mode }),

  // 生成视图历史面板
  isHistoryPanelOpen: true,
  toggleHistoryPanel: () => set((s) => ({ isHistoryPanelOpen: !s.isHistoryPanelOpen })),

  // 资产视图筛选/排序/视图模式
  assetSearchQuery: '',
  setAssetSearchQuery: (query) => set({ assetSearchQuery: query }),
  assetSortBy: 'createdAt' as AssetSortBy,
  assetSortOrder: 'desc' as AssetSortOrder,
  setAssetSort: (sortBy, order) => set({ assetSortBy: sortBy, assetSortOrder: order }),
  assetViewMode: 'grid' as AssetViewMode,
  setAssetViewMode: (mode) => set({ assetViewMode: mode }),

  // 自定义文件夹管理
  customFolders: [] as CustomFolder[],

  addCustomFolder: (name: string, parentId?: string | null) => {
    const id = `folder_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const folder: CustomFolder = { id, name, parentId: parentId ?? null }
    set((s) => ({ customFolders: [...s.customFolders, folder] }))
    return id
  },

  renameCustomFolder: (id: string, name: string) => {
    set((s) => ({
      customFolders: s.customFolders.map((f) => f.id === id ? { ...f, name } : f),
    }))
  },

  removeCustomFolder: (id: string) => {
    set((s) => {
      // 递归收集所有子文件夹 ID
      const allIds = new Set<string>()
      const collect = (parentId: string) => {
        allIds.add(parentId)
        s.customFolders.filter((f) => f.parentId === parentId).forEach((f) => collect(f.id))
      }
      collect(id)
      // 收集需要删除的文件 ID（用于后端持久化）
      const filesToDelete = s.canvasFiles.filter((f) => f.folderId && allIds.has(f.folderId))
      // 异步删除后端数据
      for (const file of filesToDelete) {
        deleteCanvasFileAPI(file.id)
      }
      // 删除文件夹，同时删除归属于这些文件夹的文件
      return {
        customFolders: s.customFolders.filter((f) => !allIds.has(f.id)),
        canvasFiles: s.canvasFiles.filter((f) => !(f.folderId && allIds.has(f.folderId))),
      }
    })
  },

  moveFileToFolder: (fileId: string, folderId: string | undefined) => {
    set((s) => ({
      canvasFiles: s.canvasFiles.map((f) =>
        f.id === fileId ? { ...f, folderId, updatedAt: Date.now() } : f
      ),
    }))
    const file = get().canvasFiles.find((f) => f.id === fileId)
    if (file) updateCanvasFileAPI(fileId, canvasFileToPayload(file))
  },

  moveFolderToFolder: (folderId: string, targetParentId: string | undefined) => {
    // 防止把文件夹拖到自身或自身的后代中
    const isDescendant = (parentId: string, childId: string): boolean => {
      if (parentId === childId) return true
      const children = get().customFolders.filter((f) => f.parentId === parentId)
      return children.some((c) => isDescendant(c.id, childId))
    }
    if (targetParentId && isDescendant(folderId, targetParentId)) return
    set((s) => ({
      customFolders: s.customFolders.map((f) =>
        f.id === folderId ? { ...f, parentId: targetParentId ?? null } : f
      ),
    }))
  },
}))

// 监听其他标签页的同步消息
canvasChannel?.addEventListener('message', (event) => {
  const { type, id, name } = event.data
  if (type === 'rename' && id && name) {
    useCanvasStore.setState((state) => ({
      canvasFiles: state.canvasFiles.map((f) =>
        f.id === id ? { ...f, name, updatedAt: Date.now() } : f
      ),
    }))
  }
})
