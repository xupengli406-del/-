import { useState } from 'react'
import { Search, Play } from 'lucide-react'

const categories = ['全部', '精选漫剧', '动画', '奇幻', '科幻', '日常', '恋爱', '悬疑', '其他']

interface ContentItem {
  id: number
  title: string
  author: string
  category: string
}

const generateItems = (): ContentItem[] => {
  const titles = [
    '星际漫游记', '校园奇遇', '末日幻想', '魔法少女', '都市传说',
    '时空旅人', '机械之心', '梦境边界', '幽灵学院', '龙族秘史',
    '月光骑士', '深海迷踪', '异世界日记', '赛博都市', '武道巅峰',
    '灵魂画手', '星辰大海', '平行世界', '暗影猎人', '光之守护',
  ]
  const authors = ['@创作者A', '@漫画社B', '@独立工作室', '@AI画师', '@故事匠人']
  const cats = ['精选漫剧', '动画', '奇幻', '科幻', '日常', '恋爱', '悬疑']

  return titles.map((title, i) => ({
    id: i + 1,
    title,
    author: authors[i % authors.length],
    category: cats[i % cats.length],
  }))
}

const allItems = generateItems()

export default function OctopusTVPage() {
  const [activeCategory, setActiveCategory] = useState('全部')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('编辑精选')

  const filtered = allItems.filter(item => {
    const matchCategory = activeCategory === '全部' || item.category === activeCategory
    const matchSearch = !searchQuery || item.title.includes(searchQuery) || item.author.includes(searchQuery)
    return matchCategory && matchSearch
  })

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6">
      {/* 分类标签 */}
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
        <div className="flex items-center gap-3 flex-shrink-0">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300 outline-none"
          >
            <option>编辑精选</option>
            <option>最新发布</option>
            <option>最多收藏</option>
          </select>
          <div className="relative">
            <input
              type="text"
              placeholder="搜索章鱼TV..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-[#1a1a1a] border border-white/10 rounded-lg pl-3 pr-9 py-1.5 text-sm text-gray-300 placeholder-gray-600 outline-none focus:border-pink-500/50 w-44"
            />
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          </div>
        </div>
      </div>

      {/* 内容网格 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map(item => (
          <div
            key={item.id}
            className="group cursor-pointer rounded-xl overflow-hidden bg-[#161616] border border-white/5 hover:border-white/10 transition-all"
          >
            <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-6 h-6 text-white ml-1" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <span className="text-xs text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded">{item.category}</span>
              </div>
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-gray-200 truncate mb-1">{item.title}</p>
              <p className="text-xs text-gray-500">{item.author}</p>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          暂无相关内容
        </div>
      )}
    </div>
  )
}
