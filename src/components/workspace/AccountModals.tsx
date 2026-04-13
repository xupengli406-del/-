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
  Star,
  X,
} from 'lucide-react'
import { useAccountStore } from '../../store/accountStore'
import { plans, modelPricing } from '../../constants/pricing'
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

/* ──────── OAuth 按钮配置 ──────── */

const oauthProviders = [
  {
    key: 'google' as const,
    label: '使用 Google 登录',
    registerLabel: '使用 Google 注册',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
    className: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300',
  },
  {
    key: 'apple' as const,
    label: '使用 Apple 登录',
    registerLabel: '使用 Apple 注册',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
      </svg>
    ),
    className: 'bg-black text-white hover:bg-black/90',
  },
  {
    key: 'discord' as const,
    label: '使用 Discord 登录',
    registerLabel: '使用 Discord 注册',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M20.32 4.37a19.8 19.8 0 00-4.93-1.51.07.07 0 00-.08.04c-.21.38-.45.87-.61 1.25a18.27 18.27 0 00-5.41 0 12.64 12.64 0 00-.62-1.25.08.08 0 00-.08-.04 19.74 19.74 0 00-4.93 1.51.07.07 0 00-.03.03C1.11 8.39.34 12.27.74 16.1a.08.08 0 00.03.06 19.9 19.9 0 005.99 3.03.08.08 0 00.08-.03c.46-.63.87-1.3 1.22-2a.08.08 0 00-.04-.11 13.1 13.1 0 01-1.87-.9.08.08 0 01-.01-.13c.13-.09.25-.19.37-.29a.08.08 0 01.08-.01c3.93 1.8 8.18 1.8 12.07 0a.08.08 0 01.08.01c.12.1.25.2.37.29a.08.08 0 01-.01.13c-.6.35-1.22.65-1.87.9a.08.08 0 00-.04.11c.36.7.77 1.37 1.22 2a.08.08 0 00.08.03 19.83 19.83 0 006-3.03.08.08 0 00.03-.05c.47-4.87-.79-9.1-3.33-12.85a.06.06 0 00-.03-.03zM8.02 13.72c-1.11 0-2.03-1.02-2.03-2.28s.9-2.28 2.03-2.28c1.14 0 2.04 1.03 2.03 2.28 0 1.26-.9 2.28-2.03 2.28zm7.5 0c-1.11 0-2.03-1.02-2.03-2.28s.9-2.28 2.03-2.28c1.14 0 2.04 1.03 2.03 2.28 0 1.26-.89 2.28-2.03 2.28z"/>
      </svg>
    ),
    className: 'bg-[#5865F2] text-white hover:bg-[#4752C4]',
  },
]

/* ──────── LoginModal ──────── */

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { loginWithTab } = useAccountStore()
  const [view, setView] = useState<AuthView>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const submit = (tab: 'email' | 'google' | 'apple' | 'discord') => {
    loginWithTab(tab)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(15,23,42,0.18)] px-6 py-8 backdrop-blur-[6px]">
      <div className="w-full max-w-[480px] rounded-[32px] border border-black/5 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.14)]">
        <div className="px-8 pb-8 pt-8">
          <div className="mb-7 flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF3FF] px-3 py-1 text-[12px] font-medium text-[#4670FE]">
                <KeyRound size={13} /> 账户入口
              </div>
              <h2 className="mt-4 text-[26px] font-semibold tracking-tight text-slate-900">
                {view === 'login' ? '欢迎回来' : '创建账号'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {view === 'login'
                  ? '登录后进入你的创作工作台。'
                  : '注册后即可开始创作。'}
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
              {/* OAuth 按钮 */}
              <div className="space-y-3">
                {oauthProviders.map((provider) => (
                  <button
                    key={provider.key}
                    onClick={() => submit(provider.key)}
                    className={`flex h-12 w-full items-center justify-center gap-3 rounded-[16px] text-[14px] font-medium transition ${provider.className}`}
                  >
                    {provider.icon}
                    {provider.label}
                  </button>
                ))}
              </div>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-400">或使用邮箱登录</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="space-y-4">
                <SoftInput icon={<Mail size={16} />} placeholder="邮箱地址" type="email" />
                <SoftInput
                  icon={<Lock size={16} />}
                  placeholder="密码"
                  type={showPassword ? 'text' : 'password'}
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
                className="mt-6 flex h-13 w-full items-center justify-center rounded-[18px] bg-[#4670FE] text-[15px] font-semibold text-white transition hover:bg-[#355EF6]"
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

              {/* OAuth 按钮 */}
              <div className="space-y-3">
                {oauthProviders.map((provider) => (
                  <button
                    key={provider.key}
                    onClick={() => submit(provider.key)}
                    className={`flex h-12 w-full items-center justify-center gap-3 rounded-[16px] text-[14px] font-medium transition ${provider.className}`}
                  >
                    {provider.icon}
                    {provider.registerLabel}
                  </button>
                ))}
              </div>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-400">或使用邮箱注册</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="space-y-4">
                <SoftInput icon={<Mail size={16} />} placeholder="邮箱地址" type="email" />
                <SoftInput
                  icon={<Lock size={16} />}
                  placeholder="密码"
                  type={showPassword ? 'text' : 'password'}
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
                  type={showConfirmPassword ? 'text' : 'password'}
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
                onClick={() => submit('email')}
                className="mt-6 flex h-13 w-full items-center justify-center rounded-[18px] bg-[#4670FE] text-[15px] font-semibold text-white transition hover:bg-[#355EF6]"
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

/* ──────── PlanModal ──────── */

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
        <div className="w-full max-w-[960px] rounded-[32px] border border-black/5 bg-white p-8 shadow-[0_32px_120px_rgba(15,23,42,0.18)]">
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
                    {currentPlan === 'free' ? '免费版' : currentPlan === 'pro' ? 'Pro' : '企业版'}
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
                <span className="font-semibold text-brand">${balanceInfo.total.toFixed(2)}</span>
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
            <>
              {/* 套餐卡片 — 三列 */}
              <div className="grid grid-cols-3 gap-5">
                {plans.map((plan) => {
                  const active = plan.key === currentPlan
                  const isEnterprise = plan.key === 'enterprise'
                  return (
                    <div
                      key={plan.key}
                      className={`relative rounded-[28px] border p-6 transition ${
                        plan.recommended
                          ? 'border-brand bg-white shadow-[0_18px_60px_rgba(70,112,254,0.12)]'
                          : active
                            ? 'border-brand/50 bg-white'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {plan.badge && (
                        <div className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-[11px] font-medium text-white">
                          <Star size={10} fill="white" /> {plan.badge}
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="mt-1 text-[22px] font-semibold text-slate-900">{plan.title}</div>
                          <div className="mt-2 text-[13px] text-slate-500">{plan.desc}</div>
                        </div>
                        {active && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white">
                            <Check size={14} />
                          </div>
                        )}
                      </div>

                      <div className="mt-5 flex items-baseline gap-1">
                        <span className="text-[28px] font-bold text-slate-900">{plan.price}</span>
                        {plan.priceNote && <span className="text-[14px] text-slate-400">{plan.priceNote}</span>}
                      </div>

                      <div className="mt-5 space-y-3">
                        {plan.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-2 text-[13px] text-slate-600">
                            <Check size={14} className="text-brand flex-shrink-0" />
                            {feature}
                          </div>
                        ))}
                        <div className="flex items-center gap-2 text-[13px] text-slate-600">
                          <Check size={14} className="text-brand flex-shrink-0" />
                          {plan.storage}
                        </div>
                      </div>

                      <div className="mt-6">
                        {isEnterprise ? (
                          <button className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50">
                            联系销售
                          </button>
                        ) : active ? (
                          <button className="flex h-11 w-full items-center justify-center rounded-xl bg-slate-100 text-[13px] font-semibold text-slate-400 cursor-default">
                            当前方案
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePurchase(plan)}
                            className={`flex h-11 w-full items-center justify-center rounded-xl text-[13px] font-semibold transition ${
                              plan.recommended
                                ? 'bg-brand text-white hover:bg-brand/90'
                                : 'bg-brand/10 text-brand hover:bg-brand/20'
                            }`}
                          >
                            订阅
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* 模型价格表 */}
              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <div className="text-[13px] font-semibold text-slate-700 mb-3">模型按量计费</div>
                <div className="grid grid-cols-4 gap-3">
                  {modelPricing.map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                      <div>
                        <div className="text-[11px] text-slate-500">{item.model}</div>
                        <div className="text-[10px] text-slate-400">{item.type}</div>
                      </div>
                      <div className="text-[12px] font-semibold text-slate-800">{item.price}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-slate-400">
                  所有套餐的模型使用均为按量付费，费用从账户余额中扣除。
                </p>
              </div>
            </>
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

/* ──────── SoftInput ──────── */

function SoftInput({
  icon,
  placeholder,
  trailing,
  type = 'text',
}: {
  icon: React.ReactNode
  placeholder: string
  trailing?: React.ReactNode
  type?: string
}) {
  return (
    <div className="flex h-13 items-center gap-3 rounded-[16px] border border-slate-200 bg-[#F7F8FA] px-4 text-slate-400 transition focus-within:border-[#C9D8FF] focus-within:bg-white">
      <div className="text-slate-400">{icon}</div>
      <input
        type={type}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-slate-400"
      />
      {trailing}
    </div>
  )
}
