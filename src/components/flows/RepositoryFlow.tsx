import { Database, FolderKanban, GalleryVertical, HardDrive, Search } from 'lucide-react'
import { useAppFlowStore, type RepositoryType } from '../../store/appFlowStore'

const repoMeta: Record<RepositoryType, { title: string; desc: string; icon: typeof Database }> = {
  storyboard: { title: '分镜文件仓库', desc: '管理图片生成文件、版本、状态与归档', icon: FolderKanban },
  video: { title: '视频文件仓库', desc: '管理视频任务、成片、版本与导出状态', icon: HardDrive },
  asset: { title: '素材仓库', desc: '管理角色、场景、参考图与上传素材', icon: GalleryVertical },
}

export default function RepositoryFlow() {
  const { activeRepository, setActiveRepository, enterWorkspace } = useAppFlowStore()
  const current = repoMeta[activeRepository]
  const Icon = current.icon

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-8 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECFDF5] text-emerald-700 text-sm mb-4">
              <Database size={14} /> 文件仓库管理流程
            </div>
            <h1 className="text-[36px] font-semibold text-slate-900 mb-3">从使用延伸到文件沉淀与仓库管理</h1>
            <p className="text-slate-500 text-base">评审态建立多仓库视图：分镜文件、视频文件、素材仓库，各自有独立列表与操作区。</p>
          </div>
          <button onClick={enterWorkspace} className="h-11 px-5 rounded-2xl bg-slate-900 text-white text-sm font-medium">返回工作台</button>
        </div>

        <div className="grid grid-cols-[260px_1fr] gap-6">
          <div className="rounded-[28px] bg-white border border-black/5 p-4">
            {(['storyboard', 'video', 'asset'] as RepositoryType[]).map((repo) => {
              const meta = repoMeta[repo]
              const RepoIcon = meta.icon
              const active = repo === activeRepository
              return (
                <button
                  key={repo}
                  onClick={() => setActiveRepository(repo)}
                  className={`w-full flex items-start gap-3 rounded-2xl px-4 py-4 text-left transition-colors ${active ? 'bg-[#F5F7FF]' : 'hover:bg-slate-50'}`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${active ? 'bg-[#4F46E5] text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <RepoIcon size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{meta.title}</div>
                    <div className="text-xs text-slate-500 leading-5 mt-1">{meta.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="rounded-[28px] bg-white border border-black/5 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <Icon size={20} />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-slate-900">{current.title}</div>
                  <div className="text-sm text-slate-500 mt-1">{current.desc}</div>
                </div>
              </div>
              <div className="w-[280px] h-11 rounded-2xl bg-slate-50 border border-slate-200 px-4 flex items-center gap-2 text-slate-400 text-sm">
                <Search size={16} /> 搜索文件 / 标签 / 状态
              </div>
            </div>

            <div className="px-8 py-6 grid grid-cols-3 gap-4 bg-[#FCFCFD] border-b border-slate-100">
              {[
                ['总文件数', '128'],
                ['近 7 天新增', '32'],
                ['待处理', '14'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-white border border-slate-200 p-4">
                  <div className="text-xs text-slate-500 mb-2">{label}</div>
                  <div className="text-2xl font-semibold text-slate-900">{value}</div>
                </div>
              ))}
            </div>

            <div className="px-8 py-6">
              <div className="grid grid-cols-[1.2fr_0.8fr_0.5fr_0.6fr_0.6fr] text-xs uppercase tracking-wide text-slate-400 pb-4 border-b border-slate-100">
                <div>文件名称</div>
                <div>所属仓库</div>
                <div>版本</div>
                <div>状态</div>
                <div>更新时间</div>
              </div>
              <div>
                {[
                  ['暴雨夜追逐镜头', current.title, 'V12', '可用', '10分钟前'],
                  ['角色初见分镜组', current.title, 'V07', '审核中', '1小时前'],
                  ['终幕爆发片段', current.title, 'V03', '草稿', '今天'],
                ].map((row) => (
                  <div key={row[0]} className="grid grid-cols-[1.2fr_0.8fr_0.5fr_0.6fr_0.6fr] py-5 border-b border-slate-100 text-sm text-slate-700">
                    <div className="font-medium text-slate-900">{row[0]}</div>
                    <div>{row[1]}</div>
                    <div>{row[2]}</div>
                    <div>{row[3]}</div>
                    <div>{row[4]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
