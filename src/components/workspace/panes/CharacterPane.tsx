import { useCallback, useState } from 'react'
import { useCanvasStore } from '../../../store/canvasStore'
import type { CharacterNodeData } from '../../../store/types'
import { User, Plus, X, Upload } from 'lucide-react'

interface CharacterPaneProps {
  nodeId: string
}

export default function CharacterPane({ nodeId }: CharacterPaneProps) {
  const { nodes, updateNodeData, characters, updateCharacter } = useCanvasStore()
  const node = nodes.find((n) => n.id === nodeId)
  const data = node?.data as unknown as CharacterNodeData | undefined
  const charContext = characters.find((c) => c.id === data?.characterId)

  // 如果是通过 characterId 直接打开（从文件树）
  const charDirect = characters.find((c) => c.id === nodeId)
  const charNodeFromTree = nodes.find(
    (n) => n.type === 'characterNode' && (n.data as unknown as CharacterNodeData).characterId === nodeId
  )
  const effectiveNodeId = charNodeFromTree ? charNodeFromTree.id : nodeId
  const effectiveData = data || (charNodeFromTree?.data as unknown as CharacterNodeData | undefined)
  const effectiveChar = charContext || charDirect

  const [newTag, setNewTag] = useState('')

  const handleUpdate = useCallback((updates: Record<string, unknown>) => {
    if (charNodeFromTree || node) {
      updateNodeData(effectiveNodeId, updates)
    }
    const charId = effectiveData?.characterId || nodeId
    const charUpdates: Record<string, unknown> = {}
    if ('name' in updates) charUpdates.name = updates.name
    if ('description' in updates) charUpdates.description = updates.description
    if ('avatarUrl' in updates) charUpdates.referenceImageUrl = updates.avatarUrl
    if ('tags' in updates) charUpdates.tags = updates.tags
    if (Object.keys(charUpdates).length > 0) {
      updateCharacter(charId, charUpdates)
    }
  }, [effectiveNodeId, effectiveData?.characterId, nodeId, node, charNodeFromTree, updateNodeData, updateCharacter])

  const handleAddTag = useCallback(() => {
    if (!newTag.trim()) return
    const tags = [...(effectiveData?.tags || effectiveChar?.tags || []), newTag.trim()]
    handleUpdate({ tags })
    setNewTag('')
  }, [newTag, effectiveData, effectiveChar, handleUpdate])

  const handleRemoveTag = useCallback((tag: string) => {
    const tags = (effectiveData?.tags || effectiveChar?.tags || []).filter((t) => t !== tag)
    handleUpdate({ tags })
  }, [effectiveData, effectiveChar, handleUpdate])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    handleUpdate({ avatarUrl: url })
  }, [handleUpdate])

  const name = effectiveData?.name || effectiveChar?.name || ''
  const description = effectiveChar?.description || ''
  const avatarUrl = effectiveData?.avatarUrl || effectiveChar?.referenceImageUrl || ''
  const tags = effectiveData?.tags || effectiveChar?.tags || []

  if (!effectiveData && !effectiveChar) {
    return (
      <div className="flex-1 flex items-center justify-center text-apple-text-tertiary text-sm">
        角色数据不存在
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* 头像区 */}
        <div className="flex items-start gap-6">
          <div className="relative group">
            <div className="w-28 h-28 rounded-xl overflow-hidden bg-apple-bg-secondary border-2 border-apple-border-light flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-apple-text-tertiary" strokeWidth={1} />
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-xl">
              <Upload size={20} className="text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-xs font-medium text-apple-text-secondary mb-1">角色名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleUpdate({ name: e.target.value, label: e.target.value })}
                placeholder="输入角色名称..."
                className="w-full px-3 py-2 text-sm border border-apple-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white text-apple-text"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-apple-text-secondary mb-1">角色描述</label>
              <textarea
                value={description}
                onChange={(e) => handleUpdate({ description: e.target.value })}
                placeholder="描述角色的外观、性格、背景故事..."
                rows={4}
                className="w-full px-3 py-2 text-sm border border-apple-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white text-apple-text resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* 标签管理 */}
        <div>
          <label className="block text-xs font-medium text-apple-text-secondary mb-2">角色标签</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg">
                {tag}
                <button onClick={() => handleRemoveTag(tag)} className="hover:text-blue-800">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag() }}
              placeholder="添加标签..."
              className="flex-1 px-3 py-1.5 text-xs border border-apple-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white text-apple-text"
            />
            <button
              onClick={handleAddTag}
              disabled={!newTag.trim()}
              className="px-3 py-1.5 text-xs bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-40 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
