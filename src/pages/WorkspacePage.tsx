import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, LayoutGrid, List, FolderSync, Plus, MoreHorizontal } from 'lucide-react'

type ViewMode = 'grid' | 'list'
type Tab = '个人' | '团队项目'
type Filter = '显示全部' | '最近编辑' | '最近创建'

interface Project {
  id: number
  name: string
  editedAt: string
  color: string
}

const personalProjects: Project[] = [
  { id: 1, name: '我的第一部漫剧', editedAt: '编辑于 10 分钟前', color: 'from-blue-500 to-purple-600' },
  { id: 2, name: '校园奇遇记', editedAt: '编辑于 1 小时前', color: 'from-pink-500 to-rose-600' },
  { id: 3, name: '星际冒险', editedAt: '编辑于 2 小时前', color: 'from-cyan-500 to-blue-600' },
  { id: 4, name: '都市传说', editedAt: '编辑于 昨天', color: 'from-orange-500 to-red-600' },
  { id: 5, name: '魔法学院', editedAt: '编辑于 3 天前', color: 'from-green-500 to-emerald-600' },
]

const teamProjects: Project[] = [
  { id: 101, name: '团队漫剧企划', editedAt: '编辑于 30 分钟前', color: 'from-violet-500 to-purple-600' },
  { id: 102, name: '合作项目-武侠', editedAt: '编辑于 2 天前', color: 'from-amber-500 to-orange-600' },
]

export default function WorkspacePage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('个人')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filter, setFilter] = useState<Filter>('显示全部')
  const [searchQuery, setSearchQuery] = useState('')

  const projects = activeTab === '个人' ? personalProjects : teamProjects

  const filtered = projects.filter(p =>
    !searchQuery || p.name.includes(searchQuery)
  )

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6">
      {/* 标签页 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          {(['个人', '团队项目'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-base pb-1 transition-colors ${
                activeTab === tab
                  ? 'text-white font-medium border-b-2 border-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* 搜索 */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="搜索"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-[#1a1a1a] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm text-gray-300 placeholder-gray-600 outline-none focus:border-pink-500/50 w-32"
            />
          </div>

          {/* 过滤 */}
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as Filter)}
            className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300 outline-none"
          >
            <option>显示全部</option>
            <option>最近编辑</option>
            <option>最近创建</option>
          </select>

          {/* 视图切换 */}
          <div className="flex items-center bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors">
            <FolderSync className="w-4 h-4" />
          </button>

          {/* 新建项目按钮 */}
          <button
            onClick={() => navigate('/canvas/new')}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建项目
          </button>
        </div>
      </div>

      {/* 项目内容 */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* 新建项目卡片 */}
          <div
            onClick={() => navigate('/canvas/new')}
            className="cursor-pointer rounded-xl border-2 border-dashed border-white/10 hover:border-white/20 flex flex-col items-center justify-center aspect-[4/3] transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center mb-3 transition-colors">
              <Plus className="w-6 h-6 text-gray-400" />
            </div>
            <span className="text-sm text-gray-400">新建项目</span>
          </div>

          {/* 项目卡片 */}
          {filtered.map(project => (
            <div
              key={project.id}
              onClick={() => navigate(`/canvas/${project.id}`)}
              className="group cursor-pointer rounded-xl overflow-hidden bg-[#161616] border border-white/5 hover:border-white/10 transition-all"
            >
              <div className={`aspect-[4/3] bg-gradient-to-br ${project.color} relative`}>
                <button
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={e => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-gray-200 truncate">{project.name}</p>
                <p className="text-xs text-gray-500 mt-1">{project.editedAt}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map(project => (
            <div
              key={project.id}
              onClick={() => navigate(`/canvas/${project.id}`)}
              className="group flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${project.color} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{project.name}</p>
              </div>
              <span className="text-xs text-gray-500 flex-shrink-0">{project.editedAt}</span>
              <button
                className="w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
                onClick={e => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          暂无项目
        </div>
      )}
    </div>
  )
}
