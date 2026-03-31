import { useMemo } from 'react'
import { Image, Film, Clock } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useCanvasStore } from '../../store/canvasStore'

const cards = [
  {
    key: 'image',
    icon: Image,
    title: '分镜图片生成',
    desc: '面向单张分镜画面的生成与版本迭代',
    iconBg: '#FAF5FF',
    iconColor: '#9333EA',
    stagger: 'stagger-1',
  },
  {
    key: 'video',
    icon: Film,
    title: '视频生成',
    desc: '面向镜头动态内容的视频生成与版本迭代',
    iconBg: '#FFF1F2',
    iconColor: '#E11D48',
    stagger: 'stagger-2',
  },
]

export default function WelcomeTab({ paneId }: { paneId?: string }) {
  const { openDocument, openDocumentInPlace } = useWorkspaceStore()

  const canvasFiles = useCanvasStore((s) => s.canvasFiles)

  const recentFiles = useMemo(
    () => [...canvasFiles]
      .filter((file) => file.projectType === 'image' || file.projectType === 'video')
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 3),
    [canvasFiles]
  )

  const handleClick = (key: string) => {
    const cs = useCanvasStore.getState()
    if (key !== 'image' && key !== 'video') return

    const nameMap = {
      image: '新分镜图片',
      video: '新视频',
    } as const

    cs.updateCurrentCanvasFile()
    cs.clearCanvas()
    const fileId = cs.saveCanvasAsFile(nameMap[key], key)
    cs.setEditingProjectId(fileId)
    openDocumentInPlace({ type: key === 'image' ? 'imageGeneration' : 'videoGeneration', id: fileId }, paneId)
  }

  const handleOpenRecent = (fileId: string) => {
    const store = useCanvasStore.getState()
    const file = store.canvasFiles.find((item) => item.id === fileId)
    if (!file) return

    store.setEditingProjectId(fileId)
    openDocument({
      type: file.projectType === 'video' ? 'videoGeneration' : 'imageGeneration',
      id: fileId,
    })
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

        {/* 两个核心功能卡片 */}
        <section className="grid grid-cols-2 gap-4 mb-20 max-w-3xl">
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
