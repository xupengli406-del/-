import { useState, useEffect } from 'react'
import { Upload, Plus, X, Sparkles, Save, MapPin, Image, Layers, Type } from 'lucide-react'
import { useProjectStore } from '../../../store'
import InfiniteCanvas, { type ToolbarItem } from '../InfiniteCanvas'

interface EnvironmentEditorProps {
  entityId: string
}

export default function EnvironmentEditor({ entityId }: EnvironmentEditorProps) {
  const { environments, updateEnvironment } = useProjectStore()
  const environment = environments.find(e => e.id === entityId)

  const [name, setName] = useState(environment?.name || '')
  const [description, setDescription] = useState(environment?.description || '')
  const [prompt, setPrompt] = useState(environment?.prompt || '')
  const [tags, setTags] = useState<string[]>(environment?.tags || [])
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    if (environment) {
      setName(environment.name)
      setDescription(environment.description)
      setPrompt(environment.prompt)
      setTags(environment.tags)
    }
  }, [entityId])

  if (!environment) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        场景不存在
      </div>
    )
  }

  const handleSave = () => {
    updateEnvironment(entityId, { name, description, prompt, tags })
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const toolbarItems: ToolbarItem[] = [
    { icon: Image, label: '上传参考图', onClick: () => {} },
    { icon: Layers, label: '图层', onClick: () => {} },
    { icon: Type, label: '标注', onClick: () => {} },
    { icon: Sparkles, label: 'AI 生成', onClick: () => {} },
  ]

  return (
    <InfiniteCanvas
      toolbarItems={toolbarItems}
      emptyMessage="场景设定工作台"
    >
      <div className="p-8" style={{ minWidth: 900 }}>
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-8 max-w-[850px]">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <MapPin className="w-10 h-10 text-white" />
              </div>
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="text-2xl font-bold text-white bg-transparent outline-none border-b-2 border-transparent hover:border-white/20 focus:border-cyan-500/50 transition-colors"
                  placeholder="场景名称"
                />
                <p className="text-sm text-gray-500 mt-1">场景/环境设定</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors shadow-lg shadow-cyan-500/20"
            >
              <Save className="w-4 h-4" />
              保存
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* 左侧：参考图 */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">场景参考图</h3>
              <div className="grid grid-cols-2 gap-3">
                {environment.referenceImages.map((img, i) => (
                  <div key={i} className="aspect-video bg-white/5 rounded-xl overflow-hidden relative group">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button className="absolute top-2 right-2 p-1 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
                <div className="aspect-video border-2 border-dashed border-white/10 hover:border-cyan-500/50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors group">
                  <Upload className="w-8 h-8 text-gray-600 group-hover:text-cyan-400 transition-colors mb-2" />
                  <span className="text-xs text-gray-600 group-hover:text-cyan-400 transition-colors">上传参考图</span>
                </div>
              </div>
            </div>

            {/* 右侧：设定 */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">场景描述</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="描述场景的环境、氛围、特点..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-cyan-500/50 transition-colors resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-400">固定 Prompt</label>
                  <button className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                    <Sparkles className="w-3 h-3" />
                    AI 生成
                  </button>
                </div>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="用于生成该场景的固定提示词..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-cyan-500/50 transition-colors resize-none font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">标签</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-sm text-gray-300">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTag()}
                    placeholder="添加标签..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-500/50 transition-colors"
                  />
                  <button
                    onClick={addTag}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </InfiniteCanvas>
  )
}
