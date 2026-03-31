import type { DocumentId } from '../../store/workspaceTypes'
import WelcomeTab from './WelcomeTab'
import ImageGenerationPane from './panes/ImageGenerationPane'
import VideoGenerationPane from './panes/VideoGenerationPane'

interface DocumentRendererProps {
  docId: DocumentId
  paneId?: string
}

export default function DocumentRenderer({ docId, paneId }: DocumentRendererProps) {
  switch (docId.type) {
    case 'welcome':
      return <WelcomeTab paneId={paneId} />
    case 'imageGeneration':
      return <ImageGenerationPane fileId={docId.id} />
    case 'videoGeneration':
      return <VideoGenerationPane fileId={docId.id} />
    default:
      return (
        <div className="flex-1 flex items-center justify-center bg-white text-apple-text-tertiary">
          当前版本已移除该旧页面入口
        </div>
      )
  }
}
