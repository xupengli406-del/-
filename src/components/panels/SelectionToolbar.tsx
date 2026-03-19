import { useCanvasStore } from '../../store/canvasStore'
import { MessageSquarePlus, Download, Trash2 } from 'lucide-react'

export default function SelectionToolbar() {
  const { selectedNodeIds, addToConversation, deleteNodes } = useCanvasStore()

  if (selectedNodeIds.length === 0) return null

  const handleAddToChat = () => {
    addToConversation(selectedNodeIds)
  }

  const handleDelete = () => {
    deleteNodes(selectedNodeIds)
  }

  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-sm border border-apple-border-light rounded-full shadow-capsule">
      <span className="text-xs text-apple-text-secondary mr-1">
        选中 {selectedNodeIds.length} 项
      </span>

      <div className="w-px h-4 bg-apple-border-light" />

      <button
        onClick={handleAddToChat}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-brand hover:bg-brand-50 rounded-lg transition-colors"
      >
        <MessageSquarePlus size={14} />
        添加到对话
      </button>

      <button
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-apple-text-secondary hover:bg-apple-bg-secondary rounded-lg transition-colors"
        title="下载"
      >
        <Download size={14} />
        下载
      </button>

      <div className="w-px h-4 bg-apple-border-light" />

      <button
        onClick={handleDelete}
        className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        title="删除"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
