import { useWorkspaceStore } from '../../store/workspaceStore'
import FileTree from './FileTree'

export default function SidePanel() {
  const { activeSidePanel } = useWorkspaceStore()

  if (!activeSidePanel) return null

  return (
    <div className="side-panel">
      {/* 面板内容 */}
      <div className="flex-1 overflow-hidden">
        {activeSidePanel === 'files' && <FileTree />}
      </div>
    </div>
  )
}
