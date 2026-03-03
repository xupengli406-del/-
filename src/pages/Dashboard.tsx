import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, LayoutGrid, List, Plus, MoreHorizontal, Archive, Trash2, Users, Folder } from 'lucide-react'
import { useProjectStore } from '../store'

type ViewMode = 'grid' | 'list'
type Tab = 'personal' | 'team' | 'archived'

export default function Dashboard() {
  const navigate = useNavigate()
  const { projects, setCurrentProject, addProject, deleteProject, updateProject } = useProjectStore()
  
  const [activeTab, setActiveTab] = useState<Tab>('personal')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null)

  const filteredProjects = projects.filter(p => {
    if (activeTab === 'archived') return p.status === 'archived'
    if (activeTab === 'team') return p.teamId !== undefined && p.status === 'active'
    return p.teamId === undefined && p.status === 'active'
  }).filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleProjectClick = (projectId: string) => {
    setCurrentProject(projectId)
    navigate(`/studio/${projectId}`)
  }

  const handleCreateProject = (name: string, description: string) => {
    addProject({
      name,
      description,
      coverColor: `from-${['blue', 'purple', 'pink', 'orange', 'green', 'cyan'][Math.floor(Math.random() * 6)]}-500 to-${['purple', 'blue', 'rose', 'red', 'emerald', 'blue'][Math.floor(Math.random() * 6)]}-600`,
      seasons: [],
      status: 'active',
    })
    setShowNewProjectModal(false)
  }

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ id, x: e.clientX, y: e.clientY })
  }

  const handleArchive = (id: string) => {
    updateProject(id, { status: 'archived' })
    setContextMenu(null)
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此项目吗？')) {
      deleteProject(id)
    }
    setContextMenu(null)
  }

  const tabConfig = [
    { key: 'personal' as Tab, label: '个人项目', icon: Folder },
    { key: 'team' as Tab, label: '团队项目', icon: Users },
    { key: 'archived' as Tab, label: '归档', icon: Archive },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" onClick={() => setContextMenu(null)}>
      {/* 头部 */}
      <header className="border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <span className="text-lg font-bold">🎬</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold">AI 漫剧工作台</h1>
                <p className="text-xs text-gray-500">工业化创作平台</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-violet-500/25"
            >
              <Plus className="w-4 h-4" />
              新建 IP 项目
            </button>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-[1600px] mx-auto px-8 py-8">
        {/* 标签页和工具栏 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
            {tabConfig.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === key
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="搜索项目..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-300 placeholder-gray-600 outline-none focus:border-violet-500/50 w-64 transition-colors"
              />
            </div>

            <div className="flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 项目网格 */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* 新建项目卡片 */}
            <div
              onClick={() => setShowNewProjectModal(true)}
              className="cursor-pointer rounded-2xl border-2 border-dashed border-white/10 hover:border-violet-500/50 flex flex-col items-center justify-center aspect-[4/3] transition-all group hover:bg-violet-500/5"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/5 group-hover:bg-violet-500/20 flex items-center justify-center mb-4 transition-all">
                <Plus className="w-8 h-8 text-gray-400 group-hover:text-violet-400" />
              </div>
              <span className="text-sm text-gray-400 group-hover:text-violet-400 font-medium">创建新 IP 项目</span>
            </div>

            {/* 项目卡片 */}
            {filteredProjects.map(project => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                onContextMenu={(e) => handleContextMenu(e, project.id)}
                className="group cursor-pointer rounded-2xl overflow-hidden bg-[#141414] border border-white/5 hover:border-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1"
              >
                <div className={`aspect-[16/10] bg-gradient-to-br ${project.coverColor} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-3 left-3 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-md text-xs">
                    {project.seasons.length} 季 · {project.seasons.reduce((acc, s) => acc + s.episodes.length, 0)} 集
                  </div>
                  <button
                    className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/60"
                    onClick={(e) => handleContextMenu(e, project.id)}
                  >
                    <MoreHorizontal className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-gray-100 truncate mb-1">{project.name}</h3>
                  <p className="text-sm text-gray-500 truncate mb-3">{project.description || '暂无描述'}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>更新于 {new Date(project.updatedAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProjects.map(project => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                onContextMenu={(e) => handleContextMenu(e, project.id)}
                className="group flex items-center gap-4 p-4 rounded-xl bg-[#141414] border border-white/5 hover:border-violet-500/30 cursor-pointer transition-all"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${project.coverColor} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-200 truncate">{project.name}</h3>
                  <p className="text-xs text-gray-500 truncate mt-1">{project.description || '暂无描述'}</p>
                </div>
                <div className="text-xs text-gray-500 flex-shrink-0">
                  {project.seasons.length} 季 · {project.seasons.reduce((acc, s) => acc + s.episodes.length, 0)} 集
                </div>
                <span className="text-xs text-gray-600 flex-shrink-0">
                  {new Date(project.updatedAt).toLocaleDateString('zh-CN')}
                </span>
                <button
                  className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
                  onClick={(e) => handleContextMenu(e, project.id)}
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        )}

        {filteredProjects.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
              <Folder className="w-10 h-10 text-gray-600" />
            </div>
            <p className="text-gray-500">暂无项目</p>
          </div>
        )}
      </main>

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className="fixed bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl py-2 z-50 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => handleArchive(contextMenu.id)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
          >
            <Archive className="w-4 h-4" />
            归档项目
          </button>
          <button
            onClick={() => handleDelete(contextMenu.id)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            删除项目
          </button>
        </div>
      )}

      {/* 新建项目弹窗 */}
      {showNewProjectModal && (
        <NewProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onCreate={handleCreateProject}
        />
      )}
    </div>
  )
}

function NewProjectModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, desc: string) => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onCreate(name.trim(), description.trim())
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-6">创建新 IP 项目</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">项目名称</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例如：星辰变第一季"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-violet-500/50 transition-colors"
              autoFocus
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">项目描述（可选）</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="简要描述这个 IP 的主题和风格..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-violet-500/50 transition-colors resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              创建项目
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
