// 核心类型定义

// IP项目（第一层级）
export interface IPProject {
  id: string
  name: string
  description: string
  coverColor: string
  seasons: Season[]
  createdAt: Date
  updatedAt: Date
  status: 'active' | 'archived'
  teamId?: string
}

// 季
export interface Season {
  id: string
  name: string
  episodes: Episode[]
}

// 集
export interface Episode {
  id: string
  name: string
  scenes: Scene[]
  script?: string
  status: 'draft' | 'in_progress' | 'completed'
}

// 场景分镜
export interface Scene {
  id: string
  name: string
  frames: Frame[]
  description?: string
}

// 分镜帧
export interface Frame {
  id: string
  imageUrl?: string
  prompt?: string
  characters: string[]
  environment?: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
}

// 角色资产
export interface Character {
  id: string
  name: string
  description: string
  referenceImages: string[]
  prompt: string
  loraModel?: string
  tags: string[]
}

// 场景/环境资产
export interface Environment {
  id: string
  name: string
  description: string
  referenceImages: string[]
  prompt: string
  tags: string[]
}

// 道具资产
export interface Prop {
  id: string
  name: string
  description: string
  referenceImages: string[]
  prompt: string
  tags: string[]
}

// Excel sheet原始数据（用于中间栏表格预览）
export interface ExcelSheet {
  name: string
  data: (string | number | boolean | null)[][]
}

// 剧本/大纲
export interface Script {
  id: string
  name: string
  fileName: string
  content: string
  uploadedAt: Date
  wordCount: number
  // Excel原始表格数据（仅Excel上传时存在）
  excelSheets?: ExcelSheet[]
  // AI解析后的结构化数据
  parsedStructure?: ParsedScriptStructure
}

// AI解析后的剧本结构
export interface ParsedScriptStructure {
  chapters: ParsedChapter[]
  detectedCharacters: string[]
  detectedLocations: string[]
}

export interface ParsedChapter {
  id: string
  title: string
  scenes: ParsedScene[]
}

export interface ParsedScene {
  id: string
  title: string
  description: string
  location?: string
  characters?: string[]
  dialogue?: string
}

// 分镜（从剧本拆解出来的）
export interface Storyboard {
  id: string
  name: string
  sourceScriptId: string
  sourceText: string
  panels: StoryboardPanel[]
  createdAt: Date
}

// 分镜面板
export interface StoryboardPanel {
  id: string
  index: number
  description: string
  cameraAngle?: string
  emotion?: string
  characterIds: string[]
  environmentId?: string
  generatedPrompt?: string
  imageUrl?: string
  status: 'draft' | 'prompt_ready' | 'generating' | 'completed' | 'failed'
}

// ===== 节点画布系统 =====

// 画布节点类型
export type CanvasNodeType = 'text' | 'image' | 'video' | 'audio' | 'upload' | 'table' | 'document'

// 画布节点
export interface CanvasNode {
  id: string
  type: CanvasNodeType
  x: number
  y: number
  width: number
  height: number
  data: CanvasNodeData
}

// 节点数据（按类型不同）
export interface CanvasNodeData {
  // 通用
  label?: string
  // text 节点
  text?: string
  // image 节点
  imageUrl?: string
  imagePrompt?: string
  // video 节点
  videoUrl?: string
  videoPrompt?: string
  videoDuration?: number
  // audio 节点
  audioUrl?: string
  audioPrompt?: string
  // 上传节点
  uploadUrl?: string
  uploadType?: 'image' | 'video' | 'audio'
  // table 节点（Excel等表格数据）
  tableHeaders?: string[]
  tableRows?: (string | number | boolean | null)[][]
  selectedRowIndices?: number[]
  sheetName?: string
  // document 节点（Word/Markdown等文档）
  documentContent?: string
  documentFormat?: 'word' | 'markdown' | 'text'
  // 来源素材引用
  sourceAssetId?: string
  sourceAssetType?: 'script' | 'character' | 'environment' | 'storyboard'
  // 生成相关
  model?: string
  status?: 'idle' | 'generating' | 'completed' | 'failed'
  // 规格
  aspectRatio?: string
  resolution?: string
}

// 画布导入项
export interface CanvasImportItem {
  sourceType: 'script' | 'character' | 'environment' | 'storyboard'
  sourceId: string
  sourceName: string
}

// 节点之间的连接
export interface CanvasEdge {
  id: string
  sourceNodeId: string
  targetNodeId: string
}

// 单个画布的状态
export interface CanvasState {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

// 工作台Tab
export interface WorkTab {
  id: string
  type: 'episode' | 'script' | 'character' | 'environment' | 'storyboard' | 'frame' | 'storyboard_edit'
  title: string
  entityId: string
  isDirty: boolean
  canvas?: CanvasState
}

// 生成任务
export interface GenerationTask {
  id: string
  type: 'image' | 'video'
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  params: Record<string, any>
  result?: string
  error?: string
  createdAt: Date
}

// 版本历史
export interface Version {
  id: string
  name: string
  description?: string
  createdAt: Date
  snapshot: Record<string, any>
}

// AI生成参数
export interface GenerationParams {
  model: string
  width: number
  height: number
  steps: number
  seed?: number
  cfgScale: number
  sampler: string
}

// ===== AI Copilot 相关类型 =====

// AI工作模式
export type CopilotMode = 'chat' | 'action'

// 上下文引用类型
export interface ContextReference {
  id: string
  type: 'character' | 'environment' | 'episode' | 'scene' | 'frame' | 'prop' | 'script' | 'storyboard'
  name: string
  entityId: string
}

// 消息角色
export type MessageRole = 'user' | 'assistant' | 'system'

// 执行动作类型
export interface ActionDiff {
  id: string
  type: 'create' | 'update' | 'delete' | 'batch'
  targetType: 'frame' | 'scene' | 'character' | 'episode' | 'environment' | 'script' | 'storyboard'
  targetIds: string[]
  description: string
  previousState: Record<string, any>
  newState: Record<string, any>
  timestamp: Date
  canRevert: boolean
}

// AI消息
export interface CopilotMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  mode: CopilotMode
  references?: ContextReference[]
  action?: ActionDiff
  status?: 'pending' | 'streaming' | 'completed' | 'error'
}

// 当前选中的上下文
export interface ActiveContext {
  selectedTab?: WorkTab
  selectedAssets: ContextReference[]
  hoveredAsset?: ContextReference
}
