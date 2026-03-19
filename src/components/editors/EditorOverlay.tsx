import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface EditorOverlayProps {
  title: string
  icon?: ReactNode
  onClose: () => void
  children: ReactNode
}

export default function EditorOverlay({ title, icon, onClose, children }: EditorOverlayProps) {
  // Esc 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white/95 backdrop-blur-sm">
      {/* 标题栏 */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-apple-border-light bg-white/80">
        {icon}
        <h2 className="text-sm font-semibold text-apple-text flex-1">{title}</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-apple-bg-secondary text-apple-text-secondary hover:text-apple-text transition-colors"
          title="关闭 (Esc)"
        >
          <X size={18} />
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
