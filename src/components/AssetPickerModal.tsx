import { useState } from 'react'
import { useCanvasStore } from '../store/canvasStore'
import type { AssetItem } from '../store/types'
import {
  X,
  Type,
  ImageIcon,
  Video,
  Music,
  CheckCircle2,
} from 'lucide-react'

export type AssetPickerType = 'image' | 'video' | 'text' | 'audio'

// 每种素材类型对应的子标签
const tabsConfig: Record<AssetPickerType, { key: string; label: string }[]> = {
  image: [
    { key: 'all', label: '所有图片' },
    { key: 'hd', label: '超清' },
    { key: 'favorites', label: '收藏' },
  ],
  video: [
    { key: 'all', label: '所有视频' },
    { key: 'favorites', label: '收藏' },
  ],
  text: [
    { key: 'all', label: '所有文本' },
    { key: 'scripts', label: '剧本/脚本' },
    { key: 'favorites', label: '收藏' },
  ],
  audio: [
    { key: 'all', label: '所有音频' },
    { key: 'favorites', label: '收藏' },
  ],
}

const typeIcons: Record<AssetPickerType, typeof ImageIcon> = {
  image: ImageIcon,
  video: Video,
  text: Type,
  audio: Music,
}

const typeLabels: Record<AssetPickerType, { singular: string; counter: string }> = {
  image: { singular: '图片', counter: '张图片' },
  video: { singular: '视频', counter: '个视频' },
  text: { singular: '文本', counter: '个文本' },
  audio: { singular: '音频', counter: '个音频' },
}

interface AssetPickerModalProps {
  type: AssetPickerType
  open: boolean
  onClose: () => void
  onConfirm: (selectedAssets: AssetItem[]) => void
}

export default function AssetPickerModal({ type, open, onClose, onConfirm }: AssetPickerModalProps) {
  const { assets } = useCanvasStore()
  const [activeTab, setActiveTab] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const tabs = tabsConfig[type]
  const labels = typeLabels[type]
  const Icon = typeIcons[type]

  const filteredAssets = assets.filter((a) => {
    if (a.type !== type) return false
    return a.source === 'generate' || a.source === 'upload'
  })

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleConfirm = () => {
    const selected = filteredAssets.filter((a) => selectedIds.has(a.id))
    onConfirm(selected)
    setSelectedIds(new Set())
    onClose()
  }

  const handleClose = () => {
    setSelectedIds(new Set())
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 半透明遮罩 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* 弹窗主体 */}
      <div className="relative w-[900px] max-w-[90vw] max-h-[80vh] bg-white rounded-2xl border border-apple-border-light shadow-2xl flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-8 pt-7 pb-4">
          <h2 className="text-xl font-semibold text-apple-text">资产选取</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl hover:bg-apple-bg-secondary text-apple-text-tertiary hover:text-apple-text transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* 子标签栏 */}
        <div className="flex items-center gap-1 px-8 pb-5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2 text-sm rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-apple-text text-white'
                    : 'text-apple-text-secondary hover:text-apple-text hover:bg-apple-bg-secondary'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-8 pb-4">
          {filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-apple-text-tertiary">
              <Icon size={48} className="mb-3 opacity-30" />
              <p className="text-sm">暂无{labels.singular}素材</p>
              <p className="text-xs text-apple-text-tertiary mt-1">上传或生成素材后将在此显示</p>
            </div>
          ) : (
            <AssetPickerGrid
              assets={filteredAssets}
              type={type}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
            />
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-apple-border-light">
          <span className="text-sm text-apple-text-secondary">
            已选 {selectedIds.size} {labels.counter}
          </span>
          <button
            onClick={handleConfirm}
            className="px-8 py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-medium rounded-xl transition-colors"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== 素材网格 =====
function AssetPickerGrid({
  assets,
  type,
  selectedIds,
  onToggleSelect,
}: {
  assets: AssetItem[]
  type: AssetPickerType
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
}) {
  if (type === 'text') {
    return (
      <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {assets.map((asset) => {
          const isSelected = selectedIds.has(asset.id)
          return (
            <div
              key={asset.id}
              onClick={() => onToggleSelect(asset.id)}
              className={`relative cursor-pointer rounded-2xl overflow-hidden border-2 transition-all ${
                isSelected
                  ? 'border-brand ring-2 ring-brand/30'
                  : 'border-transparent hover:border-apple-border'
              }`}
            >
              <div className="aspect-[4/3] bg-apple-bg-secondary flex flex-col items-center justify-center gap-2 p-4">
                <Type size={28} className="text-brand opacity-60" />
                <span className="text-xs text-apple-text-secondary text-center truncate w-full">{asset.name}</span>
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 size={20} className="text-brand fill-brand/20" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {assets.map((asset) => {
        const isSelected = selectedIds.has(asset.id)
        const isMedia = asset.url && (asset.type === 'image' || asset.type === 'video')

        return (
          <div
            key={asset.id}
            onClick={() => onToggleSelect(asset.id)}
            className={`relative cursor-pointer rounded-2xl overflow-hidden border-2 transition-all ${
              isSelected
                ? 'border-brand ring-2 ring-brand/30'
                : 'border-transparent hover:border-apple-border'
            }`}
          >
            {asset.type === 'video' && asset.url ? (
              <video
                src={asset.url}
                className="w-full aspect-square object-cover"
                muted
                preload="metadata"
                draggable={false}
              />
            ) : isMedia ? (
              <img
                src={asset.url}
                alt={asset.name}
                className="w-full aspect-square object-cover"
                draggable={false}
              />
            ) : (
              <div className="aspect-square bg-apple-bg-secondary flex items-center justify-center">
                {type === 'video' ? (
                  <Video size={32} className="text-brand opacity-40" />
                ) : (
                  <ImageIcon size={32} className="text-brand opacity-40" />
                )}
              </div>
            )}
            {isSelected && (
              <div className="absolute top-2 right-2">
                <CheckCircle2 size={20} className="text-brand fill-brand/20" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
