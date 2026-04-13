import { ArrowRight, Sparkles, Image, Film, MessageSquare, Layers, Wand2, Zap } from 'lucide-react'
import SectionWrapper from './SectionWrapper'

/* ── Bento Grid 展示区：用抽象卡片展示产品能力 ── */
function BentoShowcase() {
  return (
    <div className="grid grid-cols-3 grid-rows-2 gap-4 max-w-4xl mx-auto" style={{ perspective: '2000px' }}>
      {/* 大卡：AI 图片生成 */}
      <div
        className="col-span-2 row-span-1 rounded-2xl p-6 border border-white/60 relative overflow-hidden group hover:-translate-y-1 transition-all duration-500"
        style={{
          background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 50%, #FDF4FF 100%)',
          boxShadow: '0 4px 24px rgba(79, 70, 229, 0.08)',
          transform: 'rotateX(2deg) rotateY(-1deg)',
        }}
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
            <Image size={20} className="text-white" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">AI 分镜图片生成</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Seedream 4.0 模型 · 2K/4K · 参考图控制</p>
          </div>
        </div>
        {/* 模拟生成的图片网格 */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {['from-indigo-200 to-violet-200', 'from-violet-200 to-pink-200', 'from-blue-200 to-indigo-200'].map((g, i) => (
            <div key={i} className={`aspect-[4/3] rounded-lg bg-gradient-to-br ${g} opacity-80`} />
          ))}
        </div>
      </div>

      {/* 小卡：AI 对话 */}
      <div
        className="rounded-2xl p-5 border border-white/60 relative overflow-hidden hover:-translate-y-1 transition-all duration-500"
        style={{
          background: 'linear-gradient(150deg, #ECFDF5 0%, #F0FDFA 100%)',
          boxShadow: '0 4px 24px rgba(6, 182, 212, 0.08)',
          transform: 'rotateX(2deg) rotateY(1deg)',
        }}
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, #06B6D4, #0891B2)' }}>
          <MessageSquare size={18} className="text-white" strokeWidth={1.8} />
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">AI 对话创作</h3>
        <p className="text-xs text-slate-500 leading-relaxed">自然语言描述场景，AI 即刻生成</p>
        {/* 聊天气泡模拟 */}
        <div className="mt-3 space-y-2">
          <div className="bg-white/70 rounded-lg rounded-tl-none px-3 py-1.5 text-[10px] text-slate-600 max-w-[80%]">一个赛博朋克风格的夜景...</div>
          <div className="bg-gradient-to-r from-indigo-100 to-violet-100 rounded-lg rounded-tr-none px-3 py-1.5 text-[10px] text-slate-600 max-w-[80%] ml-auto">已为你生成 4 张候选图</div>
        </div>
      </div>

      {/* 小卡：视频生成 */}
      <div
        className="rounded-2xl p-5 border border-white/60 relative overflow-hidden hover:-translate-y-1 transition-all duration-500"
        style={{
          background: 'linear-gradient(150deg, #FFF1F2 0%, #FFF7ED 100%)',
          boxShadow: '0 4px 24px rgba(225, 29, 72, 0.06)',
          transform: 'rotateX(1deg) rotateY(-1deg)',
        }}
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, #E11D48, #F43F5E)' }}>
          <Film size={18} className="text-white" strokeWidth={1.8} />
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">视频动态生成</h3>
        <p className="text-xs text-slate-500 leading-relaxed">5s/10s · 首尾帧控制</p>
        {/* 播放进度模拟 */}
        <div className="mt-3 h-1.5 rounded-full bg-rose-100 overflow-hidden">
          <div className="h-full w-2/3 rounded-full" style={{ background: 'linear-gradient(90deg, #E11D48, #F43F5E)' }} />
        </div>
      </div>

      {/* 宽卡：工具能力 */}
      <div
        className="col-span-2 rounded-2xl p-5 border border-white/60 flex items-center gap-6 relative overflow-hidden hover:-translate-y-1 transition-all duration-500"
        style={{
          background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
          boxShadow: '0 4px 24px rgba(79, 70, 229, 0.05)',
          transform: 'rotateX(1deg) rotateY(-1deg)',
        }}
      >
        {[
          { icon: Layers, label: '版本管理', color: '#8B5CF6' },
          { icon: Wand2, label: '提示词优化', color: '#4F46E5' },
          { icon: Zap, label: '批量生成', color: '#06B6D4' },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
              <Icon size={16} style={{ color }} strokeWidth={1.8} />
            </div>
            <span className="text-xs font-semibold text-slate-700">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HeroSection() {
  return (
    <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
      {/* 背景光球 */}
      <div className="ct-orb w-[600px] h-[600px] -top-40 -left-40" style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.15), rgba(124,58,237,0.05))' }} />
      <div className="ct-orb w-[500px] h-[500px] top-20 right-0" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12), rgba(6,182,212,0.05))' }} />
      <div className="ct-orb w-[300px] h-[300px] bottom-0 left-1/3" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.1), rgba(79,70,229,0.03))' }} />

      <SectionWrapper className="relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* 标签 */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-8" style={{ background: 'rgba(79,70,229,0.05)', borderColor: 'rgba(79,70,229,0.1)' }}>
            <Sparkles size={14} style={{ color: '#4F46E5' }} />
            <span className="text-sm font-medium" style={{ color: '#4F46E5' }}>AI 驱动的创作新范式</span>
          </div>

          {/* 主标题 */}
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
            <span className="text-slate-900">让 AI 为你的</span>
            <br />
            <span className="ct-gradient-text">漫剧创作赋能</span>
          </h1>

          {/* 副标题 */}
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            从分镜到成片，CloudsVid 将你的创意快速转化为高质量的漫画与动态影像。
            <br className="hidden sm:block" />
            无需专业技能，AI 帮你实现每一帧画面。
          </p>

          {/* CTA 按钮 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/app"
              className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-base font-semibold text-white transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                boxShadow: '0 4px 24px rgba(79, 70, 229, 0.25)',
              }}
            >
              免费开始创作
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center px-8 py-3.5 rounded-full text-base font-semibold text-slate-700 border border-slate-200 hover:border-indigo-300 hover:text-slate-900 transition-all"
            >
              了解更多
            </a>
          </div>
        </div>

        {/* Bento Grid 产品展示 */}
        <div className="mt-16 sm:mt-20">
          <BentoShowcase />
        </div>
      </SectionWrapper>
    </div>
  )
}
