import { useState, useEffect } from 'react'
import { ArrowLeft, Sparkles, KeyRound, ArrowRight, Check } from 'lucide-react'

/* 内测邀请码（后续改为后端验证） */
const VALID_CODES = new Set(['CLOUDSVID2025', 'BETA001', 'INTERNAL'])

export default function BetaGatePage({ onEnter }: { onEnter: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    document.documentElement.classList.add('landing-page')
    return () => { document.documentElement.classList.remove('landing-page') }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      setError('请输入邀请码')
      return
    }
    if (VALID_CODES.has(trimmed)) {
      setError('')
      setSuccess(true)
      setTimeout(() => onEnter(), 800)
    } else {
      setError('邀请码无效，请检查后重试')
      setSuccess(false)
    }
  }

  return (
    <div className="relative min-h-screen font-display overflow-hidden" style={{ background: '#F8FAFC' }}>
      {/* 背景装饰：模拟产品截图虚化 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 多个虚化卡片模拟 */}
        <div className="absolute top-[8%] left-[5%] w-[280px] h-[380px] rounded-2xl rotate-[-6deg] opacity-[0.08]" style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }} />
        <div className="absolute top-[12%] left-[15%] w-[240px] h-[340px] rounded-2xl rotate-[-3deg] opacity-[0.06]" style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }} />
        <div className="absolute top-[5%] right-[8%] w-[260px] h-[360px] rounded-2xl rotate-[5deg] opacity-[0.07]" style={{ background: 'linear-gradient(135deg, #4F46E5, #06B6D4)' }} />
        <div className="absolute top-[15%] right-[18%] w-[220px] h-[320px] rounded-2xl rotate-[2deg] opacity-[0.05]" style={{ background: 'linear-gradient(135deg, #EC4899, #7C3AED)' }} />
        <div className="absolute bottom-[10%] left-[20%] w-[200px] h-[280px] rounded-2xl rotate-[-4deg] opacity-[0.04]" style={{ background: 'linear-gradient(135deg, #06B6D4, #4F46E5)' }} />
        <div className="absolute bottom-[8%] right-[12%] w-[240px] h-[300px] rounded-2xl rotate-[7deg] opacity-[0.06]" style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)' }} />

        {/* 大背景光球 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px]" style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.06), transparent 70%)' }} />
      </div>

      {/* 顶部导航 */}
      <div className="relative z-10 flex items-center justify-between px-6 sm:px-8 pt-5">
        <a href="/" className="flex items-center gap-2.5 group">
          <img src="/octopus.svg" alt="CloudsVid" className="w-8 h-8" />
          <span className="font-display text-lg font-bold text-slate-900">CloudsVid</span>
        </a>
        <a
          href="/"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={16} />
          返回首页
        </a>
      </div>

      {/* 居中内容 */}
      <div className="relative z-10 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 68px)' }}>
        <div className="w-full max-w-md mx-auto px-6">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', boxShadow: '0 8px 32px rgba(79,70,229,0.25)' }}
            >
              <img src="/octopus.svg" alt="" className="w-10 h-10 brightness-0 invert" />
            </div>
          </div>

          {/* 主文案 */}
          <div className="text-center mb-10">
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
              即将公测
            </h1>
            <p className="text-base text-slate-500 leading-relaxed">
              CloudsVid 正在进行内测中，目前仅对受邀用户开放。
              <br />
              输入邀请码即可抢先体验。
            </p>
          </div>

          {/* 邀请码表单 */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-8">
            <div>
              <div
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all"
                style={{
                  background: 'white',
                  borderColor: error ? '#EF4444' : success ? '#10B981' : '#E2E8F0',
                  boxShadow: error
                    ? '0 0 0 3px rgba(239,68,68,0.08)'
                    : success
                    ? '0 0 0 3px rgba(16,185,129,0.08)'
                    : '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <KeyRound size={18} className={success ? 'text-emerald-500' : 'text-slate-400'} strokeWidth={1.8} />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError('') }}
                  placeholder="请输入内测邀请码"
                  className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
                  disabled={success}
                  autoFocus
                />
                {success && <Check size={18} className="text-emerald-500" strokeWidth={2.5} />}
              </div>
              {error && (
                <p className="mt-2 text-xs text-red-500 pl-1">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={success}
              className="group w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-70"
              style={{
                background: success
                  ? 'linear-gradient(135deg, #10B981, #059669)'
                  : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                boxShadow: success
                  ? '0 4px 16px rgba(16,185,129,0.25)'
                  : '0 4px 16px rgba(79,70,229,0.25)',
              }}
            >
              {success ? (
                <>进入工作台...</>
              ) : (
                <>
                  验证并进入
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* 分隔线 */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">或</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* 申请内测 */}
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-4">
              还没有邀请码？留下你的信息，我们会尽快联系你
            </p>
            <button
              type="button"
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              onClick={() => window.open('mailto:vidservice@cloudsway.com?subject=申请内测邀请码', '_blank')}
            >
              申请内测资格
            </button>
          </div>

          {/* 底部提示 */}
          <div className="mt-10 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Sparkles size={12} />
            <span>公测预计很快开放，敬请期待</span>
          </div>
        </div>
      </div>
    </div>
  )
}
