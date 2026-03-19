import { MessageSquare } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'

export default function AISidePanel() {
  const { openDocument } = useWorkspaceStore()

  return (
    <div className="h-full flex flex-col items-center justify-center px-4">
      <MessageSquare size={28} strokeWidth={1} className="text-apple-text-tertiary mb-3 opacity-40" />
      <p className="text-[11px] text-apple-text-tertiary text-center mb-3">
        AI 助手可以帮助你创作漫剧
      </p>
      <button
        onClick={() => openDocument({ type: 'ai', id: '__ai__' })}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-white bg-brand hover:bg-brand-dark rounded-md transition-colors"
      >
        <MessageSquare size={12} />
        打开 AI 助手
      </button>
    </div>
  )
}
