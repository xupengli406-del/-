import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CanvasTopBar from '../components/canvas/CanvasTopBar'
import CanvasLeftToolbar from '../components/canvas/CanvasLeftToolbar'
import CanvasAddNodePanel from '../components/canvas/CanvasAddNodePanel'
import CanvasCenter from '../components/canvas/CanvasCenter'
import CanvasAIPanel from '../components/canvas/CanvasAIPanel'
import CanvasBottomBar from '../components/canvas/CanvasBottomBar'

export default function CanvasEditor() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  const [projectName, setProjectName] = useState(projectId === 'new' ? 'Untitled' : `项目 ${projectId}`)
  const [leftPanel, setLeftPanel] = useState<string | null>(null)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [zoom, setZoom] = useState(100)

  const toggleLeftPanel = (panel: string) => {
    setLeftPanel(prev => prev === panel ? null : panel)
  }

  const handleBack = () => {
    navigate('/workspace')
  }

  return (
    <div className="fixed inset-0 bg-[#0d0d0d] flex flex-col overflow-hidden">
      {/* 顶部栏 */}
      <CanvasTopBar
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onBack={handleBack}
        onToggleAI={() => setShowAIPanel(!showAIPanel)}
        showAIPanel={showAIPanel}
      />

      {/* 主体区域 */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* 左侧工具栏 */}
        <CanvasLeftToolbar
          activePanel={leftPanel}
          onTogglePanel={toggleLeftPanel}
        />

        {/* 左侧展开面板 */}
        {leftPanel && (
          <CanvasAddNodePanel
            activePanel={leftPanel}
            onClose={() => setLeftPanel(null)}
          />
        )}

        {/* 中心画布 */}
        <CanvasCenter zoom={zoom} />

        {/* 右侧AI面板 */}
        {showAIPanel && (
          <CanvasAIPanel onClose={() => setShowAIPanel(false)} />
        )}
      </div>

      {/* 底部工具栏 */}
      <CanvasBottomBar zoom={zoom} onZoomChange={setZoom} />

      {/* 右下角悬浮按钮 */}
      <button className="fixed bottom-16 right-6 w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/30 transition-colors z-30">
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>
  )
}
