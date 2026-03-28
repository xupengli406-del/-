import { Panel, Group, Separator } from 'react-resizable-panels'
import { Menu, FolderOpen } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import SidePanel from './SidePanel'
import PaneContainer from './PaneContainer'

export default function WorkspaceShell() {
  const { paneLayout, activeSidePanel, setActiveSidePanel, toggleSidePanel } = useWorkspaceStore()

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* 始终可见的 Ribbon 竖条 */}
        <nav className="w-11 flex flex-col items-center border-r border-ds-outline-variant/10 flex-shrink-0">
          <div className="h-10 flex items-end justify-center flex-shrink-0">
            <button
              onClick={() => toggleSidePanel('files')}
              className="w-8 h-8 flex items-center justify-center rounded text-ds-on-surface-variant hover:text-ds-on-surface hover:bg-ds-surface-container-high transition-colors"
              title={activeSidePanel ? '收起侧边栏' : '展开侧边栏'}
            >
              <Menu size={18} strokeWidth={1.5} />
            </button>
          </div>
          <button
            onClick={() => { if (!activeSidePanel) setActiveSidePanel('files') }}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors mt-1 ${
              activeSidePanel ? 'text-brand' : 'text-ds-on-surface-variant hover:text-brand'
            }`}
            title="文件"
          >
            <FolderOpen size={18} strokeWidth={1.5} fill={activeSidePanel ? '#4670FE' : 'none'} />
          </button>
          <div className="flex-grow" />
        </nav>

        {/* 侧边栏 + 主内容 */}
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
              <div className="flex flex-col h-full overflow-hidden bg-white">
                <PaneContainer node={paneLayout} isRoot />
              </div>
            </Panel>
          </Group>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <PaneContainer node={paneLayout} isRoot />
          </div>
        )}
      </div>
    </div>
  )
}
