import { useEffect, useRef, useState } from 'react'
import SectionWrapper from './SectionWrapper'

const stats = [
  { label: '创作者', display: '10,000+' },
  { label: '生成图片', display: '500K+' },
  { label: '生成视频', display: '80K+' },
  { label: '创作项目', display: '35K+' },
]

function AnimatedNumber({ display, inView }: { display: string; inView: boolean }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (inView) {
      const t = setTimeout(() => setShow(true), 200)
      return () => clearTimeout(t)
    }
  }, [inView])

  return (
    <span className={`transition-all duration-700 inline-block ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {display}
    </span>
  )
}

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="py-24 sm:py-32 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)' }}
    >
      {/* 装饰光球 */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: 'rgba(79, 70, 229, 0.12)' }} />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full blur-[100px]" style={{ background: 'rgba(124, 58, 237, 0.1)' }} />

      <SectionWrapper className="relative z-10">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
            被创作者信赖
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            每天有数千名创作者使用 CloudsVid 实现他们的创意
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl sm:text-5xl font-extrabold font-display text-white mb-2">
                <AnimatedNumber display={s.display} inView={inView} />
              </div>
              <div className="text-sm text-slate-400 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </SectionWrapper>
    </div>
  )
}
