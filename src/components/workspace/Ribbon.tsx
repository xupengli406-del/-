import {
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  HelpCircle,
} from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import type { SidePanelType } from '../../store/workspaceStore'

const panelActions: { id: SidePanelType; icon: typeof FolderOpen; label: string }[] = [
  { id: 'files', icon: FolderOpen, label: '文件列表' },
]

export default function Ribbon() {
  const { activeSidePanel, toggleSidePanel, setActiveSidePanel } = useWorkspaceStore()

  const isSidebarOpen = activeSidePanel !== null

  const handleToggleSidebar = () => {
    if (isSidebarOpen) {
      setActiveSidePanel(null)
    } else {
      // 展开时默认打开文件列表
      setActiveSidePanel('files')
    }
  }

  return (
    <div className="ribbon">
      {/* 顶部: 侧边栏收起/展开按钮 */}
      <div className="ribbon-top-section">
        <button
          onClick={handleToggleSidebar}
          className="ribbon-btn"
          title={isSidebarOpen ? '收起' : '展开'}
        >
          {isSidebarOpen ? (
            <PanelLeftClose size={18} strokeWidth={1.5} />
          ) : (
            <PanelLeftOpen size={18} strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* 中部: 面板切换按钮 */}
      <div className="flex flex-col items-center gap-0.5 flex-1">
        {panelActions.map(({ id, icon: Icon, label }) => {
          const isActive = activeSidePanel === id
          return (
            <button
              key={id}
              onClick={() => toggleSidePanel(id)}
              className={`ribbon-btn ${isActive ? 'ribbon-btn-active' : ''}`}
              title={label}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              {isActive && <div className="ribbon-indicator" />}
            </button>
          )
        })}
      </div>

      {/* 底部: 辅助按钮 */}
      <div className="flex flex-col items-center gap-0.5 pb-2">
        <button className="ribbon-btn" title="帮助">
          <HelpCircle size={18} strokeWidth={1.5} />
        </button>
        <button className="ribbon-btn" title="设置">
          <Settings size={18} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
