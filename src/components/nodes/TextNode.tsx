import { memo } from 'react'
import { type NodeProps } from '@xyflow/react'
import type { TextNodeData } from '../../store/types'
import { useCanvasStore } from '../../store/canvasStore'
import {
  Type,
  Trash2,
  MessageSquarePlus,
} from 'lucide-react'

function TextNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as TextNodeData
  const { deleteNode, setSelectedNodeId, addToConversation } = useCanvasStore()

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
        <Type size={12} className="text-brand" />
        <span className="text-xs text-apple-text flex-1 truncate">{nodeData.label || '文本'}</span>
        <button
          onClick={(e) => { e.stopPropagation(); deleteNode(id) }}
          className="p-1 rounded hover:bg-red-50 text-apple-text-tertiary hover:text-red-500 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* 文本内容展示 */}
      <div className="p-3 flex-1">
        <div className="text-xs text-apple-text leading-relaxed whitespace-pre-wrap min-h-[60px] max-h-[200px] overflow-y-auto">
          {nodeData.text || nodeData.generatedText || (
            <span className="text-apple-text-tertiary italic">暂无内容</span>
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

export default memo(TextNodeComponent)
