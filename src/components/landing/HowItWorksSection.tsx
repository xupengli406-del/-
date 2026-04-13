import { PenTool, Wand2, Download } from 'lucide-react'
import SectionWrapper from './SectionWrapper'

const steps = [
  {
    icon: PenTool,
    num: '01',
    title: '描述你的故事',
    desc: '用自然语言输入场景描述、角色设定和画面构想，AI 会理解你的创意意图。',
  },
  {
    icon: Wand2,
    num: '02',
    title: 'AI 生成画面',
    desc: '选择图片或视频模型，调整参考图和参数，一键生成高质量画面并快速迭代。',
  },
  {
    icon: Download,
    num: '03',
    title: '导出成片',
    desc: '管理多个分镜版本，选择最佳方案，导出高清图片或视频素材。',
  },
]

export default function HowItWorksSection() {
  return (
    <div className="py-24 sm:py-32" style={{ background: 'linear-gradient(180deg, transparent, rgba(79,70,229,0.02), transparent)' }}>
      <SectionWrapper id="how-it-works">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            三步开始创作
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            简单直觉的工作流程，从想法到成品只需几分钟
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* 连接线 (仅桌面端显示) */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(79,70,229,0.2) 6px, rgba(79,70,229,0.2) 12px)' }} />

          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div key={step.num} className="relative flex flex-col items-center text-center">
                {/* 序号圆 */}
                <div
                  className="relative inline-flex items-center justify-center w-14 h-14 rounded-full text-white mb-6"
                  style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', boxShadow: '0 4px 24px rgba(79, 70, 229, 0.2)' }}
                >
                  <Icon size={22} strokeWidth={1.8} />
                  <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white text-xs font-bold flex items-center justify-center shadow-sm border border-slate-200" style={{ color: '#4F46E5' }}>
                    {step.num}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-[240px]">{step.desc}</p>
              </div>
            )
          })}
        </div>
      </SectionWrapper>
    </div>
  )
}
