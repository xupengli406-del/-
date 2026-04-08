import { useState } from 'react'
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronRight,
  Crown,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  User,
  X,
} from 'lucide-react'
import { useAccountStore, type UserPlan } from '../../store/accountStore'
import PaymentModal from './PaymentModal'
import BalanceDetailModal from './BalanceDetailModal'

interface LoginModalProps {
  open: boolean
  onClose: () => void
}

interface PlanModalProps {
  open: boolean
  onClose: () => void
}

type AuthView = 'login' | 'register'

const quickLoginOptions = [
  { key: 'wechat', label: '微信快捷登录', hint: '适合快速进入产品' },
  { key: 'phone', label: '手机号快捷登录', hint: '适合常用账号快速验证' },
]

const plans: {
  key: UserPlan
  title: string
  price: string
  badge: string
  desc: string
  features: string[]
  storage: string
}[] = [
  {
    key: 'subscription',
    title: '订阅版',
    price: '¥199 / 月',
    badge: '个人创作者',
    desc: '适合个人、独立创作者和小团队日常生成使用。',
    features: ['图片 / 视频生成额度', '个人项目管理', '标准优先队列', '账户余额抵扣'],
    storage: '50GB 云端存储',
  },
  {
    key: 'enterprise',
    title: '企业版',
    price: '联系销售',
    badge: '团队协作',
    desc: '适合企业统一采购、团队权限管理与更高可用性需求。',
    features: ['多人协作与权限控制', '更高并发与额度', '专属客户成功支持', '对公结算与定制方案'],
    storage: '500GB+ 云端存储',
  },
]

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { loginWithTab } = useAccountStore()
  const [view, setView] = useState<AuthView>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const submit = (tab: 'email' | 'quick' | 'manual') => {
    loginWithTab(tab)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(15,23,42,0.18)] px-6 py-8 backdrop-blur-[6px]">
      <div className="w-full max-w-[560px] rounded-[32px] border border-black/5 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.14)]">
        <div className="px-8 pb-8 pt-8 sm:px-9 sm:pb-9">
          <div className="mb-7 flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF3FF] px-3 py-1 text-[12px] font-medium text-[#4670FE]">
                <KeyRound size={13} /> 账户入口
              </div>
              <h2 className="mt-4 text-[28px] font-semibold tracking-tight text-slate-900">
                {view === 'login' ? '欢迎回来' : '创建账号'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {view === 'login'
                  ? '先登录，再进入你的创作工作台。'
                  : '注册后即可进入产品，后续再补全账户资料。'}
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              title="关闭"
            >
              <X size={18} />
            </button>
          </div>

          {view === 'login' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                {quickLoginOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => submit('quick')}
                    className="rounded-[22px] border border-slate-200 bg-[#FAFBFD] px-4 py-4 text-left transition hover:border-[#D9E3FF] hover:bg-white"
                  >
                    <div className="text-sm font-semibold text-slate-900">{option.label}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">{option.hint}</div>
                  </button>
                ))}
              </div>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-400">已有账号登录</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="space-y-4">
                <SoftInput icon={<Mail size={16} />} placeholder="邮箱或用户名" />
                <SoftInput
                  icon={<Lock size={16} />}
                  placeholder="密码"
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="text-slate-400 transition hover:text-slate-600"
                    >
                      {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  }
                />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button className="text-sm text-slate-400 transition hover:text-slate-600">忘记密码？</button>
                <div className="text-sm text-slate-500">
                  没有账号？
                  <button
                    onClick={() => setView('register')}
                    className="ml-1 font-medium text-[#4670FE] transition hover:text-[#355EF6]"
                  >
                    去注册
                  </button>
                </div>
              </div>

              <button
                onClick={() => submit('email')}
                className="mt-7 flex h-14 w-full items-center justify-center rounded-[20px] bg-[#4670FE] text-[16px] font-semibold text-white transition hover:bg-[#355EF6]"
              >
                登录
              </button>
            </>
          ) : (
            <>
              <div className="mb-5 flex items-center">
                <button
                  onClick={() => setView('login')}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <ArrowLeft size={15} /> 返回登录
                </button>
              </div>

              <div className="space-y-4">
                <SoftInput icon={<User size={16} />} placeholder="用户名" />
                <SoftInput icon={<Mail size={16} />} placeholder="邮箱" />
                <SoftInput
                  icon={<Lock size={16} />}
                  placeholder="密码"
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="text-slate-400 transition hover:text-slate-600"
                    >
                      {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  }
                />
                <SoftInput
                  icon={<Lock size={16} />}
                  placeholder="确认密码"
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="text-slate-400 transition hover:text-slate-600"
                    >
                      {showConfirmPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  }
                />
              </div>

              <div className="mt-4 text-sm text-slate-500">
                已有账号？
                <button
                  onClick={() => setView('login')}
                  className="ml-1 font-medium text-[#4670FE] transition hover:text-[#355EF6]"
                >
                  去登录
                </button>
              </div>

              <button
                onClick={() => submit('manual')}
                className="mt-7 flex h-14 w-full items-center justify-center rounded-[20px] bg-[#4670FE] text-[16px] font-semibold text-white transition hover:bg-[#355EF6]"
              >
                注册并继续
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function PlanModal({ open, onClose }: PlanModalProps) {
  const { currentPlan, setCurrentPlan, profile, balanceInfo } = useAccountStore()
  const [activeTab, setActiveTab] = useState<'plan' | 'manage'>('plan')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentPlan, setPaymentPlan] = useState<typeof plans[0] | null>(null)
  const [balanceDetailOpen, setBalanceDetailOpen] = useState(false)

  const handlePurchase = (plan: typeof plans[0]) => {
    setPaymentPlan(plan)
    setPaymentOpen(true)
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/25 px-6">
        <div className="w-full max-w-[920px] rounded-[32px] border border-black/5 bg-white p-8 shadow-[0_32px_120px_rgba(15,23,42,0.18)]">
          {/* 头部 — 用户信息 + 余额入口 */}
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5B6472] text-[14px] font-semibold text-white">
                {profile.avatar}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-slate-900">{profile.name}</span>
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand">
                    {currentPlan === 'subscription' ? '订阅版' : '企业版'}
                  </span>
                </div>
                <div className="mt-0.5 text-[12px] text-slate-400">{profile.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* 余额详情入口 */}
              <button
                onClick={() => setBalanceDetailOpen(true)}
                className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 transition hover:border-brand/30 hover:bg-brand/5 hover:text-brand"
              >
                <span className="text-brand">✦</span>
                <span>余额详情</span>
                <span className="font-semibold text-brand">¥{balanceInfo.total.toFixed(0)}</span>
                <ChevronRight size={12} className="text-slate-400" />
              </button>

              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                title="关闭"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* 标题 + Tab */}
          <div className="mb-6 text-center">
            <h3 className="text-[24px] font-semibold text-slate-900">订阅计划</h3>
            <div className="mt-4 inline-flex rounded-full border border-slate-200 p-1">
              <button
                onClick={() => setActiveTab('plan')}
                className={`rounded-full px-5 py-1.5 text-[13px] font-medium transition ${
                  activeTab === 'plan'
                    ? 'bg-brand text-white'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                订阅计划
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`rounded-full px-5 py-1.5 text-[13px] font-medium transition ${
                  activeTab === 'manage'
                    ? 'bg-brand text-white'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                订阅管理
              </button>
            </div>
          </div>

          {activeTab === 'plan' ? (
            /* 套餐卡片 — 两列 */
            <div className="grid grid-cols-2 gap-5">
              {plans.map((plan) => {
                const active = plan.key === currentPlan
                const isEnterprise = plan.key === 'enterprise'
                return (
                  <div
                    key={plan.key}
                    className={`rounded-[28px] border p-6 transition ${
                      active
                        ? 'border-brand bg-white shadow-[0_18px_60px_rgba(70,112,254,0.12)]'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                          {plan.badge}
                        </div>
                        <div className="mt-4 text-[24px] font-semibold text-slate-900">{plan.title}</div>
                        <div className="mt-2 text-sm text-slate-500">{plan.desc}</div>
                      </div>
                      {active ? (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
                          <Check size={16} />
                        </div>
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                          {isEnterprise ? <Building2 size={16} /> : <Crown size={16} />}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 text-2xl font-semibold text-slate-900">{plan.price}</div>

                    <div className="mt-5 space-y-3">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                          <Check size={14} className="text-brand" />
                          {feature}
                        </div>
                      ))}
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Check size={14} className="text-brand" />
                        {plan.storage}
                      </div>
                    </div>

                    <div className="mt-6">
                      {isEnterprise ? (
                        <button className="flex h-12 w-full items-center justify-center rounded-xl border border-slate-200 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-50">
                          联系销售
                        </button>
                      ) : active ? (
                        <button className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-100 text-[14px] font-semibold text-slate-400 cursor-default">
                          当前方案
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePurchase(plan)}
                          className="flex h-12 w-full items-center justify-center rounded-xl bg-brand text-[14px] font-semibold text-white transition hover:bg-brand/90"
                        >
                          购买
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* 订阅管理 — 占位 */
            <div className="flex h-[300px] items-center justify-center text-[14px] text-slate-400">
              订阅管理功能即将上线
            </div>
          )}
        </div>
      </div>

      {/* 支付弹窗 */}
      {paymentOpen && paymentPlan && (
        <PaymentModal
          planTitle={paymentPlan.title}
          price={paymentPlan.price}
          onClose={() => setPaymentOpen(false)}
          onSuccess={() => {
            setPaymentOpen(false)
            setCurrentPlan(paymentPlan.key)
          }}
        />
      )}

      {/* 余额详情弹窗 */}
      <BalanceDetailModal open={balanceDetailOpen} onClose={() => setBalanceDetailOpen(false)} />
    </>
  )
}

function SoftInput({
  icon,
  placeholder,
  trailing,
}: {
  icon: React.ReactNode
  placeholder: string
  trailing?: React.ReactNode
}) {
  return (
    <div className="flex h-14 items-center gap-3 rounded-[18px] border border-slate-200 bg-[#F7F8FA] px-4 text-slate-400 transition focus-within:border-[#C9D8FF] focus-within:bg-white">
      <div className="text-slate-400">{icon}</div>
      <span className="flex-1 text-[15px] text-slate-400">{placeholder}</span>
      {trailing}
    </div>
  )
}
