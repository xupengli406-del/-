import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Building2,
  Check,
  Crown,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  User,
  Wallet,
  X,
} from 'lucide-react'
import { useAccountStore, type UserPlan } from '../../store/accountStore'

interface LoginModalProps {
  open: boolean
  onClose: () => void
}

interface BalanceModalProps {
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
}[] = [
  {
    key: 'subscription',
    title: '订阅版',
    price: '¥199 / 月',
    badge: '个人创作者',
    desc: '适合个人、独立创作者和小团队日常生成使用。',
    features: ['图片 / 视频生成额度', '个人项目管理', '标准优先队列', '账户余额抵扣'],
  },
  {
    key: 'enterprise',
    title: '企业版',
    price: '联系销售',
    badge: '团队协作',
    desc: '适合企业统一采购、团队权限管理与更高可用性需求。',
    features: ['多人协作与权限控制', '更高并发与额度', '专属客户成功支持', '对公结算与定制方案'],
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

export function BalanceModal({ open, onClose }: BalanceModalProps) {
  const { balance, currentPlan, setCurrentPlan } = useAccountStore()

  const current = useMemo(() => plans.find((item) => item.key === currentPlan), [currentPlan])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/25 px-6">
      <div className="w-full max-w-[920px] rounded-[32px] border border-black/5 bg-white p-8 shadow-[0_32px_120px_rgba(15,23,42,0.18)]">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF3FF] px-3 py-1 text-sm text-[#1D51DF]">
              <Wallet size={14} /> 账户余额与方案
            </div>
            <h3 className="mt-4 text-[30px] font-semibold text-slate-900">当前账户余额 ¥{balance}</h3>
            <p className="mt-2 text-sm text-slate-500">
              当前方案：{current?.title}。下面展示你已开通的方案，以及可切换/升级的可选方案。
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

        <div className="mb-6 rounded-[28px] border border-[#DCE6FF] bg-[#F8FAFF] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-[#1D51DF]">
                <Crown size={14} /> 当前方案
              </div>
              <div className="mt-3 text-2xl font-semibold text-slate-900">{current?.title}</div>
              <div className="mt-2 text-sm text-slate-500">{current?.desc}</div>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
              <div className="text-xs text-slate-400">当前费用</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">{current?.price}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {plans.map((plan) => {
            const active = plan.key === currentPlan
            return (
              <button
                key={plan.key}
                onClick={() => setCurrentPlan(plan.key)}
                className={`rounded-[28px] border p-6 text-left transition ${
                  active
                    ? 'border-[#1D51DF] bg-white shadow-[0_18px_60px_rgba(29,81,223,0.12)]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{plan.badge}</div>
                    <div className="mt-4 text-[24px] font-semibold text-slate-900">{plan.title}</div>
                    <div className="mt-2 text-sm text-slate-500">{plan.desc}</div>
                  </div>
                  {active ? (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1D51DF] text-white">
                      <Check size={16} />
                    </div>
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      {plan.key === 'enterprise' ? <Building2 size={16} /> : <Crown size={16} />}
                    </div>
                  )}
                </div>
                <div className="mt-5 text-2xl font-semibold text-slate-900">{plan.price}</div>
                <div className="mt-5 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check size={14} className="text-[#1D51DF]" />
                      {feature}
                    </div>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
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
