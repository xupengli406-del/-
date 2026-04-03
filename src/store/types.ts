// ===== 类型定义（画布/分镜系统已移除，仅保留文件管理+生成+版本+对话） =====

// 对话生成模式（仅保留图片和视频）
export type GenerateMode = 'image' | 'video'

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

// 画布文件项目类型（仅保留 image 和 video）
export type CanvasFileProjectType = 'image' | 'video'

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
  // 项目类型
  projectType?: CanvasFileProjectType
  // 所属自定义文件夹 ID（undefined 表示不在任何自定义文件夹中）
  folderId?: string
  mediaState?: CanvasFileMediaState
  aiSession?: CanvasFileAISession
  // 画布快照数据（保留字段以兼容已持久化的旧数据）
  snapshot: {
    nodes: any[]
    edges: any[]
  }
  // 缩略图
  thumbnailUrl: string
  nodeCount: number
  edgeCount: number
  createdAt: number
  updatedAt: number
}
