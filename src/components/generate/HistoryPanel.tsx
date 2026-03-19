import { PanelRightClose, PanelRight, Plus } from 'lucide-react'
import { useCanvasStore } from '../../store/canvasStore'
import { modeConfig } from './constants'

function formatRelativeTime(ts: number) {
  const diff = Date.now() - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  return new Date(ts).toLocaleDateString()
}

function getDateGroup(ts: number): string {
  const now = new Date()
  const date = new Date(ts)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)

  if (date >= today) return '今天'
  if (date >= yesterday) return '昨天'
  return '更早'
}

interface HistoryPanelProps {
  isOpen: boolean
  onToggle: () => void
  selectedItemId: string | null
  onSelectItem: (id: string) => void
  onNewChat?: () => void
}

export default function HistoryPanel({ isOpen, onToggle, selectedItemId, onSelectItem, onNewChat }: HistoryPanelProps) {
  const { generateHistory } = useCanvasStore()

  // 按日期分组
  const grouped = generateHistory.reduce<Record<string, typeof generateHistory>>((acc, item) => {
    const group = getDateGroup(item.createdAt)
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {})

  const groupOrder = ['今天', '昨天', '更早']

  return (
    <>
      {/* 折叠时的悬浮按钮组 - DeepSeek风格 */}
      {!isOpen && (
        <div className="fixed top-[72px] right-5 z-30 flex items-center gap-1 bg-white rounded-full border border-apple-border-light shadow-md p-1">
          <button
            onClick={onToggle}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-apple-bg-secondary transition-colors text-apple-text-secondary hover:text-apple-text"
            title="展开侧边栏"
          >
            <PanelRight size={18} />
          </button>
          <button
            onClick={onNewChat}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-apple-bg-secondary transition-colors text-apple-text-secondary hover:text-apple-text"
            title="新建对话"
          >
            <Plus size={18} />
          </button>
        </div>
      )}

      {/* 历史面板 - 右侧 */}
      <aside
        className={`panel-transition flex-shrink-0 bg-apple-bg-tertiary border-l border-apple-border-light flex flex-col overflow-hidden ${
          isOpen ? 'w-[260px]' : 'w-0'
        }`}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 min-w-[260px]">
          <h3 className="text-sm font-semibold text-apple-text">历史记录</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={onNewChat}
              className="p-1.5 rounded-lg text-apple-text-tertiary hover:text-apple-text hover:bg-apple-bg-secondary transition-colors"
              title="新建对话"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg text-apple-text-tertiary hover:text-apple-text hover:bg-apple-bg-secondary transition-colors"
              title="收起面板"
            >
              <PanelRightClose size={16} />
            </button>
          </div>
        </div>

        {/* 历史列表 */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 min-w-[260px]">
          {generateHistory.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-xs text-apple-text-tertiary">
              暂无历史记录
            </div>
          ) : (
            groupOrder.map((groupName) => {
              const items = grouped[groupName]
              if (!items || items.length === 0) return null
              return (
                <div key={groupName}>
                  <div className="px-2 pt-3 pb-1.5 text-[10px] font-medium text-apple-text-tertiary uppercase tracking-wider">
                    {groupName}
                  </div>
                  {items.map((item) => {
                    const Icon = modeConfig[item.mode].icon
                    const isSelected = selectedItemId === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => onSelectItem(item.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-150 ${
                          isSelected
                            ? 'bg-brand-50 border-l-2 border-brand'
                            : 'hover:bg-apple-bg-secondary border-l-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon size={13} className={isSelected ? 'text-brand' : 'text-apple-text-tertiary'} />
                          <span className={`text-xs font-medium truncate flex-1 ${isSelected ? 'text-brand' : 'text-apple-text'}`}>
                            {item.prompt.slice(0, 24) || modeConfig[item.mode].label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 pl-5">
                          <span className="text-[10px] text-apple-text-tertiary">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>
      </aside>
    </>
  )
}
