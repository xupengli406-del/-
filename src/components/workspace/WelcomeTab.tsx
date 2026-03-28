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
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
    stagger: 'stagger-1',
  },
  {
    key: 'image',
    icon: Image,
    title: '分镜图片生成',
    desc: '精准呈现视觉构图与氛围',
    iconBg: '#FAF5FF',
    iconColor: '#9333EA',
    stagger: 'stagger-2',
  },
  {
    key: 'video',
    icon: Film,
    title: '分镜视频生成',
    desc: '为静态分镜注入动态生命力',
    iconBg: '#FFF1F2',
    iconColor: '#E11D48',
    stagger: 'stagger-3',
  },
  {
    key: 'audio',
    icon: Music,
    title: '音乐音效生成',
    desc: 'AI合成专属的电影感声效',
    iconBg: '#FFFBEB',
    iconColor: '#D97706',
    stagger: 'stagger-4',
  },
  {
    key: 'canvas',
    icon: PenTool,
    title: '画布自由创作',
    desc: '在无限画布上开始您的灵感',
    iconBg: '#F0FDFA',
    iconColor: '#0D9488',
    dashed: true,
    stagger: 'stagger-5',
  },
]

export default function WelcomeTab({ paneId }: { paneId?: string }) {
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
        openDocumentInPlace({ type: 'script', id: nodeId }, paneId)
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
        openDocumentInPlace({ type: 'ai', id: fileId }, paneId)
        break
      }
      case 'canvas': {
        cs.clearCanvas()
        const canvasFileId = cs.saveCanvasAsFile('新画布', 'canvas')
        cs.setEditingProjectId(canvasFileId)
        openDocumentInPlace({ type: 'canvas', id: canvasFileId }, paneId)
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
    <div className="flex-1 h-full overflow-y-auto bg-white relative" style={{ lineHeight: 1.7 }}>
      {/* 装饰性渐变背景 */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-[#1D51DF]/5 via-transparent to-[#6E567D]/5 opacity-40" />

      <div className="relative max-w-6xl mx-auto px-12 pt-24 pb-12 z-10">
        {/* 标语 */}
        <section className="mb-20 fade-in-up">
          <h1 className="text-[2.75rem] font-bold tracking-tight text-ds-on-background leading-tight mb-4">
            技术让创作变得容易，<br />
            人类让创作变得伟大
          </h1>
          <p className="text-lg text-ds-on-surface-variant font-medium">
            你想从哪里开始？
          </p>
        </section>

        {/* 五个功能卡片 */}
        <section className="grid grid-cols-5 gap-4 mb-20">
          {cards.map((card) => {
            const Icon = card.icon
            const isDashed = 'dashed' in card && card.dashed
            return (
              <button
                key={card.key}
                onClick={() => handleClick(card.key)}
                className={`fade-in-up ${card.stagger} group flex flex-col items-start p-6 bg-white rounded-2xl cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:shadow-[#1D51DF]/5 transition-all duration-300 ${
                  isDashed
                    ? 'border-dashed border-2 border-ds-outline-variant/30'
                    : 'border border-ds-outline-variant/20'
                }`}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-colors"
                  style={{ backgroundColor: card.iconBg }}
                >
                  <Icon size={22} style={{ color: card.iconColor }} strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-bold text-ds-on-surface mb-2 text-left">{card.title}</h3>
                <p className="text-xs text-ds-on-surface-variant leading-relaxed text-left">{card.desc}</p>
              </button>
            )
          })}
        </section>

        {/* 最近打开 */}
        {recentFiles.length > 0 && (
          <section className="fade-in-up stagger-5">
            <div className="flex items-center gap-2 mb-6 opacity-80">
              <Clock size={14} />
              <h2 className="text-sm font-semibold tracking-wider text-ds-on-surface uppercase">最近打开</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {recentFiles.map((file, i) => (
                <button
                  key={file.id}
                  onClick={() => handleOpenRecent(file.id)}
                  className="inline-flex items-center bg-white px-4 py-2.5 rounded-full border border-ds-outline-variant/20 hover:bg-ds-surface-container-low transition-colors cursor-pointer"
                >
                  <span className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${i === 0 ? 'bg-brand' : 'bg-ds-on-surface-variant/20'}`} />
                  <span className="text-sm font-medium text-ds-on-surface">{file.name}</span>
                  <span className="mx-3 h-3 w-px bg-ds-outline-variant/40" />
                  <span className="text-xs text-ds-on-surface-variant">{formatTime(file.updatedAt)}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
