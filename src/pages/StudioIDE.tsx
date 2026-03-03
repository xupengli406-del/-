import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjectStore } from '../store'
import StudioHeader from '../components/studio/StudioHeader'
import FileExplorer from '../components/studio/FileExplorer'
import WorkCanvas from '../components/studio/WorkCanvas'
import AICopilot from '../components/studio/AICopilot'

export default function StudioIDE() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { 
    projects, 
    currentProjectId, 
    setCurrentProject,
    leftSidebarCollapsed,
    rightSidebarCollapsed,
    toggleLeftSidebar,
    toggleRightSidebar,
    openTab,
  } = useProjectStore()

  const currentProject = projects.find(p => p.id === projectId)

  useEffect(() => {
    if (projectId && projectId !== currentProjectId) {
      setCurrentProject(projectId)
    }
  }, [projectId, currentProjectId, setCurrentProject])

  // 左侧栏点击文件 → 在画布中以 Tab 打开
  const handleOpenFile = (type: string, id: string, name: string) => {
    const tabType = type === 'storyboard' ? 'storyboard_edit' : type as any
    openTab({ type: tabType, title: name, entityId: id, isDirty: false })
  }

  if (!currentProject) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">项目不存在</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* 顶部栏 */}
      <StudioHeader 
        project={currentProject}
        onBack={() => navigate('/')}
        onToggleLeftSidebar={toggleLeftSidebar}
        onToggleRightSidebar={toggleRightSidebar}
        leftCollapsed={leftSidebarCollapsed}
        rightCollapsed={rightSidebarCollapsed}
      />

      {/* 三栏主体区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧栏：文件管理 + 上下文 */}
        <FileExplorer 
          project={currentProject}
          collapsed={leftSidebarCollapsed}
          onOpenFile={handleOpenFile}
        />

        {/* 中部：画布工作区（每个文件打开都是画布） */}
        <WorkCanvas />

        {/* 右侧栏：AI副驾 */}
        <AICopilot 
          collapsed={rightSidebarCollapsed}
          onToggle={toggleRightSidebar}
        />
      </div>
    </div>
  )
}
