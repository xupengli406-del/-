import {
  LayoutGrid,
  Type,
  ImageIcon,
  Video,
  Music,
  Search,
  List,
  ArrowUpDown,
} from 'lucide-react'
import { useState } from 'react'
import type { AssetSortBy, AssetSortOrder, AssetViewMode } from '../../store/types'

type AssetTab = 'canvas' | 'text' | 'image' | 'video' | 'audio'

const tabs: { key: AssetTab; label: string; icon: typeof LayoutGrid }[] = [
  { key: 'canvas', label: '画布', icon: LayoutGrid },
  { key: 'text', label: '文本', icon: Type },
  { key: 'image', label: '图片', icon: ImageIcon },
  { key: 'video', label: '视频', icon: Video },
  { key: 'audio', label: '音频', icon: Music },
]

const sortOptions: { label: string; value: AssetSortBy }[] = [
  { label: '按时间', value: 'createdAt' },
  { label: '按名称', value: 'name' },
  { label: '按类型', value: 'type' },
]

interface AssetToolbarProps {
  activeTab: AssetTab
  onTabChange: (tab: AssetTab) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  sortBy: AssetSortBy
  sortOrder: AssetSortOrder
  onSortChange: (sortBy: AssetSortBy, order: AssetSortOrder) => void
  viewMode: AssetViewMode
  onViewModeChange: (mode: AssetViewMode) => void
}

export default function AssetToolbar({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  sortBy,
  sortOrder,
  onSortChange,
  viewMode,
  onViewModeChange,
}: AssetToolbarProps) {
  const [showSortMenu, setShowSortMenu] = useState(false)

  return (
    <div className="flex items-center justify-between px-8 pt-6 pb-3">
      {/* 左侧：分类标签 */}
      <div className="flex items-center gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-apple-text-secondary hover:text-apple-text hover:bg-apple-bg-secondary'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 右侧：搜索 + 排序 + 视图切换 */}
      <div className="flex items-center gap-3">
        {/* 搜索框 */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-apple-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索素材..."
            className="h-8 w-[180px] pl-9 pr-3 text-sm rounded-lg border border-apple-border-light bg-apple-bg-secondary focus:border-brand focus:bg-white outline-none transition-colors placeholder-apple-text-tertiary"
          />
        </div>

        {/* 排序下拉 */}
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="h-8 px-3 flex items-center gap-1.5 text-xs text-apple-text-secondary rounded-lg border border-apple-border-light hover:border-apple-border bg-white transition-colors"
          >
            <ArrowUpDown size={12} />
            {sortOptions.find((o) => o.value === sortBy)?.label || '排序'}
          </button>
          {showSortMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl border border-apple-border-light shadow-lg overflow-hidden z-50">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      if (sortBy === opt.value) {
                        onSortChange(opt.value, sortOrder === 'asc' ? 'desc' : 'asc')
                      } else {
                        onSortChange(opt.value, 'desc')
                      }
                      setShowSortMenu(false)
                    }}
                    className={`w-full px-3 py-2 text-xs text-left transition-colors flex items-center justify-between ${
                      sortBy === opt.value ? 'text-brand bg-brand-50' : 'text-apple-text hover:bg-apple-bg-secondary'
                    }`}
                  >
                    {opt.label}
                    {sortBy === opt.value && (
                      <span className="text-[10px] text-apple-text-tertiary">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 视图切换 */}
        <div className="flex rounded-lg border border-apple-border-light overflow-hidden">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`w-8 h-8 flex items-center justify-center transition-colors ${
              viewMode === 'grid'
                ? 'bg-brand text-white'
                : 'bg-white text-apple-text-tertiary hover:text-apple-text hover:bg-apple-bg-secondary'
            }`}
            title="网格视图"
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`w-8 h-8 flex items-center justify-center transition-colors ${
              viewMode === 'list'
                ? 'bg-brand text-white'
                : 'bg-white text-apple-text-tertiary hover:text-apple-text hover:bg-apple-bg-secondary'
            }`}
            title="列表视图"
          >
            <List size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
