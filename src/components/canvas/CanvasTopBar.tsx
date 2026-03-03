import { useState, useRef, useEffect } from 'react'
import { Share2, Users, Coins } from 'lucide-react'
import OctopusLogo from '../OctopusLogo'

interface Props {
  projectName: string
  onProjectNameChange: (name: string) => void
  onBack: () => void
  onToggleAI: () => void
  showAIPanel: boolean
}

export default function CanvasTopBar({ projectName, onProjectNameChange, onBack, onToggleAI, showAIPanel }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleBlur = () => {
    setIsEditing(false)
    if (!projectName.trim()) {
      onProjectNameChange('Untitled')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false)
    }
  }

  return (
    <div className="h-12 bg-[#0d0d0d] border-b border-white/5 flex items-center justify-between px-4 flex-shrink-0 z-40">
      {/* 左侧：Logo + 项目名 */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="hover:opacity-80 transition-opacity">
          <OctopusLogo className="w-7 h-7" />
        </button>
        {isEditing ? (
          <input
            ref={inputRef}
            value={projectName}
            onChange={e => onProjectNameChange(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="bg-transparent border border-white/20 rounded px-2 py-0.5 text-sm text-white outline-none focus:border-pink-500/50 w-48"
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-gray-300 hover:text-white transition-colors"
          >
            {projectName}
          </button>
        )}
      </div>

      {/* 右侧：功能按钮 */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors border border-white/5">
          <Coins className="w-3.5 h-3.5" />
          赚取积分
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors border border-white/5">
          <span className="text-xs">🎨</span>
          4146
        </button>
        <button
          onClick={onToggleAI}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors border ${
            showAIPanel
              ? 'bg-pink-500/10 text-pink-400 border-pink-500/20'
              : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/5'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          社区
        </button>
        <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5">
          <Share2 className="w-3.5 h-3.5 text-gray-300" />
        </button>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center ml-1">
          <span className="text-[10px] text-white font-bold">U</span>
        </div>
      </div>
    </div>
  )
}
