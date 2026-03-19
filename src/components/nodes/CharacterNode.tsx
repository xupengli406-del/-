import { memo, useState } from 'react'
import { type NodeProps } from '@xyflow/react'
import type { CharacterNodeData } from '../../store/types'
import { useCanvasStore } from '../../store/canvasStore'
import {
  User,
  Trash2,
  MessageSquarePlus,
} from 'lucide-react'

function CharacterNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as CharacterNodeData
  const { deleteNode, setSelectedNodeId, addToConversation, characters } = useCanvasStore()
  const [imgError, setImgError] = useState(false)

  // 从 characters 中读取完整数据
  const charContext = characters.find((c) => c.id === nodeData.characterId)
  const description = charContext?.description || ''

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
        <User size={12} className="text-brand" />
        <span className="text-xs text-apple-text flex-1 truncate">{nodeData.name || '角色'}</span>
        <button
          onClick={(e) => { e.stopPropagation(); deleteNode(id) }}
          className="p-1 rounded hover:bg-red-50 text-apple-text-tertiary hover:text-red-500 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* 角色头像 + 信息 */}
      <div className="p-3 flex gap-3">
        {/* 头像 */}
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-apple-bg-secondary border border-apple-border-light flex-shrink-0 flex items-center justify-center">
          {nodeData.avatarUrl && !imgError ? (
            <img
              src={nodeData.avatarUrl}
              alt={nodeData.name}
              className="w-full h-full object-cover"
              draggable={false}
              onError={() => setImgError(true)}
            />
          ) : (
            <User size={24} className="text-apple-text-tertiary" strokeWidth={1} />
          )}
        </div>

        {/* 描述 */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-apple-text-secondary line-clamp-3 leading-relaxed">
            {description || <span className="italic text-apple-text-tertiary">暂无描述</span>}
          </p>
        </div>
      </div>

      {/* 标签 */}
      {nodeData.tags && nodeData.tags.length > 0 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {nodeData.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded"
            >
              {tag}
            </span>
          ))}
          {nodeData.tags.length > 4 && (
            <span className="text-[10px] text-apple-text-tertiary">+{nodeData.tags.length - 4}</span>
          )}
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

export default memo(CharacterNodeComponent)
