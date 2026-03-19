import { memo, useState } from 'react'
import { type NodeProps } from '@xyflow/react'
import type { ImageNodeData } from '../../store/types'
import { useCanvasStore } from '../../store/canvasStore'
import {
  ImageIcon,
  Trash2,
  Loader2,
  Image as ImageLucide,
  MessageSquarePlus,
} from 'lucide-react'

function ImageNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as ImageNodeData
  const { deleteNode, setSelectedNodeId, addToConversation } = useCanvasStore()
  const isGenerating = nodeData.status === 'generating'
  const [imgError, setImgError] = useState(false)

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
      {/* 头部 */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-apple-border-light">
        <ImageIcon size={12} className="text-brand" />
        <span className="text-xs text-apple-text flex-1 truncate">{nodeData.label || '图片'}</span>
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
          ) : nodeData.imageUrl && !imgError ? (
            <img
              src={nodeData.imageUrl}
              alt={nodeData.label}
              className="w-full h-full object-cover"
              draggable={false}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-apple-text-tertiary">
              <ImageLucide size={28} strokeWidth={1} />
            </div>
          )}
        </div>
      </div>

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

export default memo(ImageNodeComponent)
