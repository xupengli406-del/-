import { useState } from 'react'
import { 
  ChevronLeft, 
  PanelLeftClose, 
  PanelRightClose, 
  Save, 
  Undo2, 
  Redo2, 
  GitBranch, 
  Download, 
  Settings,
  Play,
  Clock
} from 'lucide-react'
import type { IPProject } from '../../store/types'

interface StudioHeaderProps {
  project: IPProject
  onBack: () => void
  onToggleLeftSidebar: () => void
  onToggleRightSidebar: () => void
  leftCollapsed: boolean
  rightCollapsed: boolean
}

export default function StudioHeader({
  project,
  onBack,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  leftCollapsed,
  rightCollapsed,
}: StudioHeaderProps) {
  const [showVersionMenu, setShowVersionMenu] = useState(false)

  return (
    <header className="h-12 bg-[#0d0d0d] border-b border-white/5 flex items-center px-2 gap-2 flex-shrink-0">
      {/* 左侧：返回和侧边栏控制 */}
      <div className="flex items-center gap-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1 px-2 py-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">返回</span>
        </button>
        
        <div className="w-px h-5 bg-white/10 mx-1" />
        
        <button
          onClick={onToggleLeftSidebar}
          className={`p-1.5 rounded-md transition-colors ${leftCollapsed ? 'text-gray-500 hover:text-white' : 'text-violet-400 bg-violet-500/10'}`}
          title="切换左侧栏"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* 中间：项目名和操作 */}
      <div className="flex-1 flex items-center justify-center gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${project.coverColor}`} />
          <span className="text-sm font-medium text-white">{project.name}</span>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-colors" title="撤销">
            <Undo2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-colors" title="重做">
            <Redo2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-colors" title="保存">
            <Save className="w-4 h-4" />
          </button>
        </div>

        {/* 版本控制 */}
        <div className="relative">
          <button
            onClick={() => setShowVersionMenu(!showVersionMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <GitBranch className="w-4 h-4" />
            <span className="text-xs">main</span>
          </button>
          
          {showVersionMenu && (
            <div className="absolute top-full mt-1 left-0 w-64 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl z-50 py-2">
              <div className="px-3 py-2 text-xs text-gray-500 border-b border-white/5">版本分支</div>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5">
                <GitBranch className="w-3.5 h-3.5 text-green-400" />
                main
                <span className="ml-auto text-xs text-gray-500">当前</span>
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5">
                <GitBranch className="w-3.5 h-3.5" />
                结局A版本
              </button>
              <div className="border-t border-white/5 mt-2 pt-2">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-violet-400 hover:bg-violet-500/10">
                  + 创建新分支
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 右侧：工具和面板控制 */}
      <div className="flex items-center gap-1">
        {/* 渲染队列 */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <Clock className="w-4 h-4" />
          <span className="text-xs">队列 (0)</span>
        </button>

        {/* 预览 */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">
          <Play className="w-4 h-4" />
          <span className="text-xs">预览</span>
        </button>

        {/* 导出 */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <Download className="w-4 h-4" />
          <span className="text-xs">导出</span>
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <button className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
          <Settings className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleRightSidebar}
          className={`p-1.5 rounded-md transition-colors ${rightCollapsed ? 'text-gray-500 hover:text-white' : 'text-violet-400 bg-violet-500/10'}`}
          title="切换右侧栏"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
