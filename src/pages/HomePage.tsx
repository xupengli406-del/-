import { useNavigate } from 'react-router-dom'
import { Sparkles, Play, Layers, Wand2 } from 'lucide-react'

const quickActions = [
  { icon: Sparkles, label: '创建新项目', desc: '开始AI漫剧创作', color: 'from-pink-500 to-purple-600' },
  { icon: Play, label: '章鱼TV', desc: '浏览精选漫剧', color: 'from-blue-500 to-cyan-500' },
  { icon: Layers, label: '工作流', desc: '使用预设工作流', color: 'from-orange-500 to-red-500' },
  { icon: Wand2, label: '工作空间', desc: '管理你的项目', color: 'from-green-500 to-emerald-500' },
]

export default function HomePage() {
  const navigate = useNavigate()

  const handleAction = (index: number) => {
    switch (index) {
      case 0: navigate('/workspace'); break
      case 1: navigate('/tv'); break
      case 2: navigate('/workflow'); break
      case 3: navigate('/workspace'); break
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Hero区域 */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-600/20 border border-pink-500/30">
          <svg viewBox="0 0 64 64" className="w-12 h-12">
            <ellipse cx="32" cy="22" rx="18" ry="16" fill="#FF69B4" />
            <circle cx="25" cy="20" r="3" fill="white" />
            <circle cx="39" cy="20" r="3" fill="white" />
            <circle cx="25" cy="21" r="1.5" fill="#1a1a2e" />
            <circle cx="39" cy="21" r="1.5" fill="#1a1a2e" />
            <ellipse cx="32" cy="28" rx="3" ry="1.5" fill="#E0559E" />
            <path d="M14 34 Q10 48 8 56 Q9 58 12 56 Q14 50 18 38" fill="#FF69B4" />
            <path d="M20 36 Q18 50 16 58 Q17 60 20 58 Q22 52 24 40" fill="#FF69B4" />
            <path d="M28 38 Q27 52 26 60 Q27 62 30 60 Q30 54 30 42" fill="#FF69B4" />
            <path d="M36 38 Q37 52 38 60 Q39 62 42 60 Q41 54 38 42" fill="#FF69B4" />
            <path d="M42 36 Q44 50 46 58 Q47 60 50 58 Q48 52 44 40" fill="#FF69B4" />
            <path d="M48 34 Q52 48 54 56 Q55 58 58 56 Q56 50 50 38" fill="#FF69B4" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold mb-3">
          欢迎使用 <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">Octopus</span>
        </h1>
        <p className="text-gray-400 text-lg">AI漫剧创作平台 — 让你的故事跃然纸上</p>
      </div>

      {/* 快捷入口 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
        {quickActions.map((action, i) => (
          <button
            key={i}
            onClick={() => handleAction(i)}
            className="group relative p-6 rounded-xl bg-[#161616] border border-white/5 hover:border-white/10 transition-all duration-300 text-left overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} mb-4`}>
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-white font-medium mb-1">{action.label}</h3>
            <p className="text-gray-500 text-sm">{action.desc}</p>
          </button>
        ))}
      </div>

      {/* 工作流预览 */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">工作流</h2>
          <button
            onClick={() => navigate('/workflow')}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            查看全部 &gt;
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {['漫画分镜生成', '角色设计', '场景绘制', '对话气泡', '剧本创作', '画质增强'].map((name, i) => (
            <div
              key={i}
              onClick={() => navigate('/workflow')}
              className="cursor-pointer group rounded-xl bg-[#161616] border border-white/5 hover:border-white/10 overflow-hidden transition-all"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <Layers className="w-8 h-8 text-gray-600 group-hover:text-pink-400 transition-colors" />
              </div>
              <div className="p-3">
                <p className="text-xs text-gray-300 truncate">{name}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
