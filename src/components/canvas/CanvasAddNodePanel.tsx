import { Type, Image, Film, Music, Upload, Sparkles } from 'lucide-react'

interface Props {
  activePanel: string
  onClose: () => void
}

const nodeTypes = [
  {
    icon: Type,
    label: '文本',
    badge: 'Gemini',
    badgeColor: 'bg-blue-500/20 text-blue-400',
    desc: '脚本、广告词、品牌文案',
  },
  {
    icon: Image,
    label: '图片',
    badge: 'AI Pro',
    badgeColor: 'bg-purple-500/20 text-purple-400',
    desc: '',
  },
  {
    icon: Film,
    label: '视频',
    badge: '',
    badgeColor: '',
    desc: '',
  },
  {
    icon: Music,
    label: '音频',
    badge: 'Beta',
    badgeColor: 'bg-green-500/20 text-green-400',
    desc: '',
  },
]

const resourceSection = {
  label: '添加资源',
}

export default function CanvasAddNodePanel({ activePanel, onClose }: Props) {
  if (activePanel !== 'add') {
    // 非"添加节点"面板的其他面板内容
    const panelTitles: Record<string, string> = {
      character: '人物管理',
      storyboard: '分镜管理',
      dialogue: '对话管理',
      history: '历史记录',
      scenes: '场景管理',
    }

    return (
      <div className="w-52 bg-[#141414] border-r border-white/5 flex-shrink-0 overflow-y-auto z-20">
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-4">
            {panelTitles[activePanel] || activePanel}
          </h3>
          <div className="text-xs text-gray-500 text-center py-8">
            暂无内容，开始创作吧
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-52 bg-[#141414] border-r border-white/5 flex-shrink-0 overflow-y-auto z-20">
      <div className="p-4">
        <h3 className="text-xs text-gray-500 mb-3 font-medium">添加节点</h3>

        <div className="space-y-1">
          {nodeTypes.map((node, i) => (
            <button
              key={i}
              className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
                <node.icon className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-gray-200">{node.label}</span>
                  {node.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${node.badgeColor}`}>
                      {node.badge}
                    </span>
                  )}
                </div>
                {node.desc && (
                  <p className="text-[11px] text-gray-600 mt-0.5">{node.desc}</p>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* 分割线 */}
        <div className="my-3 border-t border-white/5" />

        {/* 添加资源 */}
        <p className="text-xs text-gray-500 mb-2 font-medium">{resourceSection.label}</p>

        <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
            <Upload className="w-4 h-4 text-gray-400" />
          </div>
          <span className="text-sm text-gray-200">上传</span>
        </button>
      </div>
    </div>
  )
}
