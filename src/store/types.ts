// ===== 类型定义（项目文件管理 + AI 生成 + 版本 + 对话） =====

// 对话生成模式（仅保留图片和视频）
export type GenerateMode = 'image' | 'video'

// 对话消息
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  mode: GenerateMode
  content: string
  resultUrl?: string
  /** 组图模式：多张结果图 URL */
  resultUrls?: string[]
  resultText?: string
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

// 对话引用（参考图添加到对话时使用）
export interface ChatReference {
  nodeId: string
  nodeType: string
  previewUrl?: string
  previewText?: string
  label?: string
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

// 项目文件类型
export type ProjectFileType = 'image' | 'video'

/** 单个图片/视频文件的生成版本 */
export interface ProjectFileMediaVersion {
  id: string
  url: string
  prompt: string
  createdAt: number
  model?: string
}

export interface ProjectFileMediaState {
  versions: ProjectFileMediaVersion[]
  selectedVersionId: string | null
}

export interface ProjectFileAISession {
  messages: ChatMessage[]
}

// 自定义文件夹
export interface CustomFolder {
  id: string
  name: string
  parentId?: string | null  // 父文件夹 ID，null 或 undefined 表示顶层
}

export interface ProjectFile {
  id: string
  name: string
  projectType?: ProjectFileType
  /** 所属自定义文件夹 ID */
  folderId?: string
  mediaState?: ProjectFileMediaState
  aiSession?: ProjectFileAISession
  thumbnailUrl: string
  createdAt: number
  updatedAt: number
}

// ===== 向后兼容别名（避免一次性改动太多外部引用） =====
/** @deprecated 使用 ProjectFileType */
export type CanvasFileProjectType = ProjectFileType
/** @deprecated 使用 ProjectFileMediaVersion */
export type CanvasFileMediaVersion = ProjectFileMediaVersion
/** @deprecated 使用 ProjectFileMediaState */
export type CanvasFileMediaState = ProjectFileMediaState
/** @deprecated 使用 ProjectFileAISession */
export type CanvasFileAISession = ProjectFileAISession
/** @deprecated 使用 ProjectFile */
export type CanvasFile = ProjectFile

// ===== 账户余额相关类型 =====

export interface BalanceInfo {
  total: number        // 总余额(元)
  subscription: number // 订阅赠送余额
  recharged: number    // 充值余额
  gifted: number       // 赠送余额
}

export type BalanceRecordType = 'consume' | 'acquire'

export interface BalanceRecord {
  id: string
  type: BalanceRecordType
  event: string
  amount: number       // 正=获取(元)，负=消耗(元)
  timestamp: number
  model?: string
}

// ===== 存储空间相关类型 =====

export interface StorageQuota {
  used: number         // 已用字节数
  total: number        // 总配额字节数
  breakdown: {
    images: number
    videos: number
    uploads: number
  }
}

export interface StorageAsset {
  id: string
  name: string
  type: 'image' | 'video' | 'upload'
  size: number         // 字节数
  url: string
  thumbnailUrl?: string
  createdAt: number
}
