import { useEffect, useRef } from 'react'
import {
  Trash2, Copy, Link2Off, Maximize2, Undo2, Redo2, Save
} from 'lucide-react'
import type { CanvasNodeType } from '../../../store/types'
import { ADD_NODE_ITEMS } from './constants'

interface CanvasContextMenuProps {
  x: number
  y: number
  // 上下文类型
  context: 'canvas' | 'node' | 'edge'
  // 画布右键回调
  onAddNode?: (type: CanvasNodeType) => void
  onFitView?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onSelectAll?: () => void
  onPaste?: () => void
  // 节点右键回调
  onDeleteNode?: () => void
  onDuplicateNode?: () => void
  onDisconnectNode?: () => void
  onSaveAsAsset?: () => void
  // 连线右键回调
  onDeleteEdge?: () => void
  // 关闭
  onClose: () => void
}

export default function CanvasContextMenu({
  x, y, context, onClose,
  onAddNode, onFitView, onUndo, onRedo, onSelectAll, onPaste,
  onDeleteNode, onDuplicateNode, onDisconnectNode, onSaveAsAsset,
  onDeleteEdge,
}: CanvasContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    setTimeout(() => {
      document.addEventListener('mousedown', handleClick)
      document.addEventListener('keydown', handleKey)
    }, 30)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  const adjustedX = Math.min(x, window.innerWidth - 220)
  const adjustedY = Math.min(y, window.innerHeight - 400)

  return (
    <div
      ref={ref}
      className="fixed z-[200] w-[200px] bg-[#1c1c20] border border-white/10 rounded-xl shadow-2xl shadow-black/60 py-1 animate-in fade-in zoom-in-95 duration-100"
      style={{ left: adjustedX, top: adjustedY }}
      onContextMenu={e => e.preventDefault()}
    >
      {context === 'canvas' && (
        <>
          {/* 添加节点区域 */}
          <div className="px-3 pt-1.5 pb-1 text-[10px] text-gray-500 uppercase tracking-wider font-medium">添加节点</div>
          {ADD_NODE_ITEMS.map(item => (
            <MenuItem key={item.type} icon={item.icon} label={item.label} shortcut={item.shortcut}
              onClick={() => { onAddNode?.(item.type); onClose() }} />
          ))}
          <Divider />
          <MenuItem icon={Maximize2} label="适应视图" shortcut="⌘0"
            onClick={() => { onFitView?.(); onClose() }} />
          <MenuItem icon={Undo2} label="撤销" shortcut="⌘Z"
            onClick={() => { onUndo?.(); onClose() }} />
          <MenuItem icon={Redo2} label="重做" shortcut="⌘⇧Z"
            onClick={() => { onRedo?.(); onClose() }} />
        </>
      )}

      {context === 'node' && (
        <>
          <MenuItem icon={Save} label="保存为素材"
            onClick={() => { onSaveAsAsset?.(); onClose() }} />
          <MenuItem icon={Copy} label="复制节点" shortcut="⌘D"
            onClick={() => { onDuplicateNode?.(); onClose() }} />
          <MenuItem icon={Link2Off} label="断开所有连线"
            onClick={() => { onDisconnectNode?.(); onClose() }} />
          <Divider />
          <MenuItem icon={Trash2} label="删除节点" shortcut="Del" danger
            onClick={() => { onDeleteNode?.(); onClose() }} />
        </>
      )}

      {context === 'edge' && (
        <>
          <MenuItem icon={Trash2} label="删除连线" shortcut="Del" danger
            onClick={() => { onDeleteEdge?.(); onClose() }} />
        </>
      )}
    </div>
  )
}

function MenuItem({ icon: Icon, label, shortcut, danger, onClick }: {
  icon: React.ElementType; label: string; shortcut?: string; danger?: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] transition-colors ${
        danger
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-gray-300 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
      <span className="flex-1 text-left">{label}</span>
      {shortcut && <span className="text-[10px] text-gray-600">{shortcut}</span>}
    </button>
  )
}

function Divider() {
  return <div className="h-px bg-white/5 my-1" />
}
