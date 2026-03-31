import { ArrowRight, CheckCircle2, ShieldCheck, Smartphone } from 'lucide-react'
import { useAppFlowStore } from '../../store/appFlowStore'

export default function LoginFlow() {
  const { loginStep, setLoginStep, completeLogin } = useAppFlowStore()

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center px-6">
      <div className="w-full max-w-5xl grid grid-cols-[1.15fr_0.85fr] gap-6">
        <div className="rounded-[32px] bg-[#111827] text-white p-10 flex flex-col justify-between min-h-[680px]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm text-white/90 mb-8">
              <ShieldCheck size={14} /> 登录 / 鉴权 / 用户进入产品
            </div>
            <h1 className="text-[42px] leading-tight font-semibold mb-5">从登录开始，进入完整的 AI 漫剧创作流程</h1>
            <p className="text-white/70 text-base leading-7 max-w-xl">
              评审版先把用户登录主流程建立起来，确保从账号进入、身份确认、创建资料，到进入工作台的产品链路是完整的。
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              ['账号登录', '手机号 / 验证码'],
              ['身份确认', '登录校验 / 首次进入'],
              ['进入工作台', '开始使用生成能力'],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl bg-white/8 border border-white/10 p-4">
                <div className="text-sm font-medium mb-1">{title}</div>
                <div className="text-xs text-white/60">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] bg-white border border-black/5 shadow-[0_20px_80px_rgba(15,23,42,0.08)] p-8 min-h-[680px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-[28px] font-semibold text-[#111827]">欢迎使用</div>
              <div className="text-sm text-slate-500 mt-1">AI 漫剧 Agent</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
              <Smartphone size={18} />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-8">
            {['phone', 'verify', 'profile'].map((step, idx) => {
              const active = loginStep === step
              const passed = ['phone', 'verify', 'profile'].indexOf(loginStep) > idx
              return (
                <div key={step} className={`flex-1 h-2 rounded-full ${active ? 'bg-[#4F46E5]' : passed ? 'bg-emerald-500' : 'bg-slate-100'}`} />
              )
            })}
          </div>

          {loginStep === 'phone' && (
            <div className="space-y-5">
              <div>
                <div className="text-sm font-medium text-slate-800 mb-2">手机号</div>
                <div className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 flex items-center text-slate-400">请输入手机号</div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-800 mb-2">图形验证码</div>
                <div className="grid grid-cols-[1fr_120px] gap-3">
                  <div className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 flex items-center text-slate-400">请输入验证码</div>
                  <div className="h-12 rounded-2xl bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5] text-sm font-medium">A7K9</div>
                </div>
              </div>
              <button onClick={() => setLoginStep('verify')} className="w-full h-12 rounded-2xl bg-[#4F46E5] text-white font-medium flex items-center justify-center gap-2">
                获取短信验证码 <ArrowRight size={16} />
              </button>
            </div>
          )}

          {loginStep === 'verify' && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#E0E7FF] bg-[#F5F7FF] p-4 text-sm text-slate-600 leading-6">
                已向 138 **** 6621 发送 6 位验证码，用于确认登录身份。
              </div>
              <div>
                <div className="text-sm font-medium text-slate-800 mb-2">短信验证码</div>
                <div className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 flex items-center text-slate-400">请输入短信验证码</div>
              </div>
              <button onClick={() => setLoginStep('profile')} className="w-full h-12 rounded-2xl bg-[#4F46E5] text-white font-medium flex items-center justify-center gap-2">
                下一步：完善资料 <ArrowRight size={16} />
              </button>
            </div>
          )}

          {loginStep === 'profile' && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
                <CheckCircle2 size={16} /> 身份校验通过，正在创建用户工作空间
              </div>
              <div>
                <div className="text-sm font-medium text-slate-800 mb-2">团队 / 工作室名称</div>
                <div className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 flex items-center text-slate-400">输入名称</div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-800 mb-2">创作方向</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-12 rounded-2xl border border-[#C7D2FE] bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center text-sm font-medium">短篇漫剧</div>
                  <div className="h-12 rounded-2xl border border-slate-200 bg-white text-slate-500 flex items-center justify-center text-sm">剧情短视频</div>
                </div>
              </div>
              <button onClick={completeLogin} className="w-full h-12 rounded-2xl bg-[#111827] text-white font-medium flex items-center justify-center gap-2">
                进入工作台 <ArrowRight size={16} />
              </button>
            </div>
          )}

          <div className="mt-auto pt-8 text-xs text-slate-400 leading-6">
            当前为评审态登录流程界面，用于串联“登录 - 进入产品 - 开始使用”的完整链路。
          </div>
        </div>
      </div>
    </div>
  )
}
