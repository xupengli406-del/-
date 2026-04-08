import { X } from 'lucide-react'
import { useAccountStore, type BalanceFilter } from '../../store/accountStore'

const filterTabs: { key: BalanceFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'consume', label: '消耗' },
  { key: 'acquire', label: '获得' },
]

function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

  if (diffDays === 0) return `今天 ${time}`
  if (diffDays === 1) return `昨天 ${time}`
  if (diffDays < 7) return `${diffDays}天前 ${time}`

  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${time}`
}

function formatAmount(amount: number): string {
  const abs = Math.abs(amount)
  const formatted = abs.toFixed(2)
  return amount >= 0 ? `+¥${formatted}` : `-¥${formatted}`
}

interface BalanceDetailModalProps {
  open: boolean
  onClose: () => void
}

export default function BalanceDetailModal({ open, onClose }: BalanceDetailModalProps) {
  const { balanceInfo, balanceRecords, balanceFilter, setBalanceFilter } = useAccountStore()

  const filteredRecords = balanceRecords.filter((r) => {
    if (balanceFilter === 'all') return true
    return r.type === balanceFilter
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/25 px-6 backdrop-blur-[2px]">
      <div className="w-full max-w-[560px] rounded-[24px] border border-black/5 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h3 className="text-[18px] font-semibold text-slate-900">余额详情</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* 四列分组数字 */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
              <div className="text-[10px] text-slate-400 mb-1">订阅余额</div>
              <div className="text-[16px] font-bold text-slate-800">
                {balanceInfo.subscription.toFixed(0)}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
              <div className="text-[10px] text-slate-400 mb-1">充值余额</div>
              <div className="text-[16px] font-bold text-slate-800">
                {balanceInfo.recharged.toFixed(0)}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
              <div className="text-[10px] text-slate-400 mb-1">赠送余额</div>
              <div className="text-[16px] font-bold text-slate-800">
                {balanceInfo.gifted.toFixed(0)}
              </div>
            </div>
            <div className="rounded-xl bg-brand/5 px-3 py-3 text-center">
              <div className="text-[10px] text-brand mb-1">总余额</div>
              <div className="flex items-center justify-center gap-1 text-[16px] font-bold text-brand">
                <span className="text-[12px]">¥</span>
                {balanceInfo.total.toFixed(0)}
              </div>
            </div>
          </div>
        </div>

        {/* Tab 筛选 */}
        <div className="flex gap-1 px-6 pb-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setBalanceFilter(tab.key)}
              className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors ${
                balanceFilter === tab.key
                  ? 'bg-brand/10 text-brand'
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 记录列表 */}
        <div className="max-h-[360px] overflow-y-auto px-3 pb-2">
          {filteredRecords.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-slate-400">暂无记录</div>
          ) : (
            filteredRecords.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between rounded-xl px-3 py-3 transition hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-slate-800 truncate">{record.event}</div>
                  <div className="mt-0.5 text-[11px] text-slate-400">{formatTime(record.timestamp)}</div>
                </div>
                <span
                  className={`ml-3 text-[14px] font-semibold flex-shrink-0 ${
                    record.amount > 0 ? 'text-emerald-600' : 'text-slate-500'
                  }`}
                >
                  {formatAmount(record.amount)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* 底部 */}
        <div className="px-6 py-4 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 text-center">
            仅展示近 1 个月明细
          </p>
        </div>
      </div>
    </div>
  )
}
