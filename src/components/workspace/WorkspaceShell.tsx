import { Panel, Group, Separator } from 'react-resizable-panels'
import { Menu } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import SidePanel from './SidePanel'
import PaneContainer from './PaneContainer'

export default function WorkspaceShell() {
  const { paneLayout, activeSidePanel, setActiveSidePanel } = useWorkspaceStore()

  return (
    <div className="flex flex-col h-screen bg-ds-surface overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {activeSidePanel ? (
          <Group orientation="horizontal" id="workspace-main">
            <Panel
              id="sidebar"
              defaultSize="220px"
              minSize="160px"
              maxSize="400px"
            >
              <SidePanel />
            </Panel>
            <Separator>
              <div className="w-[1px] h-full bg-ds-surface-container-high/60 hover:bg-brand/20 transition-colors" />
            </Separator>
            <Panel id="main" minSize="40%">
              <PaneContainer node={paneLayout} isRoot />
            </Panel>
          </Group>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* 侧边栏折叠时：悬浮展开按钮 */}
            <button
              onClick={() => setActiveSidePanel('files')}
              className="absolute top-2 left-2 z-30 w-8 h-8 flex items-center justify-center rounded-ds glass-nav text-ds-on-surface-variant hover:text-ds-on-surface transition-colors shadow-ambient"
              title="展开侧边栏"
            >
              <Menu size={16} strokeWidth={1.5} />
            </button>
            <PaneContainer node={paneLayout} isRoot />
          </div>
        )}
      </div>
    </div>
  )
}
