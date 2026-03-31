import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Plus,
  FolderPlus,
  FileText,
  Image,
  Video,
  Music,
  LayoutDashboard,
} from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useCanvasStore } from '../../store/canvasStore'
import FileTreeContextMenu from './FileTreeContextMenu'
import MoveToFolderModal from './MoveToFolderModal'
import type { ContextMenuTarget } from './FileTreeContextMenu'
import type { FileTreeItem, DocumentId } from '../../store/workspaceTypes'

// 收集文件树中所有文件项的 id（按渲染顺序，用于 Shift 范围选择）
function collectFileIds(items: FileTreeItem[], expandedFolders: Set<string>): string[] {
  const result: string[] = []
  for (const item of items) {
    if (item.type === 'folder') {
      if (expandedFolders.has(item.id) && item.children) {
        result.push(...collectFileIds(item.children, expandedFolders))
      }
    } else {
      result.push(item.id)
    }
  }
  return result
}

// 从 FileTreeItem id 中提取 canvasFile id（用于拖拽归属）
function extractCanvasFileId(itemId: string): string | null {
  if (itemId.startsWith('canvas_')) return itemId.slice(7)
  if (itemId.startsWith('image_')) return itemId.slice(6)
  if (itemId.startsWith('video_')) return itemId.slice(6)
  if (itemId.startsWith('ai_')) return itemId.slice(3)
  if (itemId.startsWith('script_')) return itemId.slice(7)
  return null
}

export default function FileTree() {
  const { buildFileTree, fileTreeExpandedFolders, toggleFolder, openDocument, openDocumentInPlace, splitPane, activePaneId, refreshTabLabels } = useWorkspaceStore()
  const { customFolders, addCustomFolder, renameCustomFolder, removeCustomFolder, moveFileToFolder, moveFolderToFolder } = useCanvasStore()

  // 右键菜单
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number; target: ContextMenuTarget
  } | null>(null)

  // 多选状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [lastClickedId, setLastClickedId] = useState<string | null>(null)

  // 重命名状态
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  // 新建文件夹状态
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingInFolderId, setCreatingInFolderId] = useState<string | null>(null)

  // 新建菜单状态
  const [showNewMenu, setShowNewMenu] = useState(false)
  const newMenuRef = useRef<HTMLDivElement>(null)

  // 文件夹内新建文件的菜单状态（右键"新建文件"时弹出子菜单选择类型）
  const [newFileInFolderId, setNewFileInFolderId] = useState<string | null>(null)
  const [newFileMenuPos, setNewFileMenuPos] = useState<{ x: number; y: number } | null>(null)
  const newFileMenuRef = useRef<HTMLDivElement>(null)

  // 拖拽状态
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)
  const dragItemRef = useRef<{ itemId: string; canvasFileId: string | null; isFolder: boolean } | null>(null)

  // "移动到文件夹"弹窗状态
  const [moveToFileIds, setMoveToFileIds] = useState<string[] | null>(null)

  // 关闭新建菜单
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

  // 关闭文件夹内新建文件菜单
  useEffect(() => {
    if (!newFileMenuPos) return
    const handler = (e: MouseEvent) => {
      if (newFileMenuRef.current && !newFileMenuRef.current.contains(e.target as Node)) {
        setNewFileMenuPos(null)
        setNewFileInFolderId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [newFileMenuPos])

  const tree = buildFileTree()

  // 按渲染顺序排列的所有文件 id
  const orderedFileIds = useMemo(
    () => collectFileIds(tree, fileTreeExpandedFolders),
    [tree, fileTreeExpandedFolders]
  )

  // 自动聚焦重命名输入框
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingId])

  // 文件单击 — 支持 Ctrl/Shift 多选，普通单击在当前标签页打开
  const handleFileClick = useCallback((e: React.MouseEvent, itemId: string, docId?: DocumentId) => {
    if (e.ctrlKey || e.metaKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(itemId)) next.delete(itemId)
        else next.add(itemId)
        return next
      })
      setLastClickedId(itemId)
    } else if (e.shiftKey && lastClickedId) {
      const startIdx = orderedFileIds.indexOf(lastClickedId)
      const endIdx = orderedFileIds.indexOf(itemId)
      if (startIdx !== -1 && endIdx !== -1) {
        const lo = Math.min(startIdx, endIdx)
        const hi = Math.max(startIdx, endIdx)
        const rangeIds = orderedFileIds.slice(lo, hi + 1)
        setSelectedIds((prev) => {
          const next = new Set(prev)
          for (const id of rangeIds) next.add(id)
          return next
        })
      }
    } else {
      setSelectedIds(new Set([itemId]))
      setLastClickedId(itemId)
      if (docId) {
        openDocumentInPlace(docId)
      }
    }
  }, [lastClickedId, orderedFileIds, openDocumentInPlace])

  // 文件右键菜单
  const handleFileContextMenu = useCallback((e: React.MouseEvent, itemId: string, docId: DocumentId) => {
    e.preventDefault()
    e.stopPropagation()

    if (!selectedIds.has(itemId)) {
      setSelectedIds(new Set([itemId]))
      setLastClickedId(itemId)
    }

    const currentSelected = selectedIds.has(itemId) ? selectedIds : new Set([itemId])
    if (currentSelected.size > 1) {
      setContextMenu({
        x: e.clientX, y: e.clientY,
        target: { kind: 'multiSelect', count: currentSelected.size },
      })
    } else {
      setContextMenu({
        x: e.clientX, y: e.clientY,
        target: { kind: 'file', docId },
      })
    }
  }, [selectedIds])

  // 文件夹右键菜单
  const handleFolderContextMenu = useCallback((e: React.MouseEvent, folderId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, target: { kind: 'folder', folderId } })
  }, [])

  // 点击空白区域清除选择
  const handleTreeBgClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedIds(new Set())
    }
  }, [])

  // 空白区域右键菜单
  const [blankContextMenuPos, setBlankContextMenuPos] = useState<{ x: number; y: number } | null>(null)
  const blankContextMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!blankContextMenuPos) return
    const handler = (e: MouseEvent) => {
      if (blankContextMenuRef.current && !blankContextMenuRef.current.contains(e.target as Node)) {
        setBlankContextMenuPos(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [blankContextMenuPos])

  const handleTreeBgContextMenu = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      e.preventDefault()
      setBlankContextMenuPos({ x: e.clientX, y: e.clientY })
    }
  }, [])

  // === 拖拽处理 ===
  const handleDragStart = useCallback((e: React.DragEvent, itemId: string, isFolder = false) => {
    const canvasFileId = isFolder ? null : extractCanvasFileId(itemId)
    dragItemRef.current = { itemId, canvasFileId, isFolder }
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', itemId)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, folderId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverFolderId(folderId)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverFolderId(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault()
    setDragOverFolderId(null)
    const dragItem = dragItemRef.current
    if (!dragItem) return

    // 拖拽的是文件夹
    if (dragItem.isFolder) {
      if (dragItem.itemId !== targetFolderId) {
        moveFolderToFolder(dragItem.itemId, targetFolderId)
      }
      dragItemRef.current = null
      return
    }

    // 拖拽的是文件
    if (!dragItem.canvasFileId) return

    // 如果拖拽的文件在多选集合中，移动所有选中的文件
    if (selectedIds.has(dragItem.itemId) && selectedIds.size > 1) {
      for (const itemId of selectedIds) {
        const fid = extractCanvasFileId(itemId)
        if (fid) moveFileToFolder(fid, targetFolderId)
      }
    } else {
      moveFileToFolder(dragItem.canvasFileId, targetFolderId)
    }
    dragItemRef.current = null
  }, [moveFileToFolder, moveFolderToFolder, selectedIds])

  // 拖拽到文件树空白区域 → 移出文件夹（移到根级）
  const handleTreeBgDragOver = useCallback((e: React.DragEvent) => {
    if (e.target === e.currentTarget) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setDragOverFolderId('__root__')
    }
  }, [])

  const handleTreeBgDrop = useCallback((e: React.DragEvent) => {
    if (e.target !== e.currentTarget) return
    e.preventDefault()
    setDragOverFolderId(null)
    const dragItem = dragItemRef.current
    if (!dragItem) return

    // 拖拽的是文件夹 → 移到根级
    if (dragItem.isFolder) {
      moveFolderToFolder(dragItem.itemId, undefined)
      dragItemRef.current = null
      return
    }

    if (!dragItem.canvasFileId) return

    // 如果拖拽的文件在多选集合中，移动所有选中的文件到根级
    if (selectedIds.has(dragItem.itemId) && selectedIds.size > 1) {
      for (const itemId of selectedIds) {
        const fid = extractCanvasFileId(itemId)
        if (fid) moveFileToFolder(fid, undefined)
      }
    } else {
      moveFileToFolder(dragItem.canvasFileId, undefined)
    }
    dragItemRef.current = null
  }, [moveFileToFolder, moveFolderToFolder, selectedIds])

  // === 新建文件（在指定 folderId 下创建，null 表示根级） ===
  const createFile = useCallback((projectType: 'image' | 'video', folderId: string | null) => {
    const store = useCanvasStore.getState()
    store.updateCurrentCanvasFile()
    store.clearCanvas()

    const nameMap: Record<'image' | 'video', string> = {
      image: '新分镜图片',
      video: '新视频',
    }

    const fileId = store.saveCanvasAsFile(nameMap[projectType], projectType)
    const docId: DocumentId = { type: projectType === 'image' ? 'imageGeneration' : 'videoGeneration', id: fileId }

    store.setEditingProjectId(fileId)

    // 如果指定了文件夹，把文件移入该文件夹
    if (folderId) {
      store.moveFileToFolder(fileId, folderId)
      // 确保文件夹展开
      const ws = useWorkspaceStore.getState()
      if (!ws.fileTreeExpandedFolders.has(folderId)) {
        ws.toggleFolder(folderId)
      }
    }

    openDocument(docId)
  }, [openDocument])

  // 顶部+号菜单中的新建处理器
  const handleNewImage = useCallback(() => { createFile('image', null); setShowNewMenu(false) }, [createFile])
  const handleNewVideo = useCallback(() => { createFile('video', null); setShowNewMenu(false) }, [createFile])

  // 新建文件夹（在根级或指定父文件夹下）
  const handleNewFolder = useCallback(() => {
    setCreatingInFolderId(null)
    setIsCreatingFolder(true)
    setNewFolderName('')
  }, [])

  const handleNewFolderIn = useCallback((parentFolderId: string) => {
    setCreatingInFolderId(parentFolderId)
    setIsCreatingFolder(true)
    setNewFolderName('')
    const { fileTreeExpandedFolders, toggleFolder: tf } = useWorkspaceStore.getState()
    if (!fileTreeExpandedFolders.has(parentFolderId)) {
      tf(parentFolderId)
    }
  }, [])

  const handleConfirmNewFolder = useCallback(() => {
    const name = newFolderName.trim() || '未命名'
    const folderId = addCustomFolder(name, creatingInFolderId)
    setIsCreatingFolder(false)
    setNewFolderName('')
    setCreatingInFolderId(null)
    // 展开新文件夹的父级
    if (creatingInFolderId) {
      const ws = useWorkspaceStore.getState()
      if (!ws.fileTreeExpandedFolders.has(creatingInFolderId)) {
        ws.toggleFolder(creatingInFolderId)
      }
    }
    // 展开新文件夹自身
    const ws = useWorkspaceStore.getState()
    if (!ws.fileTreeExpandedFolders.has(folderId)) {
      ws.toggleFolder(folderId)
    }
  }, [newFolderName, creatingInFolderId, addCustomFolder])

  const handleCancelNewFolder = useCallback(() => {
    setIsCreatingFolder(false)
    setNewFolderName('')
    setCreatingInFolderId(null)
  }, [])

  // 右键文件夹 → 新建文件（弹出文件类型选择子菜单）
  const handleNewFileInFolder = useCallback((folderId: string, menuX: number, menuY: number) => {
    setNewFileInFolderId(folderId)
    setNewFileMenuPos({ x: menuX, y: menuY })
  }, [])

  // 重命名
  const startRename = useCallback((id: string, currentLabel: string) => {
    setRenamingId(id)
    setRenameValue(currentLabel)
  }, [])

  const confirmRename = useCallback(() => {
    if (!renamingId) return
    const newName = renameValue.trim()
    if (newName) {
      if (renamingId.startsWith('folder_')) {
        renameCustomFolder(renamingId, newName)
      }
      let renamedFile = false
      if (renamingId.startsWith('canvas_')) {
        const canvasId = renamingId.replace('canvas_', '')
        useCanvasStore.getState().renameCanvasFile?.(canvasId, newName)
        renamedFile = true
      }
      if (renamingId.startsWith('ai_')) {
        const canvasId = renamingId.replace('ai_', '')
        useCanvasStore.getState().renameCanvasFile?.(canvasId, newName)
        renamedFile = true
      }
      if (renamingId.startsWith('script_')) {
        const canvasId = renamingId.replace('script_', '')
        useCanvasStore.getState().renameCanvasFile?.(canvasId, newName)
        renamedFile = true
      }
      if (renamedFile) {
        refreshTabLabels()
      }
    }
    setRenamingId(null)
    setRenameValue('')
  }, [renamingId, renameValue, renameCustomFolder, refreshTabLabels])

  const cancelRename = useCallback(() => {
    setRenamingId(null)
    setRenameValue('')
  }, [])

  // 删除
  const handleDelete = useCallback((id: string) => {
    const ws = useWorkspaceStore.getState()
    if (id.startsWith('folder_')) {
      // 文件夹删除：先关闭该文件夹下所有文件的 tab
      const cs = useCanvasStore.getState()
      const folderId = id
      cs.canvasFiles
        .filter((f) => f.folderId === folderId)
        .forEach((f) => ws.closeTabsByFileId(f.id))
      removeCustomFolder(id)
      return
    }
    const cs = useCanvasStore.getState()
    const fileId = id.replace(/^(canvas_|ai_|script_|image_|video_|audio_)/, '')
    if (
      id.startsWith('canvas_') ||
      id.startsWith('ai_') ||
      id.startsWith('script_') ||
      id.startsWith('image_') ||
      id.startsWith('video_') ||
      id.startsWith('audio_')
    ) {
      ws.closeTabsByFileId(fileId)
      cs.removeCanvasFile(fileId)
    }
  }, [removeCustomFolder])

  // 批量删除
  const handleDeleteSelected = useCallback(() => {
    for (const id of selectedIds) {
      handleDelete(id)
    }
    setSelectedIds(new Set())
  }, [selectedIds, handleDelete])

  // 使用选中的对象创建新文件夹
  const handleCreateFolderFromSelection = useCallback(() => {
    const folderId = addCustomFolder('新文件夹')
    for (const itemId of selectedIds) {
      const canvasFileId = extractCanvasFileId(itemId)
      if (canvasFileId) {
        moveFileToFolder(canvasFileId, folderId)
      }
    }
    setSelectedIds(new Set())
    setRenamingId(folderId)
    setRenameValue('新文件夹')
    const ws = useWorkspaceStore.getState()
    if (!ws.fileTreeExpandedFolders.has(folderId)) {
      ws.toggleFolder(folderId)
    }
  }, [selectedIds, addCustomFolder, moveFileToFolder])

  // 在新标签组打开（分屏）
  const handleOpenInNewGroup = useCallback((docId: DocumentId) => {
    splitPane(activePaneId, 'horizontal', docId)
  }, [splitPane, activePaneId])

  // "将文件移动到..."
  const handleMoveTo = useCallback(() => {
    const ids: string[] = []
    for (const itemId of selectedIds) {
      const fid = extractCanvasFileId(itemId)
      if (fid) ids.push(fid)
    }
    if (ids.length > 0) {
      setMoveToFileIds(ids)
    }
  }, [selectedIds])

  const handleMoveToSingle = useCallback((docId: DocumentId) => {
    const itemId = `${docId.type === 'canvas' ? 'canvas' : docId.type === 'imageGeneration' ? 'image' : docId.type === 'videoGeneration' ? 'video' : docId.type === 'script' ? 'script' : docId.type}_${docId.id}`
    const fid = extractCanvasFileId(itemId)
    if (fid) {
      setMoveToFileIds([fid])
    }
  }, [])

  // 获取文件类型图标
  const getFileIcon = (item: FileTreeItem) => {
    // 根据 docId.type 和 canvasFile 的 projectType 显示图标
    if (item.docId) {
      const cs = useCanvasStore.getState()
      const canvasFile = cs.canvasFiles.find((f) => f.id === item.docId!.id)
      const pt = canvasFile?.projectType
      if (pt === 'script') return <FileText size={13} className="text-blue-500 flex-shrink-0" />
      if (pt === 'image') return <Image size={13} className="text-purple-500 flex-shrink-0" />
      if (pt === 'video') return <Video size={13} className="text-rose-500 flex-shrink-0" />
      if (pt === 'audio') return <Music size={13} className="text-amber-500 flex-shrink-0" />
      if (pt === 'canvas') return <LayoutDashboard size={13} className="text-teal-500 flex-shrink-0" />
    }
    return <FileText size={13} className="text-gray-400 flex-shrink-0" />
  }

  // 渲染文件树节点
  const renderItem = (item: FileTreeItem, depth: number = 0, _isLast: boolean = false) => {
    if (item.type === 'folder') {
      const isExpanded = fileTreeExpandedFolders.has(item.id)
      const isRenaming = renamingId === item.id
      const isDragOver = dragOverFolderId === item.id

      return (
        <div key={item.id} className="relative">
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, item.id, true)}
            onClick={() => toggleFolder(item.id)}
            onContextMenu={(e) => handleFolderContextMenu(e, item.id)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, item.id)}
            className={`filetree-folder-row ${isDragOver ? 'bg-brand/10 ring-1 ring-brand/30' : ''}`}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
          >
            <span className="filetree-chevron">
              {isExpanded ? (
                <ChevronDown size={10} />
              ) : (
                <ChevronRight size={10} />
              )}
            </span>
            {isRenaming ? (
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmRename()
                  if (e.key === 'Escape') cancelRename()
                }}
                onBlur={confirmRename}
                className="flex-1 text-xs px-1 py-0 input-atelier min-w-0"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="filetree-folder-label">{item.label}</span>
            )}
          </div>
          {isExpanded && (
            <div className="relative">
              {((item.children && item.children.length > 0) || (isCreatingFolder && creatingInFolderId === item.id)) && (
                <div
                  className="filetree-indent-line"
                  style={{ left: `${depth * 16 + 14}px` }}
                />
              )}
              {/* 文件夹内新建子文件夹输入框 */}
              {isCreatingFolder && creatingInFolderId === item.id && (
                <div className="py-1" style={{ paddingLeft: `${(depth + 1) * 16 + 8}px`, paddingRight: '8px' }}>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirmNewFolder()
                      if (e.key === 'Escape') handleCancelNewFolder()
                    }}
                    onBlur={handleConfirmNewFolder}
                    placeholder="文件夹名称..."
                    className="w-full text-xs px-2 py-1 input-atelier"
                    autoFocus
                  />
                </div>
              )}
              {item.children && item.children.length === 0 && !(isCreatingFolder && creatingInFolderId === item.id) ? (
                <div
                  className="text-[10px] text-apple-text-tertiary italic py-1"
                  style={{ paddingLeft: `${(depth + 1) * 16 + 24}px` }}
                >
                  空
                </div>
              ) : (
                item.children?.map((child, idx) =>
                  renderItem(child, depth + 1, idx === item.children!.length - 1)
                )
              )}
            </div>
          )}
        </div>
      )
    }

    // 文件项
    const isRenaming = renamingId === item.id
    const isSelected = selectedIds.has(item.id)
    return (
      <div
        key={item.id}
        draggable
        onDragStart={(e) => handleDragStart(e, item.id)}
        onClick={(e) => handleFileClick(e, item.id, item.docId)}
        onContextMenu={(e) => item.docId && handleFileContextMenu(e, item.id, item.docId)}
        className={`filetree-file-row ${isSelected ? 'filetree-file-selected' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {getFileIcon(item)}
        {isRenaming ? (
          <input
            ref={renameInputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmRename()
              if (e.key === 'Escape') cancelRename()
            }}
            onBlur={confirmRename}
            className="flex-1 text-xs px-1 py-0 input-atelier min-w-0"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="filetree-file-label"
            onDoubleClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              startRename(item.id, item.label)
            }}
          >
            {item.label}
          </span>
        )}
      </div>
    )
  }

  // 新建文件类型选择菜单（用于右键文件夹→新建文件、空白右键菜单）
  const renderNewFileMenu = (x: number, y: number, folderId: string | null, onClose: () => void) => (
    <div
      ref={newFileMenuRef}
      className="fixed z-[100] bg-white rounded-ds-lg shadow-ambient py-1 min-w-[140px]"
      style={{ left: x, top: y, border: '1px solid rgba(179,177,183,0.2)' }}
    >
      <button onClick={() => { createFile('image', folderId); onClose() }} className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-ds-on-surface hover:bg-ds-surface-container-low transition-colors">
        <Image size={13} className="text-[#EC4899]" /> 新建分镜图片
      </button>
      <button onClick={() => { createFile('video', folderId); onClose() }} className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-ds-on-surface hover:bg-ds-surface-container-low transition-colors">
        <Video size={13} className="text-[#F97316]" /> 新建视频
      </button>
    </div>
  )

  return (
    <div className="h-full flex flex-col">
      {/* 子工具栏 */}
      <div className="filetree-toolbar">
        <span className="text-[13px] font-semibold text-apple-text flex-1 pl-1">我的项目</span>
        <div className="relative">
          <button onClick={() => setShowNewMenu((v) => !v)} className="filetree-toolbar-btn" title="新建">
            <Plus size={14} strokeWidth={1.5} />
          </button>
          {showNewMenu && (
            <div
              ref={newMenuRef}
              className="absolute right-0 top-full mt-1 z-50 bg-white rounded-ds-lg shadow-ambient py-1 min-w-[140px]"
              style={{ border: '1px solid rgba(179,177,183,0.2)' }}
            >
              <button onClick={handleNewImage} className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-ds-on-surface hover:bg-ds-surface-container-low transition-colors">
                <Image size={13} className="text-[#EC4899]" /> 新建分镜图片
              </button>
              <button onClick={handleNewVideo} className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-ds-on-surface hover:bg-ds-surface-container-low transition-colors">
                <Video size={13} className="text-[#F97316]" /> 新建视频
              </button>
              <div className="h-px bg-ds-surface-container-high my-1" />
              <button onClick={() => { handleNewFolder(); setShowNewMenu(false) }} className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-ds-on-surface hover:bg-ds-surface-container-low transition-colors">
                <FolderPlus size={13} className="text-ds-on-surface-variant" /> 新建文件夹
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 文件树 */}
      <div
        className="flex-1 overflow-y-auto py-1"
        onClick={handleTreeBgClick}
        onContextMenu={handleTreeBgContextMenu}
        onDragOver={handleTreeBgDragOver}
        onDrop={handleTreeBgDrop}
        onDragLeave={handleDragLeave}
      >
        {/* 顶层新建文件夹输入框 */}
        {isCreatingFolder && !creatingInFolderId && (
          <div className="px-2 py-1">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmNewFolder()
                if (e.key === 'Escape') handleCancelNewFolder()
              }}
              onBlur={handleConfirmNewFolder}
              placeholder="文件夹名称..."
              className="w-full text-xs px-2 py-1 input-atelier"
              autoFocus
            />
          </div>
        )}

        {/* 文件树内容 */}
        {tree.length === 0 && !isCreatingFolder && (
          <div className="flex flex-col items-center justify-center pt-10 pb-8">
            {/* 简单页面轮廓图标 — 匹配图一 */}
            <svg width="40" height="48" viewBox="0 0 40 48" fill="none" className="mb-4">
              <path d="M6 2h20l10 10v32a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="#B3B1B7" strokeWidth="1.5" fill="none" />
              <path d="M26 2v10h10" stroke="#B3B1B7" strokeWidth="1.5" fill="none" />
            </svg>
            <p className="text-[13px] text-ds-on-surface font-semibold">暂无文件</p>
            <p className="mt-2 text-[11px] text-ds-outline leading-[1.6] text-center">
              点击上方 +<br />新建文件或文件夹
            </p>
          </div>
        )}
        {tree.map((item, idx) => renderItem(item, 0, idx === tree.length - 1))}
      </div>

      {/* 上下文菜单 */}
      {contextMenu && (
        <FileTreeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          target={contextMenu.target}
          onNewFile={() => {
            if (contextMenu.target.kind === 'folder') {
              // 文件夹右键→新建文件：弹出文件类型子菜单
              handleNewFileInFolder(contextMenu.target.folderId, contextMenu.x, contextMenu.y)
            }
          }}
          onNewFolder={() => {
            if (contextMenu.target.kind === 'folder') {
              handleNewFolderIn(contextMenu.target.folderId)
            } else {
              handleNewFolder()
            }
          }}
          onOpenInNewTab={() => {
            if (contextMenu.target.kind === 'file') {
              useWorkspaceStore.getState().openDocumentInNewTab(contextMenu.target.docId)
            }
          }}
          onOpenInNewGroup={() => {
            if (contextMenu.target.kind === 'file') {
              handleOpenInNewGroup(contextMenu.target.docId)
            }
          }}
          onDuplicate={() => {
            if (contextMenu.target.kind === 'file') {
              const docId = contextMenu.target.docId
              const cs = useCanvasStore.getState()
              const source = cs.canvasFiles.find((f) => f.id === docId.id)
              if (source) {
                const copyId = cs.saveCanvasAsFile(`${source.name} 副本`, source.projectType as 'image' | 'video' | 'script' | 'audio' | 'canvas')
                if (source.folderId) {
                  cs.moveFileToFolder(copyId, source.folderId)
                }
              }
            }
          }}
          onMoveTo={() => {
            if (contextMenu.target.kind === 'file') {
              handleMoveToSingle(contextMenu.target.docId)
            } else if (contextMenu.target.kind === 'multiSelect') {
              handleMoveTo()
            }
          }}
          onRename={() => {
            if (contextMenu.target.kind === 'folder') {
              const folderId = contextMenu.target.folderId
              const findFolderLabel = (items: FileTreeItem[]): string => {
                for (const item of items) {
                  if (item.id === folderId) return item.label
                  if (item.children) {
                    const found = findFolderLabel(item.children)
                    if (found) return found
                  }
                }
                return ''
              }
              const name = findFolderLabel(tree)
              startRename(folderId, name)
            } else if (contextMenu.target.kind === 'file') {
              const docId = contextMenu.target.docId
              const itemId = `${docId.type === 'canvas' ? 'canvas' : docId.type === 'imageGeneration' ? 'image' : docId.type === 'videoGeneration' ? 'video' : docId.type === 'script' ? 'script' : docId.type}_${docId.id}`
              const findLabel = (items: FileTreeItem[]): string => {
                for (const item of items) {
                  if (item.id === itemId) return item.label
                  if (item.children) {
                    const found = findLabel(item.children)
                    if (found) return found
                  }
                }
                return ''
              }
              const label = findLabel(tree)
              startRename(itemId, label)
            }
          }}
          onDelete={() => {
            if (contextMenu.target.kind === 'multiSelect') {
              handleDeleteSelected()
            } else if (contextMenu.target.kind === 'folder') {
              handleDelete(contextMenu.target.folderId)
            } else {
              const docId = contextMenu.target.docId
              handleDelete(`${docId.type === 'canvas' ? 'canvas' : docId.type === 'imageGeneration' ? 'image' : docId.type === 'videoGeneration' ? 'video' : docId.type === 'script' ? 'script' : docId.type}_${docId.id}`)
            }
          }}
          onCreateFolderFromSelection={handleCreateFolderFromSelection}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* 空白区域右键菜单（与+号菜单相同） */}
      {blankContextMenuPos && (
        <div
          ref={blankContextMenuRef}
          className="fixed z-[100] bg-white rounded-ds-lg shadow-ambient py-1 min-w-[140px]"
          style={{ left: blankContextMenuPos.x, top: blankContextMenuPos.y, border: '1px solid rgba(179,177,183,0.2)' }}
        >
          <button onClick={() => { createFile('image', null); setBlankContextMenuPos(null) }} className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-ds-on-surface hover:bg-ds-surface-container-low transition-colors">
            <Image size={13} className="text-[#EC4899]" /> 新建分镜图片
          </button>
          <button onClick={() => { createFile('video', null); setBlankContextMenuPos(null) }} className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-ds-on-surface hover:bg-ds-surface-container-low transition-colors">
            <Video size={13} className="text-[#F97316]" /> 新建视频
          </button>
          <div className="h-px bg-ds-surface-container-high my-1" />
          <button onClick={() => { handleNewFolder(); setBlankContextMenuPos(null) }} className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-ds-on-surface hover:bg-ds-surface-container-low transition-colors">
            <FolderPlus size={13} className="text-ds-on-surface-variant" /> 新建文件夹
          </button>
        </div>
      )}

      {/* 文件夹内新建文件的类型选择菜单 */}
      {newFileMenuPos && newFileInFolderId && (
        renderNewFileMenu(newFileMenuPos.x, newFileMenuPos.y, newFileInFolderId, () => {
          setNewFileMenuPos(null)
          setNewFileInFolderId(null)
        })
      )}

      {/* "将文件移动到..."弹窗 */}
      {moveToFileIds && (
        <MoveToFolderModal
          fileIds={moveToFileIds}
          onClose={() => setMoveToFileIds(null)}
        />
      )}
    </div>
  )
}
