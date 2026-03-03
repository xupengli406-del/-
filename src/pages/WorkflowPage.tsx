import { useState } from 'react'
import { Search, Layers } from 'lucide-react'

const categories = ['全部', '漫画制作', '角色设计', '场景生成', '分镜策划', '剧本创作', '后期处理', '工具', '其他']

interface WorkflowItem {
  id: number
  name: string
  category: string
}

const generateWorkflows = (): WorkflowItem[] => {
  const names = [
    '一键漫画分镜', '角色一致性生成', '多角度分镜', '场景氛围渲染',
    '漫画对话排版', '剧本转分镜', '画质增强', '风格迁移',
    '角色表情包生成', '漫画封面设计', '动态分镜预览', '背景自动补全',
    '色彩校正', '线稿上色', '文字特效', '批量生成变体',
    'AI编剧助手', '人物关系图', '故事板生成', '漫画翻译',
    '分格排版', '音效标注', '氛围线生成', '速度线生成',
  ]
  const cats = ['漫画制作', '角色设计', '场景生成', '分镜策划', '剧本创作', '后期处理', '工具']

  return names.map((name, i) => ({
    id: i + 1,
    name,
    category: cats[i % cats.length],
  }))
}

const allWorkflows = generateWorkflows()

export default function WorkflowPage() {
  const [activeCategory, setActiveCategory] = useState('全部')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = allWorkflows.filter(wf => {
    const matchCategory = activeCategory === '全部' || wf.category === activeCategory
    const matchSearch = !searchQuery || wf.name.includes(searchQuery)
    return matchCategory && matchSearch
  })

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6">
      <h1 className="text-2xl font-bold mb-6">工作流</h1>

      {/* 分类和搜索 */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-1 overflow-x-auto flex-shrink-0 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'text-white font-medium'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative flex-shrink-0">
          <input
            type="text"
            placeholder="搜索工作流..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-[#1a1a1a] border border-white/10 rounded-lg pl-3 pr-9 py-1.5 text-sm text-gray-300 placeholder-gray-600 outline-none focus:border-pink-500/50 w-44"
          />
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>
      </div>

      {/* 工作流网格 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filtered.map(wf => (
          <div
            key={wf.id}
            className="group cursor-pointer rounded-xl overflow-hidden bg-[#161616] border border-white/5 hover:border-white/10 transition-all"
          >
            <div className="aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden">
              <Layers className="w-10 h-10 text-gray-600 group-hover:text-pink-400 transition-colors" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-gray-200 truncate">{wf.name}</p>
              <p className="text-xs text-gray-500 mt-1">{wf.category}</p>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          暂无相关工作流
        </div>
      )}
    </div>
  )
}
