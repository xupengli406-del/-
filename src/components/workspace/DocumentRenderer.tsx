import type { DocumentId } from '../../store/workspaceTypes'
import WelcomeTab from './WelcomeTab'
import CanvasPane from './panes/CanvasPane'
import ScriptPane from './panes/ScriptPane'
import CharacterPane from './panes/CharacterPane'
import ScenePane from './panes/ScenePane'
import StoryboardFramePane from './panes/StoryboardFramePane'
import MediaPane from './panes/MediaPane'
import AIPane from './panes/AIPane'

interface DocumentRendererProps {
  docId: DocumentId
}

export default function DocumentRenderer({ docId }: DocumentRendererProps) {
  switch (docId.type) {
    case 'welcome':
      return <WelcomeTab />
    case 'canvas':
      return <CanvasPane canvasFileId={docId.id} />
    case 'script':
      return <ScriptPane nodeId={docId.id} />
    case 'character':
      return <CharacterPane nodeId={docId.id} />
    case 'scene':
      return <ScenePane nodeId={docId.id} />
    case 'storyboardFrame':
      return <StoryboardFramePane nodeId={docId.id} />
    case 'media':
      return <MediaPane nodeId={docId.id} />
    case 'ai':
      return <AIPane fileId={docId.id} />
    default:
      return (
        <div className="flex-1 flex items-center justify-center bg-white text-apple-text-tertiary">
          未知文档类型
        </div>
      )
  }
}
