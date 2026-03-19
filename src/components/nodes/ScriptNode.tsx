import { memo } from 'react'
import { type NodeProps } from '@xyflow/react'
import type { ScriptNodeData } from '../../store/types'
import { useCanvasStore } from '../../store/canvasStore'
import {
  FileText,
  Trash2,
  MessageSquarePlus,
} from 'lucide-react'

function ScriptNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as ScriptNodeData
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
        <FileText size={12} className="text-brand" />
        <span className="text-xs text-apple-text flex-1 truncate">{nodeData.title || '剧本'}</span>
        <button
          onClick={(e) => { e.stopPropagation(); deleteNode(id) }}
          className="p-1 rounded hover:bg-red-50 text-apple-text-tertiary hover:text-red-500 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* 摘要预览 */}
      <div className="p-3 flex-1">
        <div className="text-xs text-apple-text leading-relaxed min-h-[60px] max-h-[120px] overflow-hidden">
          {nodeData.synopsis || nodeData.content ? (
            <p className="line-clamp-5">{nodeData.synopsis || nodeData.content.slice(0, 100)}</p>
          ) : (
            <span className="text-apple-text-tertiary italic">双击编辑剧本内容...</span>
          )}
        </div>
      </div>

      {/* 底部信息 */}
      <div className="px-3 pb-2 flex items-center gap-2">
        <span className="text-[10px] text-apple-text-tertiary bg-apple-bg-secondary px-1.5 py-0.5 rounded">
          剧本
        </span>
        {nodeData.content && (
          <span className="text-[10px] text-apple-text-tertiary">
            {nodeData.content.length} 字
          </span>
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

export default memo(ScriptNodeComponent)
