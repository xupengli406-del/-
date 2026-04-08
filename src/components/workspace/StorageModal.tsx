import { useMemo, useState } from 'react'
import { X, Trash2, Image, Film, Upload, HardDrive } from 'lucide-react'
import { useAccountStore, type StorageAssetFilter } from '../../store/accountStore'

const filterTabs: { key: StorageAssetFilter; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: '全部', icon: <HardDrive size={12} /> },
  { key: 'image', label: '图片', icon: <Image size={12} /> },
  { key: 'video', label: '视频', icon: <Film size={12} /> },
  { key: 'upload', label: '上传', icon: <Upload size={12} /> },
]

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const val = bytes / Math.pow(1024, i)
  return `${val < 10 ? val.toFixed(1) : Math.round(val)} ${units[i]}`
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

const typeLabels: Record<string, string> = {
  image: '图片',
  video: '视频',
  upload: '上传',
}

interface StorageModalProps {
  open: boolean
  onClose: () => void
}

export default function StorageModal({ open, onClose }: StorageModalProps) {
  const {
    storageQuota,
    storageAssets,
    storageAssetFilter,
    setStorageAssetFilter,
    deleteStorageAsset,
  } = useAccountStore()

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const usedPercent = storageQuota.total > 0 ? (storageQuota.used / storageQuota.total) * 100 : 0

  const breakdownItems = useMemo(() => {
    const total = storageQuota.used || 1
    return [
      { label: '图片', bytes: storageQuota.breakdown.images, color: 'bg-blue-500', percent: (storageQuota.breakdown.images / total) * 100 },
      { label: '视频', bytes: storageQuota.breakdown.videos, color: 'bg-violet-500', percent: (storageQuota.breakdown.videos / total) * 100 },
      { label: '上传', bytes: storageQuota.breakdown.uploads, color: 'bg-amber-500', percent: (storageQuota.breakdown.uploads / total) * 100 },
    ]
  }, [storageQuota])

  const filteredAssets = storageAssets.filter((a) => {
    if (storageAssetFilter === 'all') return true
    return a.type === storageAssetFilter
  })

  const handleDelete = (assetId: string) => {
    setDeletingId(assetId)
    setTimeout(() => {
      deleteStorageAsset(assetId)
      setDeletingId(null)
    }, 300)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/25 px-6 backdrop-blur-[2px]">
      <div className="w-full max-w-[580px] rounded-[24px] border border-black/5 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h3 className="text-[18px] font-semibold text-slate-900">存储空间管理</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* 总用量 */}
        <div className="px-6 pb-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-end justify-between mb-2">
              <div>
                <div className="text-[11px] text-slate-400 mb-0.5">已用空间</div>
                <div className="text-[22px] font-bold text-slate-900 leading-tight">
                  {formatBytes(storageQuota.used)}
                  <span className="text-[13px] font-medium text-slate-400 ml-1">/ {formatBytes(storageQuota.total)}</span>
                </div>
              </div>
              <div className="text-[12px] text-slate-500 font-medium">
                {usedPercent.toFixed(1)}%
              </div>
            </div>

            {/* 进度条 */}
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  usedPercent > 90 ? 'bg-red-500' : usedPercent > 70 ? 'bg-amber-500' : 'bg-brand'
                }`}
                style={{ width: `${Math.min(usedPercent, 100)}%` }}
              />
            </div>

            {/* 分类占用 */}
            <div className="mt-3 grid grid-cols-3 gap-3">
              {breakdownItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${item.color}`} />
                  <div>
                    <div className="text-[10px] text-slate-400">{item.label}</div>
                    <div className="text-[12px] font-semibold text-slate-700">{formatBytes(item.bytes)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab 筛选 */}
        <div className="flex gap-1 px-6 pb-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStorageAssetFilter(tab.key)}
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                storageAssetFilter === tab.key
                  ? 'bg-brand/10 text-brand'
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* 资产列表 */}
        <div className="max-h-[280px] overflow-y-auto px-3 pb-2">
          {filteredAssets.length === 0 ? (
            <div className="py-8 text-center text-[12px] text-slate-400">暂无资产</div>
          ) : (
            filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50 ${
                  deletingId === asset.id ? 'opacity-40 scale-95' : ''
                }`}
              >
                {/* 缩略图占位 */}
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                  asset.type === 'image' ? 'bg-blue-50 text-blue-500' :
                  asset.type === 'video' ? 'bg-violet-50 text-violet-500' :
                  'bg-amber-50 text-amber-500'
                }`}>
                  {asset.type === 'image' ? <Image size={16} /> :
                   asset.type === 'video' ? <Film size={16} /> :
                   <Upload size={16} />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium text-slate-800 truncate">{asset.name}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400">
                    <span>{typeLabels[asset.type]}</span>
                    <span>{formatBytes(asset.size)}</span>
                    <span>{formatDate(asset.createdAt)}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(asset.id)}
                  disabled={deletingId === asset.id}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                  title="删除释放空间"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* 底部提示 */}
        <div className="px-6 py-4 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 text-center">
            删除资产将永久释放存储空间，已删除内容不可恢复
          </p>
        </div>
      </div>
    </div>
  )
}
