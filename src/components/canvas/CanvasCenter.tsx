import { useState } from 'react'
import { MousePointer, Type, Image, Sparkles, Music, Layers } from 'lucide-react'

interface Props {
  zoom: number
}

const quickActions = [
  { icon: Type, label: '文字生视频' },
  { icon: Image, label: '图片换背景' },
  { icon: Sparkles, label: '首帧生成视频' },
  { icon: Music, label: '音频生视频' },
  { icon: Layers, label: '工作流' },
]

export default function CanvasCenter({ zoom }: Props) {
  const [nodes, setNodes] = useState<any[]>([])

  const handleDoubleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setNodes(prev => [...prev, {
      id: Date.now(),
      x,
      y,
      type: 'text',
      content: '双击编辑...',
    }])
  }

  return (
    <div
      className="flex-1 relative overflow-hidden"
      onDoubleClick={handleDoubleClick}
    >
      {/* 画布网格背景 */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: `${20 * zoom / 100}px ${20 * zoom / 100}px`,
        }}
      />

      {/* 节点渲染 */}
      {nodes.map(node => (
        <div
          key={node.id}
          className="absolute bg-[#1a1a1a] border border-white/10 rounded-lg p-3 min-w-[120px] cursor-move hover:border-white/20 transition-colors"
          style={{ left: node.x - 60, top: node.y - 20 }}
        >
          <p className="text-xs text-gray-300">{node.content}</p>
        </div>
      ))}

      {/* 空状态：中心提示 */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 mb-5 pointer-events-auto">
            <span className="flex items-center gap-1.5 bg-[#2a2a2a] text-gray-300 text-xs px-3 py-1.5 rounded-md">
              <MousePointer className="w-3 h-3" />
              双击
            </span>
            <span className="text-sm text-gray-500">画布自由生成,或查看工作流模板</span>
          </div>

          {/* 快捷操作按钮 */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {quickActions.map((action, i) => (
              <button
                key={i}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1e1e1e] border border-white/10 hover:border-white/20 hover:bg-[#252525] text-xs text-gray-300 transition-all"
              >
                <action.icon className="w-3.5 h-3.5 text-gray-400" />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
