import { Image, Film, MessageSquare, GitBranch, FolderTree, Coins } from 'lucide-react'
import SectionWrapper from './SectionWrapper'

const features = [
  {
    icon: Image,
    title: 'Storyboard Image Generation',
    desc: 'Powered by Seedream 4.0 — supports 2K/4K output, smart prompt optimization, and reference image control for high-quality storyboard frames.',
    color: '#4F46E5',
    bgColor: '#EEF2FF',
  },
  {
    icon: Film,
    title: 'Video Animation',
    desc: 'Powered by Seedance 2.0 — supports 5s/10s duration, first & last frame control, and multiple motion modes to bring static frames to life.',
    color: '#7C3AED',
    bgColor: '#F5F3FF',
  },
  {
    icon: MessageSquare,
    title: 'AI Chat Creation',
    desc: 'Describe your scene in natural language — AI understands your intent and generates precise visuals. Creating is as simple as having a conversation.',
    color: '#06B6D4',
    bgColor: '#ECFEFF',
  },
  {
    icon: GitBranch,
    title: 'Multi-Version Iteration',
    desc: 'Independently manage version history for each storyboard frame. Quickly compare different options and find the best creative result.',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
  },
  {
    icon: FolderTree,
    title: 'Project Management',
    desc: 'File tree, multi-tab editing, split-screen views, and global search — manage your creative projects like a professional IDE.',
    color: '#10B981',
    bgColor: '#ECFDF5',
  },
  {
    icon: Coins,
    title: 'Flexible Pricing',
    desc: 'Pay-as-you-go starting at $0.03/image. No upfront commitment. Pro subscription unlocks priority queue and more storage.',
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
            Powerful AI Creative Tools
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            From images to videos, from ideas to finished works — full-pipeline AI capabilities
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
