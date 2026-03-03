import { Plus, X, Users, LayoutGrid, MessageCircle, History, Clapperboard } from 'lucide-react'

interface Props {
  activePanel: string | null
  onTogglePanel: (panel: string) => void
}

const tools = [
  { id: 'add', icon: Plus, activeIcon: X, label: '添加节点' },
  { id: 'character', icon: Users, label: '人物' },
  { id: 'storyboard', icon: LayoutGrid, label: '分镜' },
  { id: 'dialogue', icon: MessageCircle, label: '对话' },
  { id: 'history', icon: History, label: '历史' },
  { id: 'scenes', icon: Clapperboard, label: '场景' },
]

export default function CanvasLeftToolbar({ activePanel, onTogglePanel }: Props) {
  return (
    <div className="w-12 flex-shrink-0 bg-[#0d0d0d] flex flex-col items-center py-3 gap-1 z-30">
      {tools.map(tool => {
        const isActive = activePanel === tool.id
        const Icon = isActive && tool.activeIcon ? tool.activeIcon : tool.icon

        return (
          <button
            key={tool.id}
            onClick={() => onTogglePanel(tool.id)}
            className={`group relative w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              isActive
                ? 'bg-white/10 text-white'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
            title={tool.label}
          >
            <Icon className="w-[18px] h-[18px]" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-xs text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {tool.label}
            </span>
          </button>
        )
      })}

      {/* 底部头像 */}
      <div className="mt-auto">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
          <span className="text-[10px] text-white font-bold">🐙</span>
        </div>
      </div>
    </div>
  )
}
