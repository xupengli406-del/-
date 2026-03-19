import { useCallback } from 'react'
import { useCanvasStore } from '../../store/canvasStore'
import type { MediaNodeData } from '../../store/types'
import EditorOverlay from './EditorOverlay'
import {
  ImageIcon,
  Video,
  Music,
  Type,
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

interface MediaViewerProps {
  nodeId: string
  onClose: () => void
}

export default function MediaViewer({ nodeId, onClose }: MediaViewerProps) {
  const { nodes, updateNodeData } = useCanvasStore()
  const node = nodes.find((n) => n.id === nodeId)
  const data = node?.data as unknown as MediaNodeData | undefined

  const handleUpdate = useCallback((updates: Record<string, unknown>) => {
    updateNodeData(nodeId, updates)
  }, [nodeId, updateNodeData])

  if (!data) return null

  const Icon = mediaTypeIcons[data.mediaType] || ImageIcon

  return (
    <EditorOverlay
      title={data.name || mediaTypeLabels[data.mediaType] || '素材查看'}
      icon={<Icon size={16} className="text-brand" />}
      onClose={onClose}
    >
      <div className="max-w-4xl mx-auto p-6 space-y-5">
        {/* 名称编辑 */}
        <div>
          <label className="block text-xs font-medium text-apple-text-secondary mb-1">素材名称</label>
          <input
            type="text"
            value={data.name || ''}
            onChange={(e) => handleUpdate({ name: e.target.value, label: e.target.value })}
            placeholder="输入素材名称..."
            className="w-full px-3 py-2 text-sm border border-apple-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white text-apple-text"
          />
        </div>

        {/* 内容预览 */}
        <div>
          {data.mediaType === 'image' && (
            <div className="w-full rounded-xl overflow-hidden bg-apple-bg-secondary border border-apple-border-light flex items-center justify-center">
              {data.url ? (
                <img src={data.url} alt={data.name} className="max-w-full max-h-[60vh] object-contain" />
              ) : (
                <div className="py-20 flex flex-col items-center gap-2 text-apple-text-tertiary">
                  <ImageLucide size={48} strokeWidth={1} />
                  <span className="text-sm">暂无图片</span>
                </div>
              )}
            </div>
          )}

          {data.mediaType === 'video' && (
            <div className="w-full rounded-xl overflow-hidden bg-black">
              {data.url ? (
                <video src={data.url} controls className="w-full max-h-[60vh]" />
              ) : (
                <div className="py-20 flex flex-col items-center gap-2 text-gray-400">
                  <Video size={48} strokeWidth={1} />
                  <span className="text-sm">暂无视频</span>
                </div>
              )}
            </div>
          )}

          {data.mediaType === 'audio' && (
            <div className="w-full rounded-xl bg-apple-bg-secondary border border-apple-border-light p-8 flex flex-col items-center gap-4">
              <Music size={48} strokeWidth={1} className="text-apple-text-tertiary" />
              {data.url ? (
                <audio src={data.url} controls className="w-full max-w-lg" />
              ) : (
                <span className="text-sm text-apple-text-tertiary">暂无音频</span>
              )}
            </div>
          )}

          {data.mediaType === 'text' && (
            <div>
              <label className="block text-xs font-medium text-apple-text-secondary mb-1">文本内容</label>
              <textarea
                value={data.textContent || ''}
                onChange={(e) => handleUpdate({ textContent: e.target.value })}
                placeholder="输入文本内容..."
                className="w-full px-4 py-3 text-sm border border-apple-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white text-apple-text leading-relaxed resize-none"
                style={{ minHeight: '300px' }}
              />
            </div>
          )}
        </div>

        {/* prompt 展示 */}
        {data.prompt && (
          <div>
            <label className="block text-xs font-medium text-apple-text-secondary mb-1">生成提示词</label>
            <div className="px-3 py-2 bg-apple-bg-secondary rounded-lg text-xs text-apple-text-secondary">
              {data.prompt}
            </div>
          </div>
        )}
      </div>
    </EditorOverlay>
  )
}
