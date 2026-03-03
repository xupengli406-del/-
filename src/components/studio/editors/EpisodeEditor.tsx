import { useState, useCallback } from 'react'
import { 
  Plus, Play, Image, MoreHorizontal, GripVertical, Trash2, Pencil,
  Sparkles, Video, Layers, Type, MessageSquare
} from 'lucide-react'
import { useProjectStore } from '../../../store'
import InfiniteCanvas, { type ToolbarItem } from '../InfiniteCanvas'

interface EpisodeEditorProps {
  entityId: string
}

export default function EpisodeEditor({ entityId }: EpisodeEditorProps) {
  const { 
    projects, currentProjectId,
    addScene, deleteScene, updateScene,
    addFrame, deleteFrame, updateFrame,
  } = useProjectStore()

  const project = projects.find(p => p.id === currentProjectId)
  let episode: any = null
  if (project) {
    for (const season of project.seasons) {
      const ep = season.episodes.find(e => e.id === entityId)
      if (ep) { episode = ep; break }
    }
  }

  const [editingSceneName, setEditingSceneName] = useState<string | null>(null)
  const [sceneNameValue, setSceneNameValue] = useState('')

  const handleAddScene = useCallback(() => {
    if (episode) addScene(entityId)
  }, [entityId, episode])

  const handleAddFrame = useCallback((sceneId: string) => {
    addFrame(entityId, sceneId)
  }, [entityId])

  const toolbarItems: ToolbarItem[] = [
    { icon: Plus, label: '新建场景', onClick: handleAddScene },
    { icon: Layers, label: '图层', onClick: () => {} },
    { icon: Type, label: '文字', onClick: () => {} },
    { icon: MessageSquare, label: '对话气泡', onClick: () => {} },
    { icon: Sparkles, label: 'AI 生成', onClick: () => {} },
  ]

  if (!episode) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        剧集不存在
      </div>
    )
  }

  return (
    <InfiniteCanvas
      toolbarItems={toolbarItems}
      onDoubleClick={() => handleAddScene()}
      emptyMessage="双击画布添加场景"
      emptySubMessage="或使用左侧工具栏"
    >
      <div className="p-8 min-w-[800px]">
        {/* 剧集标题 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-1">{episode.name}</h2>
          <p className="text-sm text-gray-500">{episode.scenes.length} 个场景</p>
        </div>

        {/* 场景列表 */}
        <div className="space-y-6">
          {episode.scenes.map((scene: any, index: number) => (
            <div
              key={scene.id}
              className="group bg-[#161616] border border-white/5 rounded-2xl overflow-hidden hover:border-violet-500/30 transition-colors"
            >
              {/* 场景头部 */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5">
                <GripVertical className="w-4 h-4 text-gray-600 cursor-grab" />
                <span className="text-xs text-gray-500 font-mono w-6">{String(index + 1).padStart(2, '0')}</span>
                {editingSceneName === scene.id ? (
                  <input
                    autoFocus
                    value={sceneNameValue}
                    onChange={e => setSceneNameValue(e.target.value)}
                    onBlur={() => {
                      if (sceneNameValue.trim()) updateScene(entityId, scene.id, { name: sceneNameValue.trim() })
                      setEditingSceneName(null)
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        if (sceneNameValue.trim()) updateScene(entityId, scene.id, { name: sceneNameValue.trim() })
                        setEditingSceneName(null)
                      }
                      if (e.key === 'Escape') setEditingSceneName(null)
                    }}
                    className="flex-1 bg-white/10 border border-violet-500/50 rounded px-2 py-0.5 text-sm text-white outline-none"
                  />
                ) : (
                  <span
                    className="text-sm font-medium text-white flex-1 cursor-text hover:text-violet-300 transition-colors"
                    onDoubleClick={() => { setEditingSceneName(scene.id); setSceneNameValue(scene.name) }}
                  >
                    {scene.name}
                  </span>
                )}
                {scene.description && (
                  <span className="text-xs text-gray-500 max-w-[200px] truncate">{scene.description}</span>
                )}
                <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                  {scene.frames.length} 帧
                </span>
                <button
                  onClick={() => deleteScene(entityId, scene.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  title="删除场景"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* 分镜帧网格 */}
              <div className="p-5">
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {scene.frames.map((frame: any, fi: number) => (
                    <div
                      key={frame.id}
                      className="relative flex-shrink-0 w-[180px] aspect-[9/16] bg-gradient-to-br from-violet-500/15 to-purple-500/15 rounded-xl border border-white/5 hover:border-violet-500/50 cursor-pointer transition-all group/frame"
                    >
                      {frame.imageUrl ? (
                        <img src={frame.imageUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-2">
                          <span className="text-xs text-gray-600 font-mono">#{fi + 1}</span>
                          <div className="opacity-0 group-hover/frame:opacity-100 transition-opacity flex gap-2">
                            <button className="p-2 rounded-lg bg-black/50 backdrop-blur-sm hover:bg-violet-500/50 transition-colors" title="生成图片">
                              <Image className="w-4 h-4 text-white" />
                            </button>
                            <button className="p-2 rounded-lg bg-black/50 backdrop-blur-sm hover:bg-green-500/50 transition-colors" title="生成视频">
                              <Play className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        </div>
                      )}
                      {/* 删除帧 */}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteFrame(entityId, scene.id, frame.id) }}
                        className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 text-gray-400 hover:text-red-400 opacity-0 group-hover/frame:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      {/* 状态标记 */}
                      {frame.status !== 'pending' && (
                        <div className={`absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] ${
                          frame.status === 'completed' ? 'bg-green-500/30 text-green-400' :
                          frame.status === 'generating' ? 'bg-amber-500/30 text-amber-400' :
                          'bg-red-500/30 text-red-400'
                        }`}>
                          {frame.status === 'completed' ? '已生成' : frame.status === 'generating' ? '生成中' : '失败'}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* 添加新帧 */}
                  <div
                    onClick={() => handleAddFrame(scene.id)}
                    className="flex-shrink-0 w-[180px] aspect-[9/16] border-2 border-dashed border-white/10 hover:border-violet-500/50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors group/add"
                  >
                    <Plus className="w-8 h-8 text-gray-600 group-hover/add:text-violet-400 transition-colors" />
                    <span className="text-xs text-gray-600 group-hover/add:text-violet-400 transition-colors mt-1">添加帧</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* 添加新场景 */}
          <button
            onClick={handleAddScene}
            className="w-full py-6 border-2 border-dashed border-white/10 hover:border-violet-500/50 rounded-2xl flex items-center justify-center gap-2 text-gray-500 hover:text-violet-400 transition-colors"
          >
            <Plus className="w-5 h-5" />
            添加新场景
          </button>
        </div>
      </div>
    </InfiniteCanvas>
  )
}
