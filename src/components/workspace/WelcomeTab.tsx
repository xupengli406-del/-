import { useMemo } from 'react'
import { FileText, Image, Video, Music, LayoutDashboard, X, Clock } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useCanvasStore } from '../../store/canvasStore'

const cards = [
  {
    key: 'script',
    icon: FileText,
    title: '故事/脚本生成',
    desc: '用 AI 编写剧本和故事大纲',
    color: 'text-blue-500',
    bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300',
  },
  {
    key: 'image',
    icon: Image,
    title: '分镜图片生成',
    desc: '生成角色立绘、场景和分镜图',
    color: 'text-purple-500',
    bg: 'bg-purple-50 hover:bg-purple-100 border-purple-200 hover:border-purple-300',
  },
  {
    key: 'video',
    icon: Video,
    title: '分镜视频生成',
    desc: '将静态分镜转化为动态视频',
    color: 'text-rose-500',
    bg: 'bg-rose-50 hover:bg-rose-100 border-rose-200 hover:border-rose-300',
  },
  {
    key: 'audio',
    icon: Music,
    title: '音乐音效生成',
    desc: '生成配乐、音效和角色配音',
    color: 'text-amber-500',
    bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200 hover:border-amber-300',
  },
  {
    key: 'canvas',
    icon: LayoutDashboard,
    title: '画布自由创作',
    desc: '在画布上自由组合各类节点',
    color: 'text-teal-500',
    bg: 'bg-teal-50 hover:bg-teal-100 border-teal-200 hover:border-teal-300',
  },
] as const

export default function WelcomeTab() {
  const { openDocument, openDocumentInPlace, closeTab, activePaneId } = useWorkspaceStore()

  // 只订阅 canvasFiles 数组引用，不订阅整个 store
  const canvasFiles = useCanvasStore((s) => s.canvasFiles)

  // 最近文件：按 updatedAt 降序取前 3 个（用 useMemo 稳定引用）
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

  // 关闭当前 welcome 标签页
  const handleClose = () => {
    const state = useWorkspaceStore.getState()
    const pane = findLeaf(state.paneLayout, activePaneId)
    if (!pane) return
    const idx = pane.activeTabIndex
    if (idx >= 0) {
      closeTab(activePaneId, idx)
    }
  }

  // 打开最近文件
  const handleOpenRecent = (fileId: string) => {
    const store = useCanvasStore.getState()
    store.setEditingProjectId(fileId)
    openDocument({ type: 'canvas', id: fileId })
  }

  // 格式化时间
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
    <div className="flex-1 flex items-center justify-center bg-white">
      <div className="max-w-3xl w-full text-center space-y-10 px-6">
        {/* 标语 */}
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold text-apple-text tracking-wide">
            技术让创作变得容易，人类让创作变得伟大
          </h1>
          <p className="text-sm text-apple-text-secondary">
            你想从哪里开始？
          </p>
        </div>

        {/* 五个卡片 — 一行排列 */}
        <div className="flex justify-center gap-3">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <button
                key={card.key}
                onClick={() => handleClick(card.key)}
                className={`flex flex-col items-center gap-2.5 w-[120px] p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${card.bg}`}
              >
                <Icon size={26} className={card.color} strokeWidth={1.5} />
                <span className="text-xs font-medium text-apple-text leading-tight">{card.title}</span>
                <span className="text-[10px] text-apple-text-tertiary leading-tight">{card.desc}</span>
              </button>
            )
          })}
        </div>

        {/* 最近打开 */}
        {recentFiles.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-apple-text-tertiary flex items-center justify-center gap-1.5">
              <Clock size={12} />
              最近打开
            </p>
            <div className="flex justify-center gap-3">
              {recentFiles.map((file) => (
                <button
                  key={file.id}
                  onClick={() => handleOpenRecent(file.id)}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-apple-border-light bg-white hover:bg-apple-bg-secondary transition-colors text-left min-w-[160px] max-w-[200px]"
                >
                  <LayoutDashboard size={14} className="text-apple-text-tertiary flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-apple-text truncate">{file.name}</div>
                    <div className="text-[10px] text-apple-text-tertiary">{formatTime(file.updatedAt)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 关闭标签页 */}
        <div>
          <button
            onClick={handleClose}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs text-apple-text-tertiary hover:text-apple-text-secondary transition-colors"
          >
            <X size={12} />
            关闭标签页
          </button>
        </div>
      </div>
    </div>
  )
}

// 辅助：在 pane 树中查找叶子节点
function findLeaf(node: import('../../store/workspaceTypes').PaneNode, id: string): import('../../store/workspaceTypes').PaneLeaf | null {
  if (node.kind === 'leaf') return node.id === id ? node : null
  for (const child of node.children) {
    const found = findLeaf(child, id)
    if (found) return found
  }
  return null
}
