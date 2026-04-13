import { ArrowRight } from 'lucide-react'
import SectionWrapper from './SectionWrapper'

export default function FinalCTASection() {
  return (
    <div className="py-24 sm:py-32">
      <SectionWrapper>
        <div
          className="relative rounded-3xl p-12 sm:p-16 text-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}
        >
          {/* 装饰光球 */}
          <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />

          <div className="relative z-10">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
              开始你的 AI 漫剧创作之旅
            </h2>
            <p className="text-lg text-white/80 max-w-xl mx-auto mb-8">
              免费注册，新用户即享 $1 创作额度。无需信用卡，立即体验。
            </p>
            <a
              href="/app"
              className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-base font-semibold bg-white hover:bg-white/90 transition-all shadow-lg"
              style={{ color: '#4F46E5' }}
            >
              免费开始创作
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </SectionWrapper>
    </div>
  )
}
