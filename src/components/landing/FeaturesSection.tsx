import { Image, Film, MessageSquare, GitBranch, FolderTree, Coins } from 'lucide-react'
import SectionWrapper from './SectionWrapper'

const features = [
  {
    icon: Image,
    title: '分镜图片生成',
    desc: '基于 Seedream 4.0 模型，支持 2K/4K 输出、提示词智能优化、参考图控制，一键生成高质量分镜画面。',
    color: '#4F46E5',
    bgColor: '#EEF2FF',
  },
  {
    icon: Film,
    title: '视频动态生成',
    desc: '基于 Seedance 1.5 模型，支持 5s/10s 时长、首尾帧控制、多种运动模式，让静态画面动起来。',
    color: '#7C3AED',
    bgColor: '#F5F3FF',
  },
  {
    icon: MessageSquare,
    title: 'AI 对话创作',
    desc: '用自然语言描述你的场景构想，AI 理解语义并生成精准画面，创作如同对话般简单。',
    color: '#06B6D4',
    bgColor: '#ECFEFF',
  },
  {
    icon: GitBranch,
    title: '多版本迭代',
    desc: '每个分镜独立管理版本历史，快速对比不同方案，找到最满意的创作结果。',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
  },
  {
    icon: FolderTree,
    title: '项目管理',
    desc: '文件树、多标签页、分屏编辑、全局搜索，像专业 IDE 一样管理你的创作项目。',
    color: '#10B981',
    bgColor: '#ECFDF5',
  },
  {
    icon: Coins,
    title: '灵活计费',
    desc: '按量付费低至 $0.03/张，无门槛起步。Pro 订阅解锁优先队列与更大存储空间。',
    color: '#EC4899',
    bgColor: '#FDF2F8',
  },
]

export default function FeaturesSection() {
  return (
    <div className="py-24 sm:py-32">
      <SectionWrapper id="features">
        {/* 标题 */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            强大的 AI 创作工具
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            从图片到视频、从创意到成片，全流程 AI 能力覆盖
          </p>
        </div>

        {/* 卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="group relative bg-white rounded-2xl p-7 border border-slate-200/60 hover:-translate-y-1 transition-all duration-300"
                style={{ boxShadow: '0 4px 24px rgba(79, 70, 229, 0.06)' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: f.bgColor }}
                >
                  <Icon size={22} style={{ color: f.color }} strokeWidth={1.8} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </SectionWrapper>
    </div>
  )
}
