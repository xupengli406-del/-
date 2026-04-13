import { useState } from 'react'
import { X, Check, CreditCard } from 'lucide-react'

interface PaymentModalProps {
  planTitle: string
  price: string
  onClose: () => void
  onSuccess: () => void
}

const paymentMethods = [
  { key: 'card', label: '信用卡 / 借记卡', icon: 'card' as const },
  { key: 'paypal', label: 'PayPal', icon: 'paypal' as const },
]

function PayPalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.23A.777.777 0 0 1 5.71 1.6h6.153c2.04 0 3.483.456 4.283 1.357.749.843 1.024 2.089.818 3.7l-.015.1v.87l.676.383a3.25 3.25 0 0 1 1.072.937c.33.47.538 1.042.618 1.7.082.677.033 1.463-.146 2.338-.206 1.003-.54 1.877-.993 2.598a5.27 5.27 0 0 1-1.557 1.683c-.62.425-1.35.74-2.17.935-.795.19-1.693.286-2.67.286H11.1a.966.966 0 0 0-.955.815l-.049.264-.827 5.244-.038.19a.966.966 0 0 1-.954.817H7.076z" fill="#253B80"/>
      <path d="M19.544 7.062c-.013.087-.028.175-.046.266-.963 4.948-4.255 6.656-8.456 6.656H8.899a1.04 1.04 0 0 0-1.027.88l-1.093 6.93-.31 1.963a.547.547 0 0 0 .54.633h3.793a.912.912 0 0 0 .902-.77l.037-.193.715-4.534.046-.25a.912.912 0 0 1 .901-.77h.568c3.673 0 6.548-1.492 7.39-5.808.351-1.803.17-3.308-.76-4.366a3.622 3.622 0 0 0-1.037-.837z" fill="#179BD7"/>
      <path d="M18.487 6.63a7.838 7.838 0 0 0-.966-.214 12.28 12.28 0 0 0-1.953-.143h-5.92a.908.908 0 0 0-.9.77l-1.26 7.988-.037.233a1.04 1.04 0 0 1 1.028-.88h2.143c4.2 0 7.493-1.707 8.456-6.655.029-.147.052-.29.072-.43a4.57 4.57 0 0 0-.663-.669z" fill="#222D65"/>
    </svg>
  )
}

export default function PaymentModal({ planTitle, price, onClose, onSuccess }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState('card')
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
            订阅 <span className="text-brand">{planTitle}</span>
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
          <div className="text-[12px] text-slate-400">订阅方案</div>
          <div className="mt-0.5 flex items-baseline justify-between">
            <span className="text-[14px] font-semibold text-slate-800">{planTitle}</span>
            <span className="text-[16px] font-bold text-brand">{price}/月</span>
          </div>
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
                {method.icon === 'card' ? (
                  <CreditCard size={16} />
                ) : (
                  <PayPalIcon />
                )}
                {method.label}
                {selectedMethod === method.key && (
                  <Check size={14} className="text-brand" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 信用卡表单（Mock） */}
        {selectedMethod === 'card' && (
          <div className="mx-6 mb-4 space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">卡号</label>
              <input
                type="text"
                placeholder="4242 4242 4242 4242"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-brand/40 focus:ring-1 focus:ring-brand/20 transition"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">有效期</label>
                <input
                  type="text"
                  placeholder="MM / YY"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-brand/40 focus:ring-1 focus:ring-brand/20 transition"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">CVV</label>
                <input
                  type="text"
                  placeholder="123"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-brand/40 focus:ring-1 focus:ring-brand/20 transition"
                />
              </div>
            </div>
          </div>
        )}

        {/* PayPal 提示 */}
        {selectedMethod === 'paypal' && (
          <div className="mx-6 mb-4 flex flex-col items-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-8">
            <PayPalIcon />
            <div className="mt-2 text-[13px] font-medium text-slate-600">点击下方按钮跳转 PayPal</div>
            <div className="mt-1 text-[11px] text-slate-400">完成支付后自动返回</div>
          </div>
        )}

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
            我已阅读并同意
            <button className="text-brand hover:underline">服务条款</button>
            和
            <button className="text-brand hover:underline">订阅协议</button>
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
            {paying ? '处理中...' : selectedMethod === 'paypal' ? '前往 PayPal 支付' : '确认订阅'}
          </button>
        </div>
      </div>
    </div>
  )
}
