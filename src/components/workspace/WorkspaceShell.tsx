import { Panel, Group, Separator } from 'react-resizable-panels'
import { useWorkspaceStore } from '../../store/workspaceStore'
import WorkspaceTitleBar from './WorkspaceTitleBar'
import Ribbon from './Ribbon'
import SidePanel from './SidePanel'
import PaneContainer from './PaneContainer'

export default function WorkspaceShell() {
  const { paneLayout, activeSidePanel } = useWorkspaceStore()

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <WorkspaceTitleBar />
      <div className="flex-1 flex overflow-hidden">
        {/* Ribbon — 始终可见，与 Obsidian 一致 */}
        <Ribbon />

        {/* Side Panel + Main Area */}
        {activeSidePanel ? (
          <Group orientation="horizontal" id="workspace-main">
            {/* 侧面板 */}
            <Panel
              id="sidebar"
              defaultSize="220px"
              minSize="160px"
              maxSize="400px"
            >
              <SidePanel />
            </Panel>
            <Separator>
              <div className="w-[1px] h-full bg-apple-border-light hover:bg-brand/30 transition-colors" />
            </Separator>
            {/* 主区域 */}
            <Panel id="main" minSize="40%">
              <PaneContainer node={paneLayout} isRoot />
            </Panel>
          </Group>
        ) : (
          /* 侧面板折叠时，Ribbon 后面直接是主区域 */
          <div className="flex-1 overflow-hidden">
            <PaneContainer node={paneLayout} isRoot />
          </div>
        )}
      </div>
    </div>
  )
}
