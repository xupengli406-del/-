import { Check, ArrowRight } from 'lucide-react'
import { plans, modelPricing } from '../../constants/pricing'
import SectionWrapper from './SectionWrapper'

export default function PricingSection() {
  return (
    <div className="py-24 sm:py-32">
      <SectionWrapper id="pricing">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            简单透明的定价
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            按需使用，无隐藏费用。升级 Pro 解锁更多权益
          </p>
        </div>

        {/* 定价卡 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {plans.map((plan) => {
            const isRecommended = plan.recommended
            return (
              <div
                key={plan.key}
                className={`relative rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 ${
                  isRecommended
                    ? 'text-white shadow-lg'
                    : 'bg-white border border-slate-200/80 shadow-ct-card hover:shadow-ct-card-hover'
                }`}
                style={
                  isRecommended
                    ? { background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', boxShadow: '0 8px 40px rgba(79, 70, 229, 0.3)' }
                    : undefined
                }
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-amber-900 shadow-sm">
                    {plan.badge}
                  </span>
                )}

                <h3 className={`text-lg font-bold mb-1 ${isRecommended ? 'text-white' : 'text-slate-900'}`}>
                  {plan.title}
                </h3>
                <p className={`text-sm mb-5 ${isRecommended ? 'text-white/80' : 'text-slate-500'}`}>
                  {plan.desc}
                </p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-4xl font-extrabold font-display ${isRecommended ? 'text-white' : 'text-slate-900'}`}>
                    {plan.price}
                  </span>
                  {plan.priceNote && (
                    <span className={`text-sm ${isRecommended ? 'text-white/70' : 'text-slate-400'}`}>
                      {plan.priceNote}
                    </span>
                  )}
                </div>

                <ul className="space-y-3 mb-7">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check
                        size={16}
                        className={`mt-0.5 flex-shrink-0 ${isRecommended ? 'text-white/90' : ''}`}
                        style={isRecommended ? undefined : { color: '#4F46E5' }}
                        strokeWidth={2.5}
                      />
                      <span className={`text-sm ${isRecommended ? 'text-white/90' : 'text-slate-600'}`}>{f}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2.5">
                    <Check
                      size={16}
                      className={`mt-0.5 flex-shrink-0 ${isRecommended ? 'text-white/90' : ''}`}
                      style={isRecommended ? undefined : { color: '#4F46E5' }}
                      strokeWidth={2.5}
                    />
                    <span className={`text-sm ${isRecommended ? 'text-white/90' : 'text-slate-600'}`}>{plan.storage}</span>
                  </li>
                </ul>

                <a
                  href="/app"
                  className={`group flex items-center justify-center gap-2 w-full py-2.5 rounded-full text-sm font-semibold transition-all ${
                    isRecommended
                      ? 'bg-white hover:bg-white/90'
                      : 'hover:opacity-80'
                  }`}
                  style={
                    isRecommended
                      ? { color: '#4F46E5' }
                      : { background: 'rgba(79, 70, 229, 0.06)', color: '#4F46E5' }
                  }
                >
                  {plan.key === 'enterprise' ? '联系我们' : '立即开始'}
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            )
          })}
        </div>

        {/* 模型价格表 */}
        <div className="max-w-2xl mx-auto">
          <h3 className="text-center text-lg font-bold text-slate-900 mb-6">模型按量计费</h3>
          <div className="rounded-xl border border-slate-200/80 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">模型</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">规格</th>
                  <th className="text-right text-xs font-semibold text-slate-500 px-5 py-3">价格</th>
                </tr>
              </thead>
              <tbody>
                {modelPricing.map((row, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="text-sm text-slate-900 px-5 py-3 font-medium">{row.model}</td>
                    <td className="text-sm text-slate-500 px-5 py-3">{row.type}</td>
                    <td className="text-sm text-slate-900 font-semibold px-5 py-3 text-right">{row.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SectionWrapper>
    </div>
  )
}
