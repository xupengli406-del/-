import {
  FileText,
  User,
  MapPin,
  Film,
  Image,
  Video,
  Music,
  Type,
  LayoutDashboard,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react'
import type { DocumentId, DocumentType } from './workspaceTypes'
import type { useCanvasStore } from './canvasStore'

let paneCounter = 0

export function generatePaneId(): string {
  return `pane_${++paneCounter}_${Date.now()}`
}

export function isDocIdEqual(a: DocumentId, b: DocumentId): boolean {
  return a.type === b.type && a.id === b.id
}

const iconMap: Record<DocumentType, LucideIcon> = {
  canvas: LayoutDashboard,
  script: FileText,
  character: User,
  scene: MapPin,
  storyboardFrame: Film,
  media: Image,
  ai: MessageSquare,
  welcome: FileText,
}

export function getDocumentIcon(docId: DocumentId): LucideIcon {
  if (docId.type === 'media') {
    // 可以根据 mediaType 细分，但需要 store 数据，这里返回通用图标
    return Image
  }
  return iconMap[docId.type] || FileText
}

// 根据 media 节点的 mediaType 返回更精确的图标
export function getMediaIcon(mediaType: string): LucideIcon {
  switch (mediaType) {
    case 'image': return Image
    case 'video': return Video
    case 'audio': return Music
    case 'text': return Type
    default: return Image
  }
}

type CanvasStoreState = ReturnType<typeof useCanvasStore.getState>

export function getDocumentLabel(docId: DocumentId, state: CanvasStoreState): string {
  switch (docId.type) {
    case 'welcome':
      return '新标签页'
    case 'ai': {
      const aiFile = state.canvasFiles.find((f) => f.id === docId.id)
      return aiFile?.name || 'AI 助手'
    }
    case 'canvas': {
      const file = state.canvasFiles.find((f) => f.id === docId.id)
      return file?.name || '未命名画布'
    }
    case 'script': {
      const node = state.nodes.find((n) => n.id === docId.id)
      const data = node?.data as Record<string, unknown> | undefined
      return (data?.title as string) || (data?.label as string) || '未命名剧本'
    }
    case 'character': {
      const char = state.characters.find((c) => c.id === docId.id)
      return char?.name || '未命名角色'
    }
    case 'scene': {
      const scene = state.scenes.find((s) => s.id === docId.id)
      return scene?.name || '未命名场景'
    }
    case 'storyboardFrame': {
      const node = state.nodes.find((n) => n.id === docId.id)
      const data = node?.data as Record<string, unknown> | undefined
      const index = data?.index as number | undefined
      return index ? `第${index}格` : '分镜格'
    }
    case 'media': {
      const node = state.nodes.find((n) => n.id === docId.id)
      const data = node?.data as Record<string, unknown> | undefined
      return (data?.name as string) || (data?.label as string) || '素材'
    }
    default:
      return '文档'
  }
}
