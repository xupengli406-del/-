import { useCallback } from 'react'
import { useCanvasStore } from '../../store/canvasStore'
import type { ScriptNodeData } from '../../store/types'
import EditorOverlay from './EditorOverlay'
import { FileText } from 'lucide-react'

interface ScriptEditorProps {
  nodeId: string
  onClose: () => void
}

export default function ScriptEditor({ nodeId, onClose }: ScriptEditorProps) {
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

  if (!data) return null

  return (
    <EditorOverlay
      title={data.title || '剧本编辑器'}
      icon={<FileText size={16} className="text-brand" />}
      onClose={onClose}
    >
      <div className="max-w-4xl mx-auto p-6 space-y-5">
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
            placeholder="在这里撰写或粘贴你的剧本内容...&#10;&#10;你也可以通过右侧 AI 对话面板生成剧本内容。"
            className="w-full px-4 py-3 text-sm border border-apple-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white text-apple-text placeholder:text-apple-text-tertiary leading-relaxed resize-none"
            style={{ minHeight: 'calc(100vh - 300px)' }}
          />
        </div>

        {/* 字数统计 */}
        <div className="flex items-center justify-between text-xs text-apple-text-tertiary">
          <span>{data.content ? `${data.content.length} 字` : '尚未开始'}</span>
          <span className="text-apple-text-tertiary">提示：使用右侧 AI 面板可以辅助生成内容</span>
        </div>
      </div>
    </EditorOverlay>
  )
}
