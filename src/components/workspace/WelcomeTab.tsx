import { useMemo } from 'react'
import { FileText, Image, Film, Music, PenTool, Clock } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useCanvasStore } from '../../store/canvasStore'

const cards = [
  {
    key: 'script',
    icon: FileText,
    title: '故事/脚本生成',
    desc: '利用AI重构宏大的叙事结构',
    iconBg: '#EEF2FF',
    iconColor: '#4A6CF7',
    stagger: 'stagger-1',
  },
  {
    key: 'image',
    icon: Image,
    title: '分镜图片生成',
    desc: '精准呈现视觉构图与氛围',
    iconBg: '#FDF2F8',
    iconColor: '#EC4899',
    stagger: 'stagger-2',
  },
  {
    key: 'video',
    icon: Film,
    title: '分镜视频生成',
    desc: '为静态分镜注入动态生命力',
    iconBg: '#FFF7ED',
    iconColor: '#F97316',
    stagger: 'stagger-3',
  },
  {
    key: 'audio',
    icon: Music,
    title: '音乐音效生成',
    desc: 'AI合成专属的电影感声效',
    iconBg: '#FEF2F2',
    iconColor: '#F87171',
    stagger: 'stagger-4',
  },
  {
    key: 'canvas',
    icon: PenTool,
    title: '画布自由创作',
    desc: '在无限画布上开始您的灵感',
    iconBg: '#F5F3FF',
    iconColor: '#8B5CF6',
    highlighted: true,
    stagger: 'stagger-5',
  },
]

export default function WelcomeTab() {
  const { openDocument, openDocumentInPlace } = useWorkspaceStore()

  const canvasFiles = useCanvasStore((s) => s.canvasFiles)

  const recentFiles = useMemo(
    () => [...canvasFiles].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3),
    [canvasFiles]
  )

  const handleClick = (key: string) => {
    const cs = useCanvasStore.getState()
    switch (key) {
      case 'script': {
        cs.updateCurrentCanvasFile()
        cs.clearCanvas()
        const nodeId = cs.addScriptNode()
        const fileId = cs.saveCanvasAsFile('新剧本', 'script')
        cs.setEditingProjectId(fileId)
        openDocumentInPlace({ type: 'script', id: nodeId })
        break
      }
      case 'image':
      case 'video':
      case 'audio': {
        const nameMap: Record<string, string> = {
          image: '新分镜图片',
          video: '新分镜视频',
          audio: '新音乐音效',
        }
        cs.updateCurrentCanvasFile()
        cs.clearCanvas()
        const fileId = cs.saveCanvasAsFile(nameMap[key], key as 'image' | 'video' | 'audio')
        cs.setEditingProjectId(fileId)
        cs.setInitialAIMode(key as 'image' | 'video' | 'audio')
        openDocumentInPlace({ type: 'ai', id: fileId })
        break
      }
      case 'canvas': {
        cs.clearCanvas()
        const canvasFileId = cs.saveCanvasAsFile('新画布', 'canvas')
        cs.setEditingProjectId(canvasFileId)
        openDocumentInPlace({ type: 'canvas', id: canvasFileId })
        break
      }
    }
  }

  const handleOpenRecent = (fileId: string) => {
    const store = useCanvasStore.getState()
    store.setEditingProjectId(fileId)
    openDocument({ type: 'canvas', id: fileId })
  }

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '刚刚'
    if (mins < 60) return `${mins} 分钟前`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} 小时前`
    const days = Math.floor(hours / 24)
    return `${days} 天前`
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-ds-surface relative">
      {/* 装饰性渐变背景 — 模拟 Stitch 蓝紫色光晕 */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[500px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 75% 15%, rgba(70, 112, 254, 0.12) 0%, rgba(139, 92, 246, 0.06) 35%, transparent 70%)',
        }}
      />
      {/* 右上角三角装饰 */}
      <svg className="absolute top-0 right-0 w-[260px] h-[220px] pointer-events-none opacity-[0.18]" viewBox="0 0 260 220" fill="none">
        <path d="M260 0L260 220L60 0Z" fill="url(#deco-grad)" />
        <defs><linearGradient id="deco-grad" x1="160" y1="0" x2="260" y2="220"><stop stopColor="#4670FE" /><stop offset="1" stopColor="#EBCCFB" /></linearGradient></defs>
      </svg>

      <div className="relative max-w-[900px] mx-auto px-12 pt-[72px] pb-16">
        {/* 标语 */}
        <h1 className="text-[34px] font-bold text-ds-on-background leading-[1.4] tracking-[-0.02em] fade-in-up">
          技术让创作变得容易，<br />
          人类让创作变得伟大
        </h1>
        <p className="mt-4 text-[15px] text-ds-on-surface-variant fade-in-up stagger-1">
          你想从哪里开始？
        </p>

        {/* 五个功能卡片 */}
        <div className="mt-12 flex gap-4">
          {cards.map((card) => {
            const Icon = card.icon
            const isHighlighted = 'highlighted' in card && card.highlighted
            return (
              <button
                key={card.key}
                onClick={() => handleClick(card.key)}
                className={`card-atelier fade-in-up ${card.stagger} group flex flex-col items-start gap-3 flex-1 min-w-0 p-5 bg-ds-surface-container-lowest rounded-ds-xl cursor-pointer`}
                style={isHighlighted ? { borderColor: 'rgba(139, 92, 246, 0.25)' } : undefined}
              >
                <div
                  className="w-11 h-11 rounded-ds-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: card.iconBg }}
                >
                  <Icon size={22} style={{ color: card.iconColor }} strokeWidth={1.5} />
                </div>
                <div className="text-left">
                  <div className="text-[13px] font-semibold text-ds-on-surface">{card.title}</div>
                  <div className="mt-1.5 text-[11px] text-ds-on-surface-variant leading-[1.6]">{card.desc}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* 最近打开 */}
        {recentFiles.length > 0 && (
          <div className="mt-14 fade-in-up stagger-5">
            <div className="flex items-center gap-2 text-[13px] text-ds-on-surface-variant mb-4">
              <Clock size={14} />
              <span>最近打开</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {recentFiles.map((file, i) => (
                <div key={file.id} className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenRecent(file.id)}
                    className="card-atelier flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-ds-surface-container-lowest hover:shadow-float transition-all"
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? 'bg-brand' : 'bg-ds-outline-variant'}`} />
                    <span className="text-[13px] text-ds-on-surface font-medium">{file.name}</span>
                    <span className="text-[11px] text-ds-on-surface-variant ml-1">{formatTime(file.updatedAt)}</span>
                  </button>
                  {i < recentFiles.length - 1 && (
                    <span className="w-px h-5 bg-ds-outline-variant/40 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
