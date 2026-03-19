import { useCallback } from 'react'
import { useCanvasStore } from '../../store/canvasStore'
import type { StoryboardFrameNodeData } from '../../store/types'
import EditorOverlay from './EditorOverlay'
import { Film, Image as ImageLucide, Check } from 'lucide-react'

interface StoryboardFrameEditorProps {
  nodeId: string
  onClose: () => void
}

export default function StoryboardFrameEditor({ nodeId, onClose }: StoryboardFrameEditorProps) {
  const { nodes, updateNodeData, characters, scenes, selectFrameVersion } = useCanvasStore()
  const node = nodes.find((n) => n.id === nodeId)
  const data = node?.data as unknown as StoryboardFrameNodeData | undefined

  const selectedVersion = data?.versions.find((v) => v.id === data.selectedVersionId)

  const handleUpdate = useCallback((updates: Record<string, unknown>) => {
    updateNodeData(nodeId, updates)
  }, [nodeId, updateNodeData])

  const handleCharacterToggle = useCallback((charId: string) => {
    if (!data) return
    const current = data.characterIds || []
    const next = current.includes(charId)
      ? current.filter((id) => id !== charId)
      : [...current, charId]
    handleUpdate({ characterIds: next })
  }, [data, handleUpdate])

  if (!data) return null

  return (
    <EditorOverlay
      title={`第${data.index}格 - 分镜编辑`}
      icon={<Film size={16} className="text-brand" />}
      onClose={onClose}
    >
      <div className="flex gap-6 p-6 max-w-5xl mx-auto">
        {/* 左侧：大图预览 + 版本管理 */}
        <div className="flex-1 space-y-4">
          {/* 大图预览 */}
          <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-apple-bg-secondary border-2 border-apple-border-light flex items-center justify-center">
            {selectedVersion?.imageUrl ? (
              <img
                src={selectedVersion.imageUrl}
                alt={`第${data.index}格`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-apple-text-tertiary">
                <ImageLucide size={48} strokeWidth={1} />
                <span className="text-sm">通过右侧 AI 面板生成分镜图片</span>
              </div>
            )}
          </div>

          {/* 版本列表 */}
          {data.versions.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-apple-text-secondary mb-2">
                版本记录 ({data.versions.length})
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {data.versions.map((ver, i) => (
                  <button
                    key={ver.id}
                    onClick={() => selectFrameVersion(nodeId, ver.id)}
                    className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      ver.id === data.selectedVersionId
                        ? 'border-brand'
                        : 'border-apple-border-light hover:border-apple-border'
                    }`}
                  >
                    {ver.imageUrl ? (
                      <img src={ver.imageUrl} alt={`v${i + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-apple-bg-secondary flex items-center justify-center text-[10px] text-apple-text-tertiary">
                        v{i + 1}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右侧：编辑表单 */}
        <div className="w-80 space-y-4">
          {/* 镜头类型 */}
          <div>
            <label className="block text-xs font-medium text-apple-text-secondary mb-1">镜头类型</label>
            <input
              type="text"
              value={data.shot || ''}
              onChange={(e) => handleUpdate({ shot: e.target.value })}
              placeholder="如：近景、远景、特写..."
              className="w-full px-3 py-2 text-sm border border-apple-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white text-apple-text"
            />
          </div>

          {/* 台词 */}
          <div>
            <label className="block text-xs font-medium text-apple-text-secondary mb-1">台词</label>
            <textarea
              value={data.dialogue || ''}
              onChange={(e) => handleUpdate({ dialogue: e.target.value })}
              placeholder="输入角色台词..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-apple-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white text-apple-text resize-none"
            />
          </div>

          {/* 画面描述 */}
          <div>
            <label className="block text-xs font-medium text-apple-text-secondary mb-1">画面描述</label>
            <textarea
              value={data.description || ''}
              onChange={(e) => handleUpdate({ description: e.target.value })}
              placeholder="描述画面构图、动作、表情..."
              rows={4}
              className="w-full px-3 py-2 text-sm border border-apple-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white text-apple-text resize-none"
            />
          </div>

          {/* 关联角色 */}
          <div>
            <label className="block text-xs font-medium text-apple-text-secondary mb-2">关联角色</label>
            <div className="space-y-1">
              {characters.length === 0 ? (
                <p className="text-xs text-apple-text-tertiary italic">暂无角色，请先创建角色</p>
              ) : (
                characters.map((char) => (
                  <button
                    key={char.id}
                    onClick={() => handleCharacterToggle(char.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                      data.characterIds.includes(char.id)
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'bg-apple-bg-secondary text-apple-text-secondary hover:bg-apple-bg-tertiary border border-transparent'
                    }`}
                  >
                    {data.characterIds.includes(char.id) && <Check size={12} />}
                    <span className="flex-1 text-left">{char.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* 关联场景 */}
          <div>
            <label className="block text-xs font-medium text-apple-text-secondary mb-2">关联场景</label>
            <div className="space-y-1">
              {scenes.length === 0 ? (
                <p className="text-xs text-apple-text-tertiary italic">暂无场景，请先创建场景</p>
              ) : (
                <>
                  <button
                    onClick={() => handleUpdate({ sceneId: null })}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                      !data.sceneId
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-apple-bg-secondary text-apple-text-secondary hover:bg-apple-bg-tertiary border border-transparent'
                    }`}
                  >
                    无场景
                  </button>
                  {scenes.map((scene) => (
                    <button
                      key={scene.id}
                      onClick={() => handleUpdate({ sceneId: scene.id })}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                        data.sceneId === scene.id
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-apple-bg-secondary text-apple-text-secondary hover:bg-apple-bg-tertiary border border-transparent'
                      }`}
                    >
                      {data.sceneId === scene.id && <Check size={12} />}
                      <span className="flex-1 text-left">{scene.name}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </EditorOverlay>
  )
}
