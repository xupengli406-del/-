import { memo, useState } from 'react'
import { type NodeProps } from '@xyflow/react'
import type { MediaNodeData } from '../../store/types'
import { useCanvasStore } from '../../store/canvasStore'
import {
  ImageIcon,
  Video,
  Music,
  Type,
  Trash2,
  Loader2,
  MessageSquarePlus,
  Image as ImageLucide,
} from 'lucide-react'

const mediaTypeIcons = {
  image: ImageIcon,
  video: Video,
  audio: Music,
  text: Type,
}

const mediaTypeLabels = {
  image: '图片',
  video: '视频',
  audio: '音频',
  text: '文本',
}

function MediaNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as MediaNodeData
  const { deleteNode, setSelectedNodeId, addToConversation } = useCanvasStore()
  const isGenerating = nodeData.status === 'generating'
  const [imgError, setImgError] = useState(false)

  const Icon = mediaTypeIcons[nodeData.mediaType] || ImageIcon

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
        <Icon size={12} className="text-brand" />
        <span className="text-xs text-apple-text flex-1 truncate">
          {nodeData.name || mediaTypeLabels[nodeData.mediaType] || '素材'}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); deleteNode(id) }}
          className="p-1 rounded hover:bg-red-50 text-apple-text-tertiary hover:text-red-500 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* 内容预览区 */}
      <div className="p-2">
        {nodeData.mediaType === 'image' && (
          <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-apple-bg-secondary border border-apple-border-light flex items-center justify-center">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-2 text-brand">
                <Loader2 size={28} className="animate-spin" />
                <span className="text-[10px]">生成中...</span>
              </div>
            ) : nodeData.url && !imgError ? (
              <img
                src={nodeData.url}
                alt={nodeData.name}
                className="w-full h-full object-cover"
                draggable={false}
                onError={() => setImgError(true)}
              />
            ) : (
              <ImageLucide size={28} strokeWidth={1} className="text-apple-text-tertiary" />
            )}
          </div>
        )}

        {nodeData.mediaType === 'video' && (
          <div className="w-full aspect-[16/9] rounded-lg overflow-hidden bg-apple-bg-secondary border border-apple-border-light flex items-center justify-center">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-2 text-brand">
                <Loader2 size={28} className="animate-spin" />
                <span className="text-[10px]">生成中...</span>
              </div>
            ) : nodeData.url ? (
              <video
                src={nodeData.url}
                className="w-full h-full object-cover"
                controls
                preload="metadata"
              />
            ) : (
              <Video size={28} strokeWidth={1} className="text-apple-text-tertiary" />
            )}
          </div>
        )}

        {nodeData.mediaType === 'audio' && (
          <div className="rounded-lg bg-apple-bg-secondary border border-apple-border-light p-3 flex flex-col items-center gap-2">
            {isGenerating ? (
              <div className="flex items-center gap-2 text-brand">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-xs">生成中...</span>
              </div>
            ) : nodeData.url ? (
              <audio src={nodeData.url} controls className="w-full" preload="metadata" />
            ) : (
              <Music size={28} strokeWidth={1} className="text-apple-text-tertiary" />
            )}
          </div>
        )}

        {nodeData.mediaType === 'text' && (
          <div className="px-1">
            <div className="text-xs text-apple-text leading-relaxed whitespace-pre-wrap min-h-[60px] max-h-[200px] overflow-y-auto">
              {nodeData.textContent || (
                <span className="text-apple-text-tertiary italic">暂无内容</span>
              )}
            </div>
          </div>
        )}
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

export default memo(MediaNodeComponent)
