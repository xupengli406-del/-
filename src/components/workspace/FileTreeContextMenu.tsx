import { useEffect, useRef } from 'react'
import {
  FolderPlus,
  FilePlus,
  Pencil,
  Trash2,
  ExternalLink,
  Columns,
  FolderInput,
  Copy,
  Bookmark,
} from 'lucide-react'

// 上下文菜单的目标类型
export type ContextMenuTarget =
  | { kind: 'file'; docId: import('../../store/workspaceTypes').DocumentId }
  | { kind: 'folder'; folderId: string }
  | { kind: 'multiSelect'; count: number }

interface FileTreeContextMenuProps {
  x: number
  y: number
  target: ContextMenuTarget
  onNewFile?: () => void
  onNewFolder?: () => void
  onOpenInNewTab?: () => void
  onOpenInNewGroup?: () => void
  onOpenInNewWindow?: () => void
  onDuplicate?: () => void
  onMoveTo?: () => void
  onBookmark?: () => void
  onRename?: () => void
  onDelete?: () => void
  onCreateFolderFromSelection?: () => void
  onClose: () => void
}

export default function FileTreeContextMenu({
  x, y, target, onNewFile, onNewFolder, onOpenInNewTab, onOpenInNewGroup, onOpenInNewWindow, onDuplicate, onMoveTo, onBookmark, onRename, onDelete, onCreateFolderFromSelection, onClose,
}: FileTreeContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // 根据目标类型构建菜单项（含分隔线，用 null 表示）
  type MenuItem = { icon: typeof FilePlus; label: string; onClick?: () => void; danger?: boolean } | null
  const items: MenuItem[] =
    target.kind === 'multiSelect'
      ? [
          { icon: FolderPlus, label: `使用选中的 ${target.count} 个对象创建新文件夹`, onClick: onCreateFolderFromSelection },
          { icon: FolderInput, label: '将文件移动到...', onClick: onMoveTo },
          null,
          { icon: Trash2, label: '删除', onClick: onDelete, danger: true },
        ]
      : target.kind === 'folder'
        ? [
            { icon: FilePlus, label: '新建文件', onClick: onNewFile },
            { icon: FolderPlus, label: '新建文件夹', onClick: onNewFolder },
            { icon: Pencil, label: '重命名', onClick: onRename },
            { icon: Trash2, label: '删除', onClick: onDelete, danger: true },
          ]
        : [
            { icon: ExternalLink, label: '在新标签页中打开', onClick: onOpenInNewTab },
            { icon: Columns, label: '在新标签组中打开', onClick: onOpenInNewGroup },
            null,
            { icon: Copy, label: '创建副本', onClick: onDuplicate },
            { icon: FolderInput, label: '将文件移动到...', onClick: onMoveTo },
            { icon: Bookmark, label: '收藏', onClick: onBookmark },
            null,
            { icon: Pencil, label: '重命名', onClick: onRename },
            { icon: Trash2, label: '删除', onClick: onDelete, danger: true },
          ]

  return (
    <div
      ref={ref}
      className="fixed z-[100] bg-white rounded-lg shadow-lg border border-apple-border-light py-1 min-w-[180px]"
      style={{ left: x, top: y }}
    >
      {items.map((item, i) => {
        if (!item) {
          return <div key={`sep-${i}`} className="h-px bg-apple-border-light my-1" />
        }
        return (
          <button
            key={i}
            onClick={() => { item.onClick?.(); onClose() }}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
              item.danger
                ? 'text-red-500 hover:bg-red-50'
                : 'text-apple-text hover:bg-apple-bg-secondary'
            }`}
          >
            <item.icon size={13} className="flex-shrink-0" />
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
