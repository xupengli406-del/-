import { create } from 'zustand'
import {
  type Node,
  type Edge,
  type OnNodesChange,
  applyNodeChanges,
  type NodeChange,
} from '@xyflow/react'
import type { TextNodeData, ImageNodeData, VideoNodeData, AudioNodeData, StoryboardFrameNodeData, StoryboardVersion, CharacterContext, SceneContext, StoryboardImportData, AssetItem, CanvasFile, CanvasFileMediaVersion, CustomFolder, ChatMessage, ChatReference, ModelInfo, AssetSortBy, AssetSortOrder, AssetViewMode, ScriptNodeData, CharacterNodeData, SceneNodeData, MediaNodeData } from './types'
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

let nodeIdCounter = 0
const genNodeId = () => `node_${++nodeIdCounter}_${Date.now()}`

function canonicalMediaUrlFromFile(file: CanvasFile | undefined): string | null {
  const ms = file?.mediaState
  if (!ms?.selectedVersionId) return null
  return ms.versions.find((v) => v.id === ms.selectedVersionId)?.url ?? null
}

// 节点类型 → 显示名称映射
const nodeTypeLabels: Record<string, string> = {
  // 方案A 新类型
  scriptNode: '剧本',
  characterNode: '角色',
  sceneNode: '场景',
  storyboardFrameNode: '分镜格',
  mediaNode: '素材',
  // 旧类型兼容
  textNode: '文本',
  imageNode: '图片',
  videoNode: '视频',
  audioNode: '音频',
}

// 自动布局常量
const LAYOUT_COLS = 4
const LAYOUT_NODE_W = 280
const LAYOUT_NODE_H = 320
const LAYOUT_GAP = 24

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

  // 节点（无连线）
  nodes: Node[]
  edges: Edge[]
  onNodesChange: OnNodesChange

  // 选中节点（单选兼容）
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void

  // 多选节点
  selectedNodeIds: string[]
  setSelectedNodeIds: (ids: string[]) => void

  // 对话消息
  chatMessages: ChatMessage[]
  addChatMessage: (message: ChatMessage) => void
  updateChatMessage: (id: string, updates: Partial<ChatMessage>) => void

  // 对话引用（"添加到对话"缓冲区）
  chatReferences: ChatReference[]
  addToConversation: (nodeIds: string[]) => void
  removeChatReference: (nodeId: string) => void
  clearChatReferences: () => void

  // 从对话生成结果添加展示节点（自动布局，不再创建关联资产）
  addDisplayNode: (type: 'textNode' | 'imageNode' | 'videoNode' | 'audioNode', content: {
    label?: string
    text?: string
    imageUrl?: string
    videoUrl?: string
    audioUrl?: string
  }) => string

  // 方案A 新节点创建方法
  addScriptNode: (data?: Partial<ScriptNodeData>) => string
  addCharacterNode: (characterId: string) => string
  addSceneNode: (sceneId: string) => string
  addMediaNode: (mediaType: MediaNodeData['mediaType'], content: {
    label?: string
    url?: string
    textContent?: string
    prompt?: string
  }) => string

  // 更新节点数据
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void

  // 删除节点
  deleteNode: (nodeId: string) => void
  deleteNodes: (nodeIds: string[]) => void

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
  exportNodeAsAsset: (nodeId: string) => void

  // 画布操作
  clearCanvas: () => void

  // 创作上下文（角色+场景）
  characters: CharacterContext[]
  scenes: SceneContext[]
  activeFrameId: string | null
  activeCharacterId: string | null
  activeSceneId: string | null

  // 角色管理
  addCharacter: (character: CharacterContext) => void
  updateCharacter: (id: string, updates: Partial<CharacterContext>) => void
  removeCharacter: (id: string) => void

  // 场景管理
  addScene: (scene: SceneContext) => void
  updateScene: (id: string, updates: Partial<SceneContext>) => void
  removeScene: (id: string) => void

  // 分镜格操作
  setActiveFrame: (id: string | null) => void
  setActiveCharacter: (id: string | null) => void
  setActiveScene: (id: string | null) => void
  addFrameVersion: (frameNodeId: string, version: StoryboardVersion) => void
  selectFrameVersion: (frameNodeId: string, versionId: string) => void

  // 分镜脚本导入
  importStoryboard: (data: StoryboardImportData) => void

  // 上下文自动组装
  getFrameContext: (frameNodeId: string) => {
    frame: StoryboardFrameNodeData | null
    characters: CharacterContext[]
    scene: SceneContext | null
  }

  // 生成页对话历史（持久化）
  generateHistory: GenerateHistoryPayload[]
  addGenerateHistoryItem: (item: GenerateHistoryPayload) => void
  updateGenerateHistoryItem: (id: string, updates: Partial<GenerateHistoryPayload>) => void
  removeGenerateHistoryItem: (id: string) => void

  // 初始化（从后端加载）
  initializeFromBackend: () => Promise<void>

  // AI 面板初始模式（WelcomeTab 设置，AIPane 消费后清空）
  initialAIMode: 'image' | 'video' | 'audio' | 'script' | null
  setInitialAIMode: (mode: 'image' | 'video' | 'audio' | 'script' | null) => void

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

  nodes: [],
  edges: [], // 始终为空，保留字段以兼容 React Flow
  selectedNodeId: null,
  selectedNodeIds: [],
  chatMessages: [],
  chatReferences: [],
  assets: [],
  canvasFiles: [],
  generateHistory: [],
  characters: [],
  scenes: [],
  activeFrameId: null,
  activeCharacterId: null,
  activeSceneId: null,

  onNodesChange: (changes: NodeChange[]) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) })
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),

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

  // ===== 添加到对话 =====

  addToConversation: (nodeIds) => {
    const { nodes, chatReferences } = get()
    const existingIds = new Set(chatReferences.map((r) => r.nodeId))
    const newRefs: ChatReference[] = []

    for (const nodeId of nodeIds) {
      if (existingIds.has(nodeId)) continue
      const node = nodes.find((n) => n.id === nodeId)
      if (!node) continue

      const ref: ChatReference = {
        nodeId: node.id,
        nodeType: node.type || 'textNode',
        label: (node.data as { label?: string }).label || nodeTypeLabels[node.type || 'textNode'],
      }

      if (node.type === 'imageNode') {
        ref.previewUrl = (node.data as ImageNodeData).imageUrl
      } else if (node.type === 'videoNode') {
        ref.previewUrl = (node.data as VideoNodeData).videoUrl
      } else if (node.type === 'textNode') {
        ref.previewText = (node.data as TextNodeData).text?.slice(0, 50)
      } else if (node.type === 'audioNode') {
        ref.previewUrl = (node.data as AudioNodeData).audioUrl
      } else if (node.type === 'storyboardFrameNode') {
        const frameData = node.data as StoryboardFrameNodeData
        ref.previewText = frameData.dialogue?.slice(0, 50)
        const selectedVer = frameData.versions.find((v) => v.id === frameData.selectedVersionId)
        if (selectedVer?.imageUrl) ref.previewUrl = selectedVer.imageUrl
      } else if (node.type === 'mediaNode') {
        const mediaData = node.data as MediaNodeData
        if (mediaData.mediaType === 'text') {
          ref.previewText = mediaData.textContent?.slice(0, 50)
        } else {
          ref.previewUrl = mediaData.url
        }
      } else if (node.type === 'scriptNode') {
        ref.previewText = (node.data as ScriptNodeData).synopsis?.slice(0, 50)
      } else if (node.type === 'characterNode') {
        const charData = node.data as CharacterNodeData
        ref.previewUrl = charData.avatarUrl
        ref.previewText = charData.name
      } else if (node.type === 'sceneNode') {
        const sceneData = node.data as SceneNodeData
        ref.previewUrl = sceneData.thumbnailUrl
        ref.previewText = sceneData.name
      }

      newRefs.push(ref)
    }

    set({ chatReferences: [...chatReferences, ...newRefs] })
  },

  removeChatReference: (nodeId) => {
    set({ chatReferences: get().chatReferences.filter((r) => r.nodeId !== nodeId) })
  },

  clearChatReferences: () => set({ chatReferences: [] }),

  // ===== 展示节点（从画布对话生成结果创建，不再创建关联资产） =====

  addDisplayNode: (type, content) => {
    const id = genNodeId()
    const { nodes } = get()

    // 自动布局：计算下一个节点位置
    const count = nodes.length
    const col = count % LAYOUT_COLS
    const row = Math.floor(count / LAYOUT_COLS)
    const position = {
      x: col * (LAYOUT_NODE_W + LAYOUT_GAP),
      y: row * (LAYOUT_NODE_H + LAYOUT_GAP),
    }

    const label = content.label || nodeTypeLabels[type] || '节点'

    let nodeData: Record<string, unknown>
    switch (type) {
      case 'textNode':
        nodeData = {
          label,
          text: content.text || '',
          prompt: '',
          generatedText: content.text || '',
          status: content.text ? 'completed' : 'idle',
          selectedModel: '',
        }
        break
      case 'imageNode':
        nodeData = {
          label,
          imageUrl: content.imageUrl || '',
          prompt: '',
          status: content.imageUrl ? 'completed' : 'idle',
          selectedModel: '',
        }
        break
      case 'videoNode':
        nodeData = {
          label,
          videoUrl: content.videoUrl || '',
          prompt: '',
          status: content.videoUrl ? 'completed' : 'idle',
        }
        break
      case 'audioNode':
        nodeData = {
          label,
          audioUrl: content.audioUrl || '',
          prompt: '',
          status: content.audioUrl ? 'completed' : 'idle',
        }
        break
    }

    const newNode: Node = {
      id,
      type,
      position,
      data: nodeData,
    }

    // 画布生成的内容只留在画布中，不创建关联资产
    set({
      nodes: [...nodes, newNode],
    })

    return id
  },

  // ===== 方案A 新节点创建 =====

  addScriptNode: (data) => {
    const id = genNodeId()
    const { nodes } = get()
    const count = nodes.length
    const col = count % LAYOUT_COLS
    const row = Math.floor(count / LAYOUT_COLS)
    const position = {
      x: col * (LAYOUT_NODE_W + LAYOUT_GAP),
      y: row * (LAYOUT_NODE_H + LAYOUT_GAP),
    }
    const nodeData: ScriptNodeData = {
      label: data?.title || '新剧本',
      title: data?.title || '新剧本',
      synopsis: data?.synopsis || '',
      content: data?.content || '',
      status: data?.status || 'idle',
    }
    const newNode: Node = { id, type: 'scriptNode', position, data: nodeData }
    set({ nodes: [...nodes, newNode] })
    return id
  },

  addCharacterNode: (characterId) => {
    const id = genNodeId()
    const { nodes, characters } = get()
    const char = characters.find((c) => c.id === characterId)
    if (!char) return id

    const count = nodes.length
    const col = count % LAYOUT_COLS
    const row = Math.floor(count / LAYOUT_COLS)
    const position = {
      x: col * (LAYOUT_NODE_W + LAYOUT_GAP),
      y: row * (LAYOUT_NODE_H + LAYOUT_GAP),
    }
    const nodeData: CharacterNodeData = {
      label: char.name,
      characterId,
      name: char.name,
      avatarUrl: char.referenceImageUrl || '',
      tags: char.tags || [],
      status: 'idle',
    }
    const newNode: Node = { id, type: 'characterNode', position, data: nodeData }
    set({ nodes: [...nodes, newNode] })
    return id
  },

  addSceneNode: (sceneId) => {
    const id = genNodeId()
    const { nodes, scenes } = get()
    const scene = scenes.find((s) => s.id === sceneId)
    if (!scene) return id

    const count = nodes.length
    const col = count % LAYOUT_COLS
    const row = Math.floor(count / LAYOUT_COLS)
    const position = {
      x: col * (LAYOUT_NODE_W + LAYOUT_GAP),
      y: row * (LAYOUT_NODE_H + LAYOUT_GAP),
    }
    const nodeData: SceneNodeData = {
      label: scene.name,
      sceneId,
      name: scene.name,
      thumbnailUrl: scene.referenceImageUrl || '',
      description: scene.description || '',
      status: 'idle',
    }
    const newNode: Node = { id, type: 'sceneNode', position, data: nodeData }
    set({ nodes: [...nodes, newNode] })
    return id
  },

  addMediaNode: (mediaType, content) => {
    const id = genNodeId()
    const { nodes } = get()
    const count = nodes.length
    const col = count % LAYOUT_COLS
    const row = Math.floor(count / LAYOUT_COLS)
    const position = {
      x: col * (LAYOUT_NODE_W + LAYOUT_GAP),
      y: row * (LAYOUT_NODE_H + LAYOUT_GAP),
    }
    const mediaTypeLabels = { image: '图片', video: '视频', audio: '音频', text: '文本' }
    const nodeData: MediaNodeData = {
      label: content.label || mediaTypeLabels[mediaType] || '素材',
      mediaType,
      url: content.url || '',
      textContent: content.textContent,
      name: content.label || mediaTypeLabels[mediaType] || '素材',
      prompt: content.prompt,
      status: content.url || content.textContent ? 'completed' : 'idle',
    }
    const newNode: Node = { id, type: 'mediaNode', position, data: nodeData }
    set({ nodes: [...nodes, newNode] })
    return id
  },

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
    })
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
      selectedNodeIds: get().selectedNodeIds.filter((id) => id !== nodeId),
      chatReferences: get().chatReferences.filter((r) => r.nodeId !== nodeId),
    })
  },

  deleteNodes: (nodeIds) => {
    const idSet = new Set(nodeIds)
    set({
      nodes: get().nodes.filter((n) => !idSet.has(n.id)),
      selectedNodeId: get().selectedNodeId && idSet.has(get().selectedNodeId!) ? null : get().selectedNodeId,
      selectedNodeIds: [],
      chatReferences: get().chatReferences.filter((r) => !idSet.has(r.nodeId)),
    })
  },

  // ===== 素材库（仅主页生成+上传内容） =====

  addAsset: (asset) => {
    set({ assets: [...get().assets, asset] })
    // 持久化到后端
    createAssetAPI({
      id: asset.id,
      name: asset.name,
      url: asset.url,
      type: asset.type,
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
      type: asset.type,
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
    const { nodes, characters, scenes, canvasFiles } = get()
    // 缩略图：优先取 imageNode/mediaNode(image) 的图片
    const firstImage = nodes.find((n) =>
      (n.type === 'imageNode' && (n.data as ImageNodeData).imageUrl) ||
      (n.type === 'mediaNode' && (n.data as MediaNodeData).mediaType === 'image' && (n.data as MediaNodeData).url)
    )
    const thumbnailUrl = firstImage
      ? (firstImage.type === 'mediaNode' ? (firstImage.data as MediaNodeData).url : (firstImage.data as ImageNodeData).imageUrl)
      : ''
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
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: [],
        characters: JSON.parse(JSON.stringify(characters)),
        scenes: JSON.parse(JSON.stringify(scenes)),
      },
      thumbnailUrl,
      nodeCount: nodes.length,
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
    const snapshotNodes = JSON.parse(JSON.stringify(file.snapshot.nodes)) as Node[]

    // 迁移旧节点类型 → MediaNode
    const migratedNodes = snapshotNodes.map((node) => {
      if (node.type === 'textNode') {
        const d = node.data as TextNodeData
        return {
          ...node,
          type: 'mediaNode',
          data: {
            label: d.label || '文本',
            mediaType: 'text' as const,
            url: '',
            textContent: d.text || d.generatedText || '',
            name: d.label || '文本',
            prompt: d.prompt,
            status: d.status || 'idle',
          } satisfies MediaNodeData,
        }
      }
      if (node.type === 'imageNode') {
        const d = node.data as ImageNodeData
        return {
          ...node,
          type: 'mediaNode',
          data: {
            label: d.label || '图片',
            mediaType: 'image' as const,
            url: d.imageUrl || '',
            name: d.label || '图片',
            prompt: d.prompt,
            status: d.status || 'idle',
          } satisfies MediaNodeData,
        }
      }
      if (node.type === 'videoNode') {
        const d = node.data as VideoNodeData
        return {
          ...node,
          type: 'mediaNode',
          data: {
            label: d.label || '视频',
            mediaType: 'video' as const,
            url: d.videoUrl || '',
            name: d.label || '视频',
            prompt: d.prompt,
            status: d.status || 'idle',
          } satisfies MediaNodeData,
        }
      }
      if (node.type === 'audioNode') {
        const d = node.data as AudioNodeData
        return {
          ...node,
          type: 'mediaNode',
          data: {
            label: d.label || '音频',
            mediaType: 'audio' as const,
            url: d.audioUrl || '',
            name: d.label || '音频',
            prompt: d.prompt,
            status: d.status || 'idle',
          } satisfies MediaNodeData,
        }
      }
      return node
    })

    const snapshotCharacters = file.snapshot.characters
      ? JSON.parse(JSON.stringify(file.snapshot.characters)) as CharacterContext[]
      : []
    const snapshotScenes = file.snapshot.scenes
      ? JSON.parse(JSON.stringify(file.snapshot.scenes)) as SceneContext[]
      : []
    set({
      nodes: migratedNodes,
      edges: [],
      characters: snapshotCharacters,
      scenes: snapshotScenes,
      selectedNodeId: null,
      selectedNodeIds: [],
      activeFrameId: null,
      activeCharacterId: null,
      activeSceneId: null,
    })
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
    const { editingProjectId, nodes, characters, scenes, canvasFiles } = get()
    if (!editingProjectId || editingProjectId === '__new__') return
    const prevFile = canvasFiles.find((f) => f.id === editingProjectId)
    const firstImage = nodes.find((n) =>
      (n.type === 'imageNode' && (n.data as ImageNodeData).imageUrl) ||
      (n.type === 'mediaNode' && (n.data as MediaNodeData).mediaType === 'image' && (n.data as MediaNodeData).url)
    )
    const thumbnailFromNodes = firstImage
      ? (firstImage.type === 'mediaNode' ? (firstImage.data as MediaNodeData).url : (firstImage.data as ImageNodeData).imageUrl)
      : ''
    const thumbCanonical = canonicalMediaUrlFromFile(prevFile)
    const thumbnailUrl =
      (typeof thumbCanonical === 'string' && thumbCanonical) ||
      thumbnailFromNodes ||
      prevFile?.thumbnailUrl ||
      ''
    const updatedFiles = canvasFiles.map((f) =>
      f.id === editingProjectId
        ? {
            ...f,
            snapshot: {
              nodes: JSON.parse(JSON.stringify(nodes)),
              edges: [],
              characters: JSON.parse(JSON.stringify(characters)),
              scenes: JSON.parse(JSON.stringify(scenes)),
            },
            thumbnailUrl,
            nodeCount: nodes.length,
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

  exportNodeAsAsset: (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId)
    if (!node) return
    const nt = node.type || 'textNode'
    const assetType = (nt === 'textNode' ? 'text' : nt === 'imageNode' ? 'image' : nt === 'videoNode' ? 'video' : 'audio') as AssetItem['type']
    let url = ''
    let textContent: string | undefined
    if (node.type === 'imageNode') url = (node.data as ImageNodeData).imageUrl || ''
    if (node.type === 'videoNode') url = (node.data as VideoNodeData).videoUrl || ''
    if (node.type === 'audioNode') url = (node.data as AudioNodeData).audioUrl || ''
    if (node.type === 'textNode') textContent = (node.data as TextNodeData).text || ''
    const newAsset: AssetItem = {
      id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: (node.data as { label?: string }).label || nodeTypeLabels[nt] || '节点',
      url,
      type: assetType,
      source: 'generate',
      textContent,
      createdAt: Date.now(),
    }
    set({ assets: [...get().assets, newAsset] })
    createAssetAPI({
      id: newAsset.id,
      name: newAsset.name,
      url: newAsset.url,
      type: newAsset.type,
      source: newAsset.source,
      textContent: newAsset.textContent,
      createdAt: newAsset.createdAt,
    })
  },

  clearCanvas: () => {
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedNodeIds: [],
      activeFrameId: null,
      activeCharacterId: null,
      activeSceneId: null,
    })
  },

  // ===== 角色管理 =====

  addCharacter: (character) => {
    set({ characters: [...get().characters, character] })
  },

  updateCharacter: (id, updates) => {
    set({
      characters: get().characters.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })
  },

  removeCharacter: (id) => {
    set({ characters: get().characters.filter((c) => c.id !== id) })
  },

  // ===== 场景管理 =====

  addScene: (scene) => {
    set({ scenes: [...get().scenes, scene] })
  },

  updateScene: (id, updates) => {
    set({
      scenes: get().scenes.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })
  },

  removeScene: (id) => {
    set({ scenes: get().scenes.filter((s) => s.id !== id) })
  },

  // ===== 分镜格操作 =====

  setActiveFrame: (id) => set({ activeFrameId: id, activeCharacterId: null, activeSceneId: null }),

  setActiveCharacter: (id) => set({ activeCharacterId: id, activeFrameId: null, activeSceneId: null }),

  setActiveScene: (id) => set({ activeSceneId: id, activeFrameId: null, activeCharacterId: null }),

  addFrameVersion: (frameNodeId, version) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === frameNodeId && n.type === 'storyboardFrameNode'
          ? {
              ...n,
              data: {
                ...n.data,
                versions: [...(n.data as StoryboardFrameNodeData).versions, version],
                selectedVersionId: version.id,
                status: 'completed',
              },
            }
          : n
      ),
    })
  },

  selectFrameVersion: (frameNodeId, versionId) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === frameNodeId && n.type === 'storyboardFrameNode'
          ? { ...n, data: { ...n.data, selectedVersionId: versionId } }
          : n
      ),
    })
  },

  // ===== 分镜脚本导入 =====

  importStoryboard: (data) => {
    const { nodes } = get()

    // 创建角色
    const newCharacters: CharacterContext[] = (data.characters || []).map((c) => ({
      id: `char_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: c.name,
      description: c.description || '',
      referenceImageUrl: c.referenceImageUrl || '',
      tags: c.tags || [],
      createdAt: Date.now(),
    }))
    const charNameToId = new Map(newCharacters.map((c) => [c.name, c.id]))

    // 创建场景
    const newScenes: SceneContext[] = (data.scenes || []).map((s) => ({
      id: `scene_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: s.name,
      description: s.description || '',
      referenceImageUrl: s.referenceImageUrl || '',
      createdAt: Date.now(),
    }))
    const sceneNameToId = new Map(newScenes.map((s) => [s.name, s.id]))

    // 布局计算：角色节点在左列，场景节点在角色下方，分镜格在右侧
    const allNewNodes: Node[] = []
    let currentIndex = nodes.length

    // 创建角色节点
    newCharacters.forEach((char) => {
      const col = currentIndex % LAYOUT_COLS
      const row = Math.floor(currentIndex / LAYOUT_COLS)
      const charNodeData: CharacterNodeData = {
        label: char.name,
        characterId: char.id,
        name: char.name,
        avatarUrl: char.referenceImageUrl || '',
        tags: char.tags || [],
        status: 'idle',
      }
      allNewNodes.push({
        id: genNodeId(),
        type: 'characterNode',
        position: {
          x: col * (LAYOUT_NODE_W + LAYOUT_GAP),
          y: row * (LAYOUT_NODE_H + LAYOUT_GAP),
        },
        data: charNodeData,
      })
      currentIndex++
    })

    // 创建场景节点
    newScenes.forEach((scene) => {
      const col = currentIndex % LAYOUT_COLS
      const row = Math.floor(currentIndex / LAYOUT_COLS)
      const sceneNodeData: SceneNodeData = {
        label: scene.name,
        sceneId: scene.id,
        name: scene.name,
        thumbnailUrl: scene.referenceImageUrl || '',
        description: scene.description || '',
        status: 'idle',
      }
      allNewNodes.push({
        id: genNodeId(),
        type: 'sceneNode',
        position: {
          x: col * (LAYOUT_NODE_W + LAYOUT_GAP),
          y: row * (LAYOUT_NODE_H + LAYOUT_GAP),
        },
        data: sceneNodeData,
      })
      currentIndex++
    })

    // 创建分镜格节点
    ;(data.frames || []).forEach((frame) => {
      const col = currentIndex % LAYOUT_COLS
      const row = Math.floor(currentIndex / LAYOUT_COLS)

      const frameData: StoryboardFrameNodeData = {
        label: `第${frame.index}格`,
        index: frame.index,
        dialogue: frame.dialogue || '',
        description: frame.description || '',
        shot: frame.shot || '',
        characterIds: (frame.characters || [])
          .map((name) => charNameToId.get(name))
          .filter(Boolean) as string[],
        sceneId: frame.scene ? (sceneNameToId.get(frame.scene) || null) : null,
        versions: [],
        selectedVersionId: null,
        status: 'idle' as const,
      }

      allNewNodes.push({
        id: genNodeId(),
        type: 'storyboardFrameNode',
        position: {
          x: col * (LAYOUT_NODE_W + LAYOUT_GAP),
          y: row * (LAYOUT_NODE_H + LAYOUT_GAP),
        },
        data: frameData,
      })
      currentIndex++
    })

    set({
      nodes: [...nodes, ...allNewNodes],
      characters: [...get().characters, ...newCharacters],
      scenes: [...get().scenes, ...newScenes],
    })
  },

  // ===== 上下文自动组装 =====

  getFrameContext: (frameNodeId) => {
    const node = get().nodes.find((n) => n.id === frameNodeId)
    if (!node || node.type !== 'storyboardFrameNode') {
      return { frame: null, characters: [], scene: null }
    }
    const frameData = node.data as StoryboardFrameNodeData
    const chars = frameData.characterIds
      .map((cid) => get().characters.find((c) => c.id === cid))
      .filter(Boolean) as CharacterContext[]
    const scene = frameData.sceneId
      ? get().scenes.find((s) => s.id === frameData.sceneId) || null
      : null
    return { frame: frameData, characters: chars, scene }
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
        projectType: f.projectType,
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
