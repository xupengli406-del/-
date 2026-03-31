import { Check, CreditCard, Sparkles } from 'lucide-react'
import { useAppFlowStore } from '../../store/appFlowStore'

const plans = [
  { key: 'free', title: '基础版', price: '¥0', desc: '体验产品主流程', features: ['登录进入产品', '有限次数图片生成', '基础仓库浏览'] },
  { key: 'pro', title: '专业版', price: '¥199 / 月', desc: '个人创作者核心版本', features: ['图片 + 视频生成', '多文件仓库管理', '账单与配额查看'] },
  { key: 'studio', title: '团队版', price: '¥699 / 月', desc: '工作室协同版本', features: ['团队成员管理', '共享素材仓库', '更高配额与计费结算'] },
] as const

export default function BillingFlow() {
  const { billingPlan, setBillingPlan, enterWorkspace } = useAppFlowStore()

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-8 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-sm mb-4">
              <CreditCard size={14} /> 计费流程 / 订阅升级
            </div>
            <h1 className="text-[36px] font-semibold text-slate-900 mb-3">把“使用”延伸到“付费与结算”</h1>
            <p className="text-slate-500 text-base">评审态先建立订阅选择、支付确认、权益解释与回到工作台的完整付费流程。</p>
          </div>
          <button onClick={enterWorkspace} className="h-11 px-5 rounded-2xl bg-slate-900 text-white text-sm font-medium">返回工作台</button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {plans.map((plan) => {
            const active = billingPlan === plan.key
            return (
              <button
                key={plan.key}
                onClick={() => setBillingPlan(plan.key)}
                className={`text-left rounded-[28px] border p-7 transition-all ${active ? 'border-[#4F46E5] bg-white shadow-[0_18px_60px_rgba(79,70,229,0.12)]' : 'border-black/5 bg-white hover:border-slate-200'}`}
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="text-xl font-semibold text-slate-900">{plan.title}</div>
                    <div className="text-sm text-slate-500 mt-1">{plan.desc}</div>
                  </div>
                  {active && <div className="w-8 h-8 rounded-full bg-[#4F46E5] text-white flex items-center justify-center"><Check size={16} /></div>}
                </div>
                <div className="text-[32px] font-semibold text-slate-900 mb-5">{plan.price}</div>
                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                      <Sparkles size={14} className="text-[#4F46E5]" />
                      {feature}
                    </div>
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-8 rounded-[28px] bg-white border border-black/5 p-8 grid grid-cols-[1.1fr_0.9fr] gap-8">
          <div>
            <div className="text-xl font-semibold text-slate-900 mb-4">支付确认</div>
            <div className="space-y-4">
              <div className="h-12 rounded-2xl bg-slate-50 border border-slate-200 px-4 flex items-center text-slate-400">企业 / 个人抬头</div>
              <div className="h-12 rounded-2xl bg-slate-50 border border-slate-200 px-4 flex items-center text-slate-400">选择支付方式：微信 / 支付宝 / 对公转账</div>
              <div className="h-24 rounded-2xl bg-slate-50 border border-dashed border-slate-200 px-4 flex items-center text-slate-400">账单说明 / 优惠券 / 发票信息</div>
            </div>
          </div>
          <div className="rounded-[24px] bg-[#F8FAFC] border border-slate-200 p-6">
            <div className="text-lg font-semibold text-slate-900 mb-4">当前订单</div>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between"><span>套餐</span><span className="font-medium text-slate-900">{plans.find((p) => p.key === billingPlan)?.title}</span></div>
              <div className="flex items-center justify-between"><span>周期</span><span>月付</span></div>
              <div className="flex items-center justify-between"><span>生成配额</span><span>图片 / 视频混合额度</span></div>
              <div className="h-px bg-slate-200 my-3" />
              <div className="flex items-center justify-between text-base"><span>应付金额</span><span className="font-semibold text-slate-900">{plans.find((p) => p.key === billingPlan)?.price}</span></div>
            </div>
            <button className="w-full mt-6 h-12 rounded-2xl bg-[#4F46E5] text-white font-medium">确认支付并开通</button>
          </div>
        </div>
      </div>
    </div>
  )
}
