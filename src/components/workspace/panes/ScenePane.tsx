import { useCallback } from 'react'
import { useCanvasStore } from '../../../store/canvasStore'
import type { SceneNodeData } from '../../../store/types'
import { MapPin, Upload, Image as ImageLucide } from 'lucide-react'

interface ScenePaneProps {
  nodeId: string
}

export default function ScenePane({ nodeId }: ScenePaneProps) {
  const { nodes, updateNodeData, scenes, updateScene } = useCanvasStore()
  const node = nodes.find((n) => n.id === nodeId)
  const data = node?.data as unknown as SceneNodeData | undefined

  // 也支持通过 sceneId 直接打开（从文件树）
  const sceneDirect = scenes.find((s) => s.id === nodeId)
  const sceneNodeFromTree = nodes.find(
    (n) => n.type === 'sceneNode' && (n.data as unknown as SceneNodeData).sceneId === nodeId
  )
  const effectiveNodeId = sceneNodeFromTree ? sceneNodeFromTree.id : nodeId
  const effectiveData = data || (sceneNodeFromTree?.data as unknown as SceneNodeData | undefined)
  const sceneContext = scenes.find((s) => s.id === (effectiveData?.sceneId || nodeId))

  const handleUpdate = useCallback((updates: Record<string, unknown>) => {
    if (sceneNodeFromTree || node) {
      updateNodeData(effectiveNodeId, updates)
    }
    const sceneId = effectiveData?.sceneId || nodeId
    const sceneUpdates: Record<string, unknown> = {}
    if ('name' in updates) sceneUpdates.name = updates.name
    if ('description' in updates) sceneUpdates.description = updates.description
    if ('thumbnailUrl' in updates) sceneUpdates.referenceImageUrl = updates.thumbnailUrl
    if (Object.keys(sceneUpdates).length > 0) {
      updateScene(sceneId, sceneUpdates)
    }
  }, [effectiveNodeId, effectiveData?.sceneId, nodeId, node, sceneNodeFromTree, updateNodeData, updateScene])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    handleUpdate({ thumbnailUrl: url })
  }, [handleUpdate])

  const name = effectiveData?.name || sceneContext?.name || sceneDirect?.name || ''
  const description = sceneContext?.description || sceneDirect?.description || ''
  const thumbnailUrl = effectiveData?.thumbnailUrl || sceneContext?.referenceImageUrl || sceneDirect?.referenceImageUrl || ''

  if (!effectiveData && !sceneContext && !sceneDirect) {
    return (
      <div className="flex-1 flex items-center justify-center text-apple-text-tertiary text-sm">
        场景数据不存在
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* 参考图 */}
        <div>
          <label className="block text-xs font-medium text-apple-text-secondary mb-2">场景参考图</label>
          <div className="relative group">
            <div className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-apple-bg-secondary border-2 border-apple-border-light flex items-center justify-center">
              {thumbnailUrl ? (
                <img src={thumbnailUrl} alt={name} className="w-full h-full object-cover" />
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
            value={name}
            onChange={(e) => handleUpdate({ name: e.target.value, label: e.target.value })}
            placeholder="输入场景名称..."
            className="w-full px-3 py-2 text-sm border border-apple-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white text-apple-text"
          />
        </div>

        {/* 场景描述 */}
        <div>
          <label className="block text-xs font-medium text-apple-text-secondary mb-1">场景描述</label>
          <textarea
            value={description}
            onChange={(e) => handleUpdate({ description: e.target.value })}
            placeholder="描述场景的环境、氛围、时间、天气等..."
            rows={5}
            className="w-full px-3 py-2 text-sm border border-apple-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white text-apple-text resize-none leading-relaxed"
          />
        </div>
      </div>
    </div>
  )
}
