import { memo, useState } from 'react'
import { type NodeProps } from '@xyflow/react'
import type { StoryboardFrameNodeData } from '../../store/types'
import { useCanvasStore } from '../../store/canvasStore'
import {
  Film,
  Trash2,
  Loader2,
  Image as ImageLucide,
  MessageSquarePlus,
  User,
  MapPin,
} from 'lucide-react'

function StoryboardFrameNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as StoryboardFrameNodeData
  const {
    deleteNode,
    setSelectedNodeId,
    addToConversation,
    selectFrameVersion,
    characters,
    scenes,
  } = useCanvasStore()

  const isGenerating = nodeData.status === 'generating'
  const [imgError, setImgError] = useState(false)

  // 获取选中版本
  const selectedVersion = nodeData.versions?.find(
    (v) => v.id === nodeData.selectedVersionId
  )
  const imageUrl = selectedVersion?.imageUrl

  // 解析关联的角色和场景名称
  const charNames = (nodeData.characterIds || [])
    .map((cid) => characters.find((c) => c.id === cid)?.name)
    .filter(Boolean) as string[]

  const sceneName = nodeData.sceneId
    ? scenes.find((s) => s.id === nodeData.sceneId)?.name || null
    : null

  const padIndex = String(nodeData.index || 0).padStart(2, '0')

  return (
    <div
      className={`bg-white rounded-xl border-2 transition-colors shadow-sm relative flex flex-col ${
        selected
          ? 'border-brand shadow-md'
          : 'border-apple-border-light hover:border-apple-border'
      }`}
      style={{ width: 280 }}
      onClick={() => setSelectedNodeId(id)}
    >
      {/* 头部: 序号 + 镜头 + 删除 */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-apple-border-light">
        <span className="text-xs font-bold text-brand">#{padIndex}</span>
        <Film size={12} className="text-apple-text-tertiary" />
        <span className="text-xs text-apple-text-secondary flex-1 truncate">
          {nodeData.shot || '镜头'}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); deleteNode(id) }}
          className="p-1 rounded hover:bg-red-50 text-apple-text-tertiary hover:text-red-500 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* 图片预览区 */}
      <div className="p-2">
        <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-apple-bg-secondary border border-apple-border-light flex items-center justify-center">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-2 text-brand">
              <Loader2 size={28} className="animate-spin" />
              <span className="text-[10px]">生成中...</span>
            </div>
          ) : imageUrl && !imgError ? (
            <img
              src={imageUrl}
              alt={`第${nodeData.index}格`}
              className="w-full h-full object-cover"
              draggable={false}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-apple-text-tertiary">
              <ImageLucide size={28} strokeWidth={1} />
              <span className="text-[10px]">未生成</span>
            </div>
          )}
        </div>
      </div>

      {/* 台词 */}
      {nodeData.dialogue && (
        <div className="px-3 py-1">
          <p className="text-xs text-apple-text line-clamp-2 leading-relaxed">
            "{nodeData.dialogue}"
          </p>
        </div>
      )}

      {/* 角色 + 场景 chips */}
      {(charNames.length > 0 || sceneName) && (
        <div className="px-3 py-1 flex flex-wrap gap-1">
          {charNames.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px]"
            >
              <User size={10} />
              {name}
            </span>
          ))}
          {sceneName && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-50 text-green-600 rounded text-[10px]">
              <MapPin size={10} />
              {sceneName}
            </span>
          )}
        </div>
      )}

      {/* 版本圆点指示器 */}
      {nodeData.versions && nodeData.versions.length > 0 && (
        <div className="px-3 py-2 flex items-center gap-1.5">
          {nodeData.versions.map((v) => (
            <button
              key={v.id}
              onClick={(e) => {
                e.stopPropagation()
                selectFrameVersion(id, v.id)
              }}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                v.id === nodeData.selectedVersionId
                  ? 'bg-brand scale-110'
                  : 'bg-apple-border hover:bg-apple-text-tertiary'
              }`}
              title={`版本 ${nodeData.versions.indexOf(v) + 1}`}
            />
          ))}
          <span className="text-[10px] text-apple-text-tertiary ml-1">
            {nodeData.versions.length} 版
          </span>
        </div>
      )}

      {/* 选中时显示"添加到对话"按钮 */}
      {selected && (
        <div className="px-2 pb-2">
          <button
            onClick={(e) => { e.stopPropagation(); addToConversation([id]) }}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-brand-50 border border-brand/30 rounded-lg text-xs text-brand hover:bg-brand-100 transition-colors"
          >
            <MessageSquarePlus size={12} />
            添加到对话
          </button>
        </div>
      )}
    </div>
  )
}

export default memo(StoryboardFrameNodeComponent)
