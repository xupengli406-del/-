import { useCallback } from 'react'
import { useCanvasStore } from '../../../store/canvasStore'
import type { ScriptNodeData } from '../../../store/types'

interface ScriptPaneProps {
  nodeId: string
}

export default function ScriptPane({ nodeId }: ScriptPaneProps) {
  const { nodes, updateNodeData } = useCanvasStore()
  const node = nodes.find((n) => n.id === nodeId)
  const data = node?.data as unknown as ScriptNodeData | undefined

  const handleTitleChange = useCallback((title: string) => {
    updateNodeData(nodeId, {
      title,
      label: title,
      synopsis: (data?.content || '').slice(0, 100),
    })
  }, [nodeId, updateNodeData, data?.content])

  const handleContentChange = useCallback((content: string) => {
    updateNodeData(nodeId, {
      content,
      synopsis: content.slice(0, 100),
    })
  }, [nodeId, updateNodeData])

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center text-apple-text-tertiary text-sm">
        剧本数据不存在
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto bg-white">
      <div className="max-w-4xl mx-auto w-full p-6 space-y-5 flex-1 flex flex-col">
        {/* 标题 */}
        <div>
          <label className="block text-xs font-medium text-apple-text-secondary mb-1.5">剧本标题</label>
          <input
            type="text"
            value={data.title || ''}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="输入剧本标题..."
            className="w-full px-3 py-2 text-base font-semibold border border-apple-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white text-apple-text placeholder:text-apple-text-tertiary"
          />
        </div>

        {/* 内容编辑区 */}
        <div className="flex-1">
          <label className="block text-xs font-medium text-apple-text-secondary mb-1.5">剧本内容</label>
          <textarea
            value={data.content || ''}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={'在这里撰写或粘贴你的剧本内容...\n\n你也可以通过 AI 助手面板生成剧本内容。'}
            className="w-full h-full min-h-[400px] px-4 py-3 text-sm border border-apple-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white text-apple-text placeholder:text-apple-text-tertiary leading-relaxed resize-none"
          />
        </div>

        {/* 字数统计 */}
        <div className="flex items-center justify-between text-xs text-apple-text-tertiary flex-shrink-0">
          <span>{data.content ? `${data.content.length} 字` : '尚未开始'}</span>
        </div>
      </div>
    </div>
  )
}
