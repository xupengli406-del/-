import { Type, ImageIcon, Video, Music, Trash2 } from 'lucide-react'
import type { AssetItem } from '../../store/types'

const typeConfig: Record<string, { icon: typeof Type; label: string }> = {
  text: { icon: Type, label: '文本' },
  image: { icon: ImageIcon, label: '图片' },
  video: { icon: Video, label: '视频' },
  audio: { icon: Music, label: '音频' },
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

interface AssetListViewProps {
  assets: AssetItem[]
  onDelete: (id: string) => void
}

export default function AssetListView({ assets, onDelete }: AssetListViewProps) {
  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-apple-text-tertiary">
        <ImageIcon size={48} className="mb-3 opacity-30" />
        <p className="text-sm">暂无素材</p>
        <p className="text-xs text-apple-text-tertiary mt-1">上传或生成素材后将在此显示</p>
      </div>
    )
  }

  return (
    <div>
      {/* 表头 */}
      <div className="flex items-center px-4 py-2.5 text-[11px] font-medium text-apple-text-tertiary uppercase tracking-wider border-b border-apple-border-light">
        <span className="flex-1">名称</span>
        <span className="w-20 text-center">类型</span>
        <span className="w-32 text-center">创建时间</span>
        <span className="w-16 text-center">操作</span>
      </div>

      {/* 列表项 */}
      {assets.map((asset) => {
        const config = typeConfig[asset.type] || typeConfig.image
        const Icon = config.icon
        const isMedia = (asset.type === 'image' || asset.type === 'video') && asset.url

        return (
          <div
            key={asset.id}
            className="flex items-center px-4 py-3 hover:bg-apple-bg-secondary border-b border-apple-border-light/50 transition-colors group"
          >
            {/* 缩略图 */}
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-apple-bg-secondary flex-shrink-0 mr-3 flex items-center justify-center">
              {asset.type === 'video' && asset.url ? (
                <video src={asset.url} className="w-full h-full object-cover" muted preload="metadata" />
              ) : asset.type === 'image' && asset.url ? (
                <img src={asset.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Icon size={16} className="text-apple-text-tertiary" />
              )}
            </div>

            {/* 名称 */}
            <span className="flex-1 text-sm text-apple-text truncate pr-4">
              {asset.name}
            </span>

            {/* 类型标签 */}
            <span className="w-20 text-center">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] text-apple-text-secondary bg-apple-bg-secondary rounded-md">
                <Icon size={10} />
                {config.label}
              </span>
            </span>

            {/* 时间 */}
            <span className="w-32 text-center text-xs text-apple-text-tertiary">
              {formatRelativeTime(asset.createdAt)}
            </span>

            {/* 操作 */}
            <div className="w-16 flex justify-center">
              <button
                onClick={() => onDelete(asset.id)}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-apple-text-tertiary hover:text-red-500 hover:bg-red-50 transition-all"
                title="删除"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
