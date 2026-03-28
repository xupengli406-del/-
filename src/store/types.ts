// ===== MVP v0.1 类型定义 =====

// 画布节点类型
export type CanvasNodeType =
  // 方案A 新节点类型
  | 'scriptNode'
  | 'characterNode'
  | 'sceneNode'
  | 'storyboardFrameNode'
  | 'mediaNode'
  // 旧类型（向后兼容，迁移后移除）
  | 'text' | 'image' | 'video' | 'audio' | 'storyboardFrame'

// 编辑器类型
export type EditorType = 'script' | 'character' | 'scene' | 'storyboardFrame' | 'media'

// 编辑器状态
export interface EditorState {
  type: EditorType | null
  nodeId: string | null
}

// 对话生成模式
export type GenerateMode = 'script' | 'image' | 'video' | 'audio'

// 对话消息
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  mode: GenerateMode
  content: string
  resultUrl?: string
  resultText?: string
  resultNodeIds?: string[]
  references?: ChatReference[]
  /** 本地上传/解析后的参考图 URL（传给模型） */
  referenceImageUrls?: string[]
  /** 视频参考模式（与 VIDEO_REFERENCE_OPTIONS 一致） */
  referenceMode?: 'all' | 'first' | 'both'
  /** 与 referenceImageUrls 一一对应的展示标签 */
  referenceThumbLabels?: string[]
  status: 'sending' | 'generating' | 'completed' | 'failed'
  errorMessage?: string
  createdAt: number
}

// 画布节点引用（添加到对话时使用）
export interface ChatReference {
  nodeId: string
  nodeType: string
  previewUrl?: string
  previewText?: string
  label?: string
}

// 素材库文件分类
export type AssetCategory = 'canvas' | 'node'

// 节点生成状态
export type GenerationStatus = 'idle' | 'generating' | 'completed' | 'failed'

// 文本节点数据（富文本编辑）
export interface TextNodeData {
  [key: string]: unknown
  label: string
  text: string
  // 文本生成相关
  prompt: string
  generatedText: string
  status: GenerationStatus
  errorMessage?: string
  // 富文本格式
  formatting?: {
    heading?: 'h1' | 'h2' | 'h3' | 'p'
    bold?: boolean
    italic?: boolean
    listType?: 'ul' | 'ol' | null
  }
  // 模型选择
  selectedModel?: string
}

// 图片节点数据
export interface ImageNodeData {
  [key: string]: unknown
  label: string
  imageUrl: string
  prompt: string
  status: GenerationStatus
  errorMessage?: string
  // 模型选择
  selectedModel?: string
  // 画质设置
  quality?: 'auto' | 'high' | 'standard'
  // 宽高比
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '2:3' | '3:2' | '7:4' | '4:7'
  // 生成数量
  batchSize?: number
  // 参考图
  referenceImageUrl?: string
}

// 视频节点数据
export interface VideoNodeData {
  [key: string]: unknown
  label: string
  videoUrl: string
  prompt: string
  status: GenerationStatus
  errorMessage?: string
  selectedModel?: string
}

// 音频节点数据
export interface AudioNodeData {
  [key: string]: unknown
  label: string
  audioUrl: string
  prompt: string
  status: GenerationStatus
  errorMessage?: string
  selectedModel?: string
}

// 分镜版本（同一格的不同生成结果）
export interface StoryboardVersion {
  id: string
  imageUrl: string
  prompt: string
  createdAt: number
}

// 分镜格节点数据
export interface StoryboardFrameNodeData {
  [key: string]: unknown
  label: string
  index: number
  dialogue: string
  description: string
  shot: string
  characterIds: string[]
  sceneId: string | null
  versions: StoryboardVersion[]
  selectedVersionId: string | null
  status: GenerationStatus
}

// 角色上下文
export interface CharacterContext {
  id: string
  name: string
  description: string
  referenceImageUrl: string
  tags: string[]
  createdAt: number
}

// 场景上下文
export interface SceneContext {
  id: string
  name: string
  description: string
  referenceImageUrl: string
  createdAt: number
}

// 分镜脚本导入格式
export interface StoryboardImportData {
  title: string
  frames: {
    index: number
    dialogue: string
    characters: string[]
    scene: string
    shot: string
    description: string
  }[]
  characters: {
    name: string
    description: string
    referenceImageUrl?: string
    tags?: string[]
  }[]
  scenes: {
    name: string
    description: string
    referenceImageUrl?: string
  }[]
}

// ===== 方案A 新节点数据类型 =====

// 剧本节点数据
export interface ScriptNodeData {
  [key: string]: unknown
  label: string
  title: string
  synopsis: string       // 摘要预览（自动截取前100字）
  content: string        // 完整内容
  status: GenerationStatus
}

// 角色节点数据（关联 CharacterContext）
export interface CharacterNodeData {
  [key: string]: unknown
  label: string
  characterId: string    // 关联到 CharacterContext.id
  name: string
  avatarUrl: string
  tags: string[]
  status: GenerationStatus
}

// 场景节点数据（关联 SceneContext）
export interface SceneNodeData {
  [key: string]: unknown
  label: string
  sceneId: string        // 关联到 SceneContext.id
  name: string
  thumbnailUrl: string
  description: string
  status: GenerationStatus
}

// 统一素材节点数据（替代 Text/Image/Video/Audio 节点）
export interface MediaNodeData {
  [key: string]: unknown
  label: string
  mediaType: 'image' | 'video' | 'audio' | 'text'
  url: string
  textContent?: string
  name: string
  prompt?: string
  status: GenerationStatus
}

// 节点数据联合类型
export type AppNodeData =
  | ScriptNodeData
  | CharacterNodeData
  | SceneNodeData
  | StoryboardFrameNodeData
  | MediaNodeData
  // 旧类型兼容
  | TextNodeData | ImageNodeData | VideoNodeData | AudioNodeData

// 素材项
export interface AssetItem {
  id: string
  name: string
  url: string
  type: 'image' | 'video' | 'text' | 'audio'
  createdAt: number
  // 来源标识
  source: 'generate' | 'upload' | 'canvas'
  // 文本类型的内容存储
  textContent?: string
  // 遗留兼容（画布内部节点关联，不再用于资产-节点双向链接）
  nodeId?: string
  nodeType?: 'textNode' | 'imageNode' | 'videoNode' | 'audioNode'
}

// 模型信息（从后端 /model/list 获取）
export interface ModelInfo {
  id: string
  name: string
  ability: 'text2img' | 'text2video' | 'chat_completion'
  provider: string
  description: string
  weight: number
  costRate: number
}

// 资产排序方式
export type AssetSortBy = 'createdAt' | 'name' | 'type'
export type AssetSortOrder = 'asc' | 'desc'

// 资产视图模式
export type AssetViewMode = 'grid' | 'list'

// 画布文件（保存画布上所有节点和连线的快照）
export type CanvasFileProjectType = 'canvas' | 'script' | 'image' | 'video' | 'audio'

/** 单个图片/视频文件的生成版本 */
export interface CanvasFileMediaVersion {
  id: string
  url: string
  prompt: string
  createdAt: number
  model?: string
}

export interface CanvasFileMediaState {
  versions: CanvasFileMediaVersion[]
  selectedVersionId: string | null
}

export interface CanvasFileAISession {
  messages: ChatMessage[]
}

// 自定义文件夹
export interface CustomFolder {
  id: string
  name: string
  parentId?: string | null  // 父文件夹 ID，null 或 undefined 表示顶层
}

export interface CanvasFile {
  id: string
  name: string
  // 项目类型：canvas=自由画布, script=故事脚本, ai=AI生成(图片/视频/音频)
  projectType?: CanvasFileProjectType
  // 所属自定义文件夹 ID（undefined 表示不在任何自定义文件夹中）
  folderId?: string
  mediaState?: CanvasFileMediaState
  aiSession?: CanvasFileAISession
  // 画布快照数据
  snapshot: {
    nodes: import('@xyflow/react').Node[]
    edges: import('@xyflow/react').Edge[]
    characters?: CharacterContext[]
    scenes?: SceneContext[]
  }
  // 缩略图（取画布中第一张图片节点的 url，或空）
  thumbnailUrl: string
  nodeCount: number
  edgeCount: number
  createdAt: number
  updatedAt: number
}
