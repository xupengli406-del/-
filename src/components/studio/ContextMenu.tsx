import { useEffect, useRef } from 'react'
import { Pencil, Trash2, Copy, FolderPlus, FilePlus, MoreHorizontal } from 'lucide-react'

export interface ContextMenuItem {
  label: string
  icon?: React.ElementType
  onClick: () => void
  danger?: boolean
  divider?: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  // 确保菜单不超出视口
  const adjustedX = Math.min(x, window.innerWidth - 200)
  const adjustedY = Math.min(y, window.innerHeight - items.length * 36 - 16)

  return (
    <div
      ref={menuRef}
      className="fixed z-[999] min-w-[180px] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl shadow-black/50 py-1.5 animate-in fade-in zoom-in-95 duration-100"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {items.map((item, i) => (
        <div key={i}>
          {item.divider && <div className="h-px bg-white/5 my-1" />}
          <button
            onClick={() => { item.onClick(); onClose() }}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors ${
              item.danger
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
            <span>{item.label}</span>
          </button>
        </div>
      ))}
    </div>
  )
}

// 快捷创建常用菜单项的工具
export function renameItem(onRename: () => void): ContextMenuItem {
  return { label: '重命名', icon: Pencil, onClick: onRename }
}

export function deleteItem(onDelete: () => void): ContextMenuItem {
  return { label: '删除', icon: Trash2, onClick: onDelete, danger: true, divider: true }
}

export function duplicateItem(onDuplicate: () => void): ContextMenuItem {
  return { label: '复制', icon: Copy, onClick: onDuplicate }
}

export function addSubItem(label: string, onAdd: () => void): ContextMenuItem {
  return { label, icon: FilePlus, onClick: onAdd }
}
