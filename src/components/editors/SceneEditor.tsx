import { useCallback } from 'react'
import { useCanvasStore } from '../../store/canvasStore'
import type { SceneNodeData } from '../../store/types'
import EditorOverlay from './EditorOverlay'
import { MapPin, Upload, Image as ImageLucide } from 'lucide-react'

interface SceneEditorProps {
  nodeId: string
  onClose: () => void
}

export default function SceneEditor({ nodeId, onClose }: SceneEditorProps) {
  const { nodes, updateNodeData, scenes, updateScene } = useCanvasStore()
  const node = nodes.find((n) => n.id === nodeId)
  const data = node?.data as unknown as SceneNodeData | undefined
  const sceneContext = scenes.find((s) => s.id === data?.sceneId)

  // 同步更新节点数据和 scenes 数组
  const handleUpdate = useCallback((updates: Record<string, unknown>) => {
    updateNodeData(nodeId, updates)
    if (data?.sceneId) {
      const sceneUpdates: Record<string, unknown> = {}
      if ('name' in updates) sceneUpdates.name = updates.name
      if ('description' in updates) sceneUpdates.description = updates.description
      if ('thumbnailUrl' in updates) sceneUpdates.referenceImageUrl = updates.thumbnailUrl
      if (Object.keys(sceneUpdates).length > 0) {
        updateScene(data.sceneId, sceneUpdates)
      }
    }
  }, [nodeId, data?.sceneId, updateNodeData, updateScene])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    handleUpdate({ thumbnailUrl: url })
  }, [handleUpdate])

  if (!data) return null

  return (
    <EditorOverlay
      title={data.name || '场景编辑器'}
      icon={<MapPin size={16} className="text-emerald-500" />}
      onClose={onClose}
    >
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* 参考图 */}
        <div>
          <label className="block text-xs font-medium text-apple-text-secondary mb-2">场景参考图</label>
          <div className="relative group">
            <div className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-apple-bg-secondary border-2 border-apple-border-light flex items-center justify-center">
              {data.thumbnailUrl ? (
                <img src={data.thumbnailUrl} alt={data.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-apple-text-tertiary">
                  <ImageLucide size={40} strokeWidth={1} />
                  <span className="text-xs">点击上传或通过 AI 生成</span>
                </div>
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-xl">
              <Upload size={24} className="text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        </div>

        {/* 场景名称 */}
        <div>
          <label className="block text-xs font-medium text-apple-text-secondary mb-1">场景名称</label>
          <input
            type="text"
            value={data.name || ''}
            onChange={(e) => handleUpdate({ name: e.target.value, label: e.target.value })}
            placeholder="输入场景名称..."
            className="w-full px-3 py-2 text-sm border border-apple-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white text-apple-text"
          />
        </div>

        {/* 场景描述 */}
        <div>
          <label className="block text-xs font-medium text-apple-text-secondary mb-1">场景描述</label>
          <textarea
            value={sceneContext?.description || data.description || ''}
            onChange={(e) => handleUpdate({ description: e.target.value })}
            placeholder="描述场景的环境、氛围、时间、天气等..."
            rows={5}
            className="w-full px-3 py-2 text-sm border border-apple-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white text-apple-text resize-none leading-relaxed"
          />
        </div>

        {/* 提示 */}
        <div className="text-xs text-apple-text-tertiary bg-apple-bg-secondary rounded-lg p-3">
          提示：可以通过右侧 AI 面板为场景生成参考图
        </div>
      </div>
    </EditorOverlay>
  )
}
