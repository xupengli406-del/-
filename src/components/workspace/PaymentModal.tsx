import { useState } from 'react'
import { X, Check } from 'lucide-react'

interface PaymentModalProps {
  planTitle: string
  price: string
  onClose: () => void
  onSuccess: () => void
}

const paymentMethods = [
  { key: 'wechat', label: '微信支付', color: '#07C160' },
  { key: 'alipay', label: '支付宝', color: '#1677FF' },
]

export default function PaymentModal({ planTitle, price, onClose, onSuccess }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState('wechat')
  const [agreed, setAgreed] = useState(false)
  const [paying, setPaying] = useState(false)

  const handlePay = () => {
    if (!agreed) return
    setPaying(true)
    // Mock: 模拟支付成功
    setTimeout(() => {
      setPaying(false)
      onSuccess()
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/30 px-6 backdrop-blur-[2px]">
      <div className="w-full max-w-[400px] rounded-[24px] border border-black/5 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
        {/* 标题 */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h3 className="text-[18px] font-semibold text-slate-900">
            扫码支付 <span className="text-brand">{price}</span>
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* 套餐信息 */}
        <div className="mx-6 mb-4 rounded-xl bg-slate-50 px-4 py-3">
          <div className="text-[12px] text-slate-400">购买方案</div>
          <div className="mt-0.5 text-[14px] font-semibold text-slate-800">{planTitle}</div>
        </div>

        {/* QR码区域（模拟） */}
        <div className="mx-6 mb-4 flex flex-col items-center">
          <div className="flex h-[180px] w-[180px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
            <div className="text-center">
              <div className="text-[32px]">📱</div>
              <div className="mt-2 text-[11px] text-slate-400">模拟二维码</div>
              <div className="text-[10px] text-slate-300">请使用手机扫码</div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">支付前请阅读</div>
        </div>

        {/* 支付方式选择 */}
        <div className="mx-6 mb-4">
          <div className="text-[12px] font-medium text-slate-500 mb-2">选择支付方式</div>
          <div className="flex gap-2">
            {paymentMethods.map((method) => (
              <button
                key={method.key}
                onClick={() => setSelectedMethod(method.key)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-[13px] font-medium transition ${
                  selectedMethod === method.key
                    ? 'border-brand bg-brand/5 text-brand'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span
                  className="inline-block h-4 w-4 rounded-full"
                  style={{ backgroundColor: method.color }}
                />
                {method.label}
                {selectedMethod === method.key && (
                  <Check size={14} className="text-brand" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 协议勾选 */}
        <div className="mx-6 mb-4 flex items-start gap-2">
          <button
            onClick={() => setAgreed(!agreed)}
            className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition ${
              agreed ? 'border-brand bg-brand' : 'border-slate-300'
            }`}
          >
            {agreed && <Check size={10} className="text-white" />}
          </button>
          <span className="text-[11px] leading-4 text-slate-400">
            我已阅读并同意「AI漫剧」
            <button className="text-brand hover:underline">付费服务协议</button>
            （含自动续费条款）
          </span>
        </div>

        {/* 确认按钮 */}
        <div className="px-6 pb-6">
          <button
            onClick={handlePay}
            disabled={!agreed || paying}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-brand text-[15px] font-semibold text-white transition hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {paying ? '支付中...' : '同意并支付'}
          </button>
        </div>
      </div>
    </div>
  )
}
