import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useProjectStore } from '../../store/projectStore'
import type { CustomFolder } from '../../store/types'

interface MoveToFolderModalProps {
  /** 要移动的文件 ID 列表（canvasFile.id） */
  fileIds: string[]
  onClose: () => void
}

export default function MoveToFolderModal({ fileIds, onClose }: MoveToFolderModalProps) {
  const { customFolders, moveFileToFolder, addCustomFolder } = useProjectStore()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // 构建文件夹列表（含层级路径显示）
  const folderOptions = useMemo(() => {
    const buildPath = (folder: CustomFolder): string => {
      if (!folder.parentId) return folder.name
      const parent = customFolders.find((f) => f.id === folder.parentId)
      return parent ? `${buildPath(parent)}/${folder.name}` : folder.name
    }
    return customFolders.map((f) => ({
      id: f.id,
      name: f.name,
      path: buildPath(f),
    }))
  }, [customFolders])

  // 过滤
  const filtered = useMemo(() => {
    if (!query.trim()) return folderOptions
    const q = query.trim().toLowerCase()
    return folderOptions.filter((f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q))
  }, [folderOptions, query])

  // 重置 activeIndex
  useEffect(() => {
    setActiveIndex(0)
  }, [filtered.length])

  // 自动聚焦
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // 滚动到可见
  useEffect(() => {
    if (!listRef.current) return
    const items = listRef.current.querySelectorAll('[data-folder-item]')
    items[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const handleMove = useCallback((folderId: string) => {
    for (const fileId of fileIds) {
      moveFileToFolder(fileId, folderId)
    }
    onClose()
  }, [fileIds, moveFileToFolder, onClose])

  const handleCreate = useCallback(() => {
    const name = query.trim() || '新文件夹'
    const folderId = addCustomFolder(name)
    for (const fileId of fileIds) {
      moveFileToFolder(fileId, folderId)
    }
    onClose()
  }, [query, fileIds, addCustomFolder, moveFileToFolder, onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        // Shift+Enter: 创建新文件夹并移入
        handleCreate()
      } else if (filtered.length > 0 && activeIndex < filtered.length) {
        // Enter: 移动到选中的文件夹
        handleMove(filtered[activeIndex].id)
      }
    }
  }, [onClose, filtered, activeIndex, handleMove, handleCreate])

  // 点击背景关闭
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]"
      onClick={handleBackdropClick}
    >
      {/* 半透明背景 */}
      <div className="absolute inset-0 bg-black/20" onClick={handleBackdropClick} />

      {/* 弹窗主体 */}
      <div className="relative w-[420px] max-h-[60vh] bg-white rounded-xl shadow-2xl border border-apple-border-light flex flex-col overflow-hidden">
        {/* 标题 */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <span className="text-xs text-apple-text-secondary font-medium">输入文件夹名称</span>
          <button
            onClick={onClose}
            className="w-5 h-5 flex items-center justify-center rounded-full text-apple-text-tertiary hover:bg-apple-bg-secondary transition-colors"
            title="关闭"
          >
            ✕
          </button>
        </div>

        {/* 搜索框 */}
        <div className="px-4 py-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索文件夹..."
            className="w-full text-sm px-3 py-2 border border-apple-border-light rounded-lg bg-apple-bg-secondary outline-none focus:border-brand/40 focus:ring-1 focus:ring-brand/20 transition-all"
          />
        </div>

        {/* 文件夹列表 */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-2 pb-2">
          {filtered.length === 0 ? (
            <div className="px-2 py-3 text-xs text-apple-text-tertiary text-center">
              {customFolders.length === 0 ? '暂无文件夹' : '没有匹配的文件夹'}
              {query.trim() && (
                <div className="mt-1">
                  按 <kbd className="px-1 py-0.5 bg-apple-bg-secondary rounded text-[10px] border border-apple-border-light">Shift</kbd> + <kbd className="px-1 py-0.5 bg-apple-bg-secondary rounded text-[10px] border border-apple-border-light">↵</kbd> 创建「{query.trim()}」
                </div>
              )}
            </div>
          ) : (
            filtered.map((folder, idx) => (
              <button
                key={folder.id}
                data-folder-item
                onClick={() => handleMove(folder.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                  idx === activeIndex
                    ? 'bg-brand/10 text-brand'
                    : 'text-apple-text hover:bg-apple-bg-secondary'
                }`}
              >
                <span className="truncate">{folder.path}</span>
              </button>
            ))
          )}
        </div>

        {/* 底部快捷键提示 */}
        <div className="px-4 py-2 border-t border-apple-border-light flex items-center justify-center gap-4 text-[10px] text-apple-text-tertiary">
          <span>
            <kbd className="px-1 py-0.5 bg-apple-bg-secondary rounded border border-apple-border-light">↑↓</kbd> 导航
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-apple-bg-secondary rounded border border-apple-border-light">↵</kbd> 移动
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-apple-bg-secondary rounded border border-apple-border-light">shift</kbd> + <kbd className="px-1 py-0.5 bg-apple-bg-secondary rounded border border-apple-border-light">↵</kbd> 创建
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-apple-bg-secondary rounded border border-apple-border-light">esc</kbd> 退出
          </span>
        </div>
      </div>
    </div>
  )
}
