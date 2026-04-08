import { create } from 'zustand'
import type { ProjectFile, ProjectFileMediaVersion, CustomFolder, ChatMessage, ModelInfo } from './types'
import {
  fetchProjectFiles,
  fetchGenerateHistory,
  saveGenerateHistoryAPI,
  createProjectFileAPI,
  updateProjectFileAPI,
  deleteProjectFileAPI,
  projectFileToPayload,
} from '../services/persistence'
import type { GenerateHistoryPayload } from '../services/persistence'
import { authenticate, listModels } from '../services/imageGeneration'

// 跨标签页同步通道
const syncChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('project_sync')
  : null

function canonicalMediaUrlFromFile(file: ProjectFile | undefined): string | null {
  const ms = file?.mediaState
  if (!ms?.selectedVersionId) return null
  return ms.versions.find((v) => v.id === ms.selectedVersionId)?.url ?? null
}

interface ProjectStore {
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

  // 项目文件
  projectFiles: ProjectFile[]
  createProjectFile: (name?: string, projectType?: ProjectFile['projectType']) => string
  removeProjectFile: (id: string) => void
  renameProjectFile: (id: string, name: string) => void
  updateCurrentProjectFile: () => void

  // 清空当前对话
  clearChat: () => void

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

  // 自定义文件夹管理
  customFolders: CustomFolder[]
  addCustomFolder: (name: string, parentId?: string | null) => string
  renameCustomFolder: (id: string, name: string) => void
  removeCustomFolder: (id: string) => void
  moveFileToFolder: (fileId: string, folderId: string | undefined) => void
  moveFolderToFolder: (folderId: string, targetParentId: string | undefined) => void

  appendProjectFileMediaVersion: (
    fileId: string,
    payload: { url: string; prompt: string; model?: string }
  ) => void
  setProjectFileSelectedMediaVersion: (fileId: string, versionId: string | null) => void
  addProjectFileChatMessage: (fileId: string, message: ChatMessage) => void
  updateProjectFileChatMessage: (fileId: string, messageId: string, updates: Partial<ChatMessage>) => void
  getProjectFileCanonicalMediaUrl: (fileId: string) => string | null
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
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
  projectFiles: [],
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

  // ===== 项目文件管理 =====

  createProjectFile: (name, projectType) => {
    const { projectFiles } = get()
    const isDedicatedMedia = projectType === 'image' || projectType === 'video'
    const file: ProjectFile = {
      id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: name || `项目 ${projectFiles.length + 1}`,
      projectType,
      ...(isDedicatedMedia
        ? {
            mediaState: { versions: [], selectedVersionId: null },
            aiSession: { messages: [] },
          }
        : {}),
      thumbnailUrl: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    set({ projectFiles: [...projectFiles, file] })
    createProjectFileAPI(projectFileToPayload(file))
    return file.id
  },

  removeProjectFile: (id) => {
    set({ projectFiles: get().projectFiles.filter((f) => f.id !== id) })
    deleteProjectFileAPI(id)
  },

  renameProjectFile: (id, name) => {
    set({
      projectFiles: get().projectFiles.map((f) =>
        f.id === id ? { ...f, name, updatedAt: Date.now() } : f
      ),
    })
    syncChannel?.postMessage({ type: 'rename', id, name })
    const file = get().projectFiles.find((f) => f.id === id)
    if (file) {
      updateProjectFileAPI(id, projectFileToPayload(file))
    }
  },

  updateCurrentProjectFile: () => {
    const { editingProjectId, projectFiles } = get()
    if (!editingProjectId || editingProjectId === '__new__') return
    const prevFile = projectFiles.find((f) => f.id === editingProjectId)
    const thumbCanonical = canonicalMediaUrlFromFile(prevFile)
    const thumbnailUrl =
      (typeof thumbCanonical === 'string' && thumbCanonical) ||
      prevFile?.thumbnailUrl ||
      ''
    const updatedFiles = projectFiles.map((f) =>
      f.id === editingProjectId
        ? {
            ...f,
            thumbnailUrl,
            updatedAt: Date.now(),
          }
        : f
    )
    set({ projectFiles: updatedFiles })
    const updated = updatedFiles.find((f) => f.id === editingProjectId)
    if (updated) {
      updateProjectFileAPI(editingProjectId, projectFileToPayload(updated))
    }
  },

  appendProjectFileMediaVersion: (fileId, payload) => {
    const versionId = `ver_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const version: ProjectFileMediaVersion = {
      id: versionId,
      url: payload.url,
      prompt: payload.prompt,
      createdAt: Date.now(),
      model: payload.model,
    }
    set((s) => ({
      projectFiles: s.projectFiles.map((f) => {
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
    const file = get().projectFiles.find((x) => x.id === fileId)
    if (file) updateProjectFileAPI(fileId, projectFileToPayload(file))
  },

  setProjectFileSelectedMediaVersion: (fileId, versionId) => {
    set((s) => ({
      projectFiles: s.projectFiles.map((f) => {
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
    const file = get().projectFiles.find((x) => x.id === fileId)
    if (file) updateProjectFileAPI(fileId, projectFileToPayload(file))
  },

  addProjectFileChatMessage: (fileId, message) => {
    set((s) => ({
      projectFiles: s.projectFiles.map((f) => {
        if (f.id !== fileId) return f
        const messages = f.aiSession?.messages ?? []
        return {
          ...f,
          aiSession: { messages: [...messages, message] },
          updatedAt: Date.now(),
        }
      }),
    }))
    const file = get().projectFiles.find((x) => x.id === fileId)
    if (file) updateProjectFileAPI(fileId, projectFileToPayload(file))
  },

  updateProjectFileChatMessage: (fileId, messageId, updates) => {
    set((s) => ({
      projectFiles: s.projectFiles.map((f) => {
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
    const file = get().projectFiles.find((x) => x.id === fileId)
    if (file) updateProjectFileAPI(fileId, projectFileToPayload(file))
  },

  getProjectFileCanonicalMediaUrl: (fileId) => {
    const f = get().projectFiles.find((x) => x.id === fileId)
    return canonicalMediaUrlFromFile(f)
  },

  clearChat: () => {
    set({ chatMessages: [] })
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
    const updated = get().generateHistory.filter((h) => h.id !== id)
    set({ generateHistory: updated })
    saveGenerateHistoryAPI(updated)
  },

  // ===== 初始化（从后端加载持久化数据） =====

  initializeFromBackend: async () => {
    await get().authenticateAndLoadModels()

    const [projectFiles, generateHistory] = await Promise.all([
      fetchProjectFiles(),
      fetchGenerateHistory(),
    ])
    set({
      projectFiles: projectFiles.map((f) => ({
        id: f.id,
        name: f.name,
        projectType: f.projectType as ProjectFile['projectType'],
        folderId: f.folderId,
        mediaState: f.mediaState,
        aiSession: f.aiSession,
        thumbnailUrl: f.thumbnailUrl,
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
      const allIds = new Set<string>()
      const collect = (parentId: string) => {
        allIds.add(parentId)
        s.customFolders.filter((f) => f.parentId === parentId).forEach((f) => collect(f.id))
      }
      collect(id)
      const filesToDelete = s.projectFiles.filter((f) => f.folderId && allIds.has(f.folderId))
      for (const file of filesToDelete) {
        deleteProjectFileAPI(file.id)
      }
      return {
        customFolders: s.customFolders.filter((f) => !allIds.has(f.id)),
        projectFiles: s.projectFiles.filter((f) => !(f.folderId && allIds.has(f.folderId))),
      }
    })
  },

  moveFileToFolder: (fileId: string, folderId: string | undefined) => {
    set((s) => ({
      projectFiles: s.projectFiles.map((f) =>
        f.id === fileId ? { ...f, folderId, updatedAt: Date.now() } : f
      ),
    }))
    const file = get().projectFiles.find((f) => f.id === fileId)
    if (file) updateProjectFileAPI(fileId, projectFileToPayload(file))
  },

  moveFolderToFolder: (folderId: string, targetParentId: string | undefined) => {
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
syncChannel?.addEventListener('message', (event) => {
  const { type, id, name } = event.data
  if (type === 'rename' && id && name) {
    useProjectStore.setState((state) => ({
      projectFiles: state.projectFiles.map((f) =>
        f.id === id ? { ...f, name, updatedAt: Date.now() } : f
      ),
    }))
  }
})

// ===== 向后兼容别名 =====
/** @deprecated 使用 useProjectStore */
export const useCanvasStore = useProjectStore
