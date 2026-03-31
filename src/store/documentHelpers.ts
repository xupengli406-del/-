import {
  FileText,
  Image,
  Video,
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
  imageGeneration: Image,
  videoGeneration: Video,
  welcome: FileText,
}

export function getDocumentIcon(docId: DocumentId): LucideIcon {
  return iconMap[docId.type] || FileText
}

type CanvasStoreState = ReturnType<typeof useCanvasStore.getState>

export function getDocumentLabel(docId: DocumentId, state: CanvasStoreState): string {
  switch (docId.type) {
    case 'welcome':
      return '新标签页'
    case 'imageGeneration': {
      const file = state.canvasFiles.find((f) => f.id === docId.id)
      return file?.name || '分镜图片生成'
    }
    case 'videoGeneration': {
      const file = state.canvasFiles.find((f) => f.id === docId.id)
      return file?.name || '视频生成'
    }
    default:
      return '文档'
  }
}
