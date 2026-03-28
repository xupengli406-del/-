import { useState, useRef, useEffect, useCallback } from 'react'
import { Menu, Plus, FileText, Image, Video, Music, LayoutDashboard, FolderPlus, Folder } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useCanvasStore } from '../../store/canvasStore'
import FileTree from './FileTree'
import type { DocumentId } from '../../store/workspaceTypes'

export default function SidePanel() {
  const { activeSidePanel, setActiveSidePanel, openDocument } = useWorkspaceStore()
  const { addCustomFolder } = useCanvasStore()
  const hasFiles = useCanvasStore((s) => s.canvasFiles.length > 0)

  const [showNewMenu, setShowNewMenu] = useState(false)
  const newMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showNewMenu) return
    const handler = (e: MouseEvent) => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
        setShowNewMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showNewMenu])

  const createFile = useCallback((projectType: 'script' | 'image' | 'video' | 'audio' | 'canvas') => {
    const store = useCanvasStore.getState()
    store.updateCurrentCanvasFile()
    store.clearCanvas()
    const nameMap: Record<string, string> = { script: '新剧本', image: '新分镜图片', video: '新分镜视频', audio: '新音乐音效', canvas: '新画布' }
    let docId: DocumentId
    if (projectType === 'script') {
      const nodeId = store.addScriptNode()
      const fileId = store.saveCanvasAsFile(nameMap[projectType], projectType)
      store.setEditingProjectId(fileId)
      docId = { type: 'script', id: nodeId }
    } else if (projectType === 'canvas') {
      const fileId = store.saveCanvasAsFile(nameMap[projectType], projectType)
      store.setEditingProjectId(fileId)
      docId = { type: 'canvas', id: fileId }
    } else {
      const fileId = store.saveCanvasAsFile(nameMap[projectType], projectType)
      store.setEditingProjectId(fileId)
      store.setInitialAIMode(projectType)
      docId = { type: 'ai', id: fileId }
    }
    openDocument(docId)
    setShowNewMenu(false)
  }, [openDocument])

  if (!activeSidePanel) return null

  return (
    <div className="side-panel">
      {/* 头部: ≡ + 我的项目 + (+) */}
      <div className="side-panel-header">
        <button
          onClick={() => setActiveSidePanel(null)}
          className="w-7 h-7 flex items-center justify-center rounded-ds text-ds-on-surface-variant hover:bg-ds-surface-container-high transition-colors flex-shrink-0"
          title="收起侧边栏"
        >
          <Menu size={16} strokeWidth={1.5} />
        </button>
        <span className="text-[14px] font-bold text-ds-on-surface flex-1 truncate">我的项目</span>
        <div className="relative">
          <button
            onClick={() => setShowNewMenu(v => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-ds-outline-variant text-ds-on-surface-variant hover:bg-ds-surface-container-high hover:text-ds-on-surface transition-colors flex-shrink-0"
            title="新建"
          >
            <Plus size={14} strokeWidth={1.8} />
          </button>
          {showNewMenu && (
            <div
              ref={newMenuRef}
              className="absolute right-0 top-full mt-1.5 z-50 bg-white rounded-ds-lg shadow-ambient py-1 min-w-[152px]"
              style={{ border: '1px solid rgba(179,177,183,0.2)' }}
            >
              <button onClick={() => createFile('script')} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px] text-ds-on-surface hover:bg-ds-surface-container-low transition-colors">
                <FileText size={14} className="text-[#4A6CF7]" /> 新建故事脚本
              </button>
              <button onClick={() => createFile('image')} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px] text-ds-on-surface hover:bg-ds-surface-container-low transition-colors">
                <Image size={14} className="text-[#EC4899]" /> 新建分镜图片
              </button>
              <button onClick={() => createFile('video')} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px] text-ds-on-surface hover:bg-ds-surface-container-low transition-colors">
                <Video size={14} className="text-[#F97316]" /> 新建分镜视频
              </button>
              <button onClick={() => createFile('audio')} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px] text-ds-on-surface hover:bg-ds-surface-container-low transition-colors">
                <Music size={14} className="text-[#F87171]" /> 新建音乐音效
              </button>
              <button onClick={() => createFile('canvas')} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px] text-ds-on-surface hover:bg-ds-surface-container-low transition-colors">
                <LayoutDashboard size={14} className="text-[#8B5CF6]" /> 新建自由画布
              </button>
              <div className="h-px bg-ds-surface-container-high my-1" />
              <button onClick={() => { addCustomFolder('新文件夹'); setShowNewMenu(false) }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px] text-ds-on-surface hover:bg-ds-surface-container-low transition-colors">
                <FolderPlus size={14} className="text-ds-on-surface-variant" /> 新建文件夹
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 蓝色小文件夹图标 — 仅在无文件时显示（匹配图一空状态） */}
      {!hasFiles && (
        <div className="px-4 pt-2 pb-1 flex-shrink-0">
          <Folder size={20} className="text-brand" fill="#4670FE" strokeWidth={0} />
        </div>
      )}

      {/* 面板内容 */}
      <div className="flex-1 overflow-hidden">
        {activeSidePanel === 'files' && <FileTree />}
      </div>

      {/* 底部蓝色装饰条 */}
      <div className="flex-shrink-0 pb-2 px-2">
        <div className="h-[3px] rounded-full bg-gradient-to-r from-brand to-brand-light" style={{ width: '35%' }} />
      </div>
    </div>
  )
}
