import { Type, Image, Video, Music, Upload, Table2, FileText } from 'lucide-react'
import type { CanvasNodeType } from '../../../store/types'

// ========== 模型选项 ==========
export const IMAGE_MODELS = [
  { id: 'flux-1', name: 'FLUX.1 Pro', desc: '高质量图片' },
  { id: 'sd-xl', name: 'SDXL Turbo', desc: '快速生成' },
  { id: 'midjourney', name: 'MJ Style', desc: '艺术风格' },
]
export const VIDEO_MODELS = [
  { id: 'kling-3', name: 'Kling 3.0 Omni', desc: '高质量视频' },
  { id: 'runway-gen3', name: 'Runway Gen-3', desc: '电影级' },
  { id: 'pika-2', name: 'Pika 2.0', desc: '快速生成' },
]
export const ASPECT_RATIOS = ['1:1', '9:16', '16:9', '4:3', '3:4', '自适应']
export const VIDEO_DURATIONS = ['4s', '6s', '8s', '10s']

// ========== 节点默认配置 ==========
export const NODE_DEFAULTS: Record<CanvasNodeType, {
  w: number; h: number; color: string; portColor: string; hasInput: boolean; hasOutput: boolean
}> = {
  text:     { w: 260, h: 160, color: '#3b82f6', portColor: '#60a5fa', hasInput: false, hasOutput: true },
  image:    { w: 280, h: 240, color: '#8b5cf6', portColor: '#a78bfa', hasInput: true,  hasOutput: true },
  video:    { w: 300, h: 260, color: '#ec4899', portColor: '#f472b6', hasInput: true,  hasOutput: true },
  audio:    { w: 260, h: 160, color: '#f59e0b', portColor: '#fbbf24', hasInput: true,  hasOutput: true },
  upload:   { w: 240, h: 200, color: '#10b981', portColor: '#34d399', hasInput: false, hasOutput: true },
  table:    { w: 420, h: 320, color: '#06b6d4', portColor: '#22d3ee', hasInput: true,  hasOutput: true },
  document: { w: 340, h: 280, color: '#f59e0b', portColor: '#fbbf24', hasInput: true,  hasOutput: true },
}

// ========== 端口常量 ==========
export const PORT_RADIUS = 6
export const PORT_HIT_RADIUS = 14

// ========== 添加节点菜单项 ==========
export const ADD_NODE_ITEMS: {
  type: CanvasNodeType; icon: React.ElementType; label: string; desc: string; shortcut?: string
}[] = [
  { type: 'text',     icon: Type,     label: '文本',     desc: '脚本、提示词、描述',      shortcut: 'T' },
  { type: 'image',    icon: Image,    label: '图片生成', desc: 'AI 文生图 / 图生图',      shortcut: 'I' },
  { type: 'video',    icon: Video,    label: '视频生成', desc: 'AI 图生视频 / 文生视频',  shortcut: 'V' },
  { type: 'audio',    icon: Music,    label: '音频',     desc: '配音、背景音乐',          shortcut: 'A' },
  { type: 'table',    icon: Table2,   label: '表格',     desc: 'Excel / CSV 数据表格' },
  { type: 'document', icon: FileText, label: '文档',     desc: 'Word / Markdown 文档' },
  { type: 'upload',   icon: Upload,   label: '素材上传', desc: '上传图片/视频/音频' },
]

// ========== 节点类型图标映射 ==========
export const NODE_ICONS: Record<CanvasNodeType, React.ElementType> = {
  text: Type,
  image: Image,
  video: Video,
  audio: Music,
  upload: Upload,
  table: Table2,
  document: FileText,
}

// ========== 辅助函数 ==========
export function getPortPos(node: { x: number; y: number; width: number; height: number }, direction: 'input' | 'output') {
  return {
    x: direction === 'input' ? node.x : node.x + node.width,
    y: node.y + node.height / 2,
  }
}

export function distance(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
}

export function bezierPath(x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.abs(x2 - x1)
  const offset = Math.max(50, dx * 0.4)
  return `M ${x1} ${y1} C ${x1 + offset} ${y1}, ${x2 - offset} ${y2}, ${x2} ${y2}`
}
