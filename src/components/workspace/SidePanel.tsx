import { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, Image, Video, FolderPlus } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useProjectStore } from '../../store/projectStore'
import FileTree from './FileTree'
import type { DocumentId } from '../../store/workspaceTypes'

export default function SidePanel() {
  const { activeSidePanel, openDocument } = useWorkspaceStore()
  const { addCustomFolder } = useProjectStore()

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

  const createFile = useCallback((projectType: 'image' | 'video') => {
    const store = useProjectStore.getState()
    store.updateCurrentProjectFile()
    store.clearChat()
    const nameMap: Record<'image' | 'video', string> = { image: '新分镜图片', video: '新视频' }
    const fileId = store.createProjectFile(nameMap[projectType], projectType)
    store.setEditingProjectId(fileId)
    const docId: DocumentId = { type: projectType === 'image' ? 'imageGeneration' : 'videoGeneration', id: fileId }
    openDocument(docId)
    setShowNewMenu(false)
  }, [openDocument])

  if (!activeSidePanel) return null

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 头部: 文件列表 + (+) */}
      <div className="h-10 flex items-end px-4 flex-shrink-0">
        <div className="flex items-center gap-2 h-8 flex-1 min-w-0">
        <span className="text-sm font-semibold tracking-tight text-ds-on-surface flex-1 truncate">文件</span>
        <div className="relative">
          <button
            onClick={() => setShowNewMenu(v => !v)}
            className="w-6 h-6 flex items-center justify-center rounded bg-ds-surface-container-highest hover:bg-ds-outline-variant/30 transition-colors flex-shrink-0"
            title="新建"
          >
            <Plus size={13} strokeWidth={1.8} className="text-ds-on-surface-variant" />
          </button>
          {showNewMenu && (
            <div
              ref={newMenuRef}
              className="absolute right-0 top-full mt-1.5 z-50 bg-white rounded-ds-lg shadow-ambient py-1 min-w-[152px]"
              style={{ border: '1px solid rgba(179,177,183,0.2)' }}
            >
              <button onClick={() => createFile('image')} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px] text-ds-on-surface hover:bg-ds-surface-container-low transition-colors">
                <Image size={14} className="text-[#EC4899]" /> 新建分镜图片
              </button>
              <button onClick={() => createFile('video')} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px] text-ds-on-surface hover:bg-ds-surface-container-low transition-colors">
                <Video size={14} className="text-[#F97316]" /> 新建视频
              </button>
              <div className="h-px bg-ds-surface-container-high my-1" />
              <button onClick={() => { addCustomFolder('新文件夹'); setShowNewMenu(false) }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px] text-ds-on-surface hover:bg-ds-surface-container-low transition-colors">
                <FolderPlus size={14} className="text-ds-on-surface-variant" /> 新建文件夹
              </button>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* 面板内容 */}
      <div className="flex-1 overflow-hidden">
        {activeSidePanel === 'files' && <FileTree />}
      </div>
    </div>
  )
}
