import { useState } from 'react'
import { 
  GripVertical, Image, Sparkles, ChevronDown, User, MapPin, 
  Play, Loader2, RotateCcw, Check, Wand2, Save, Plus, Trash2,
  LayoutList, FileText, Eye
} from 'lucide-react'
import { useProjectStore } from '../../../store'
import { useCopilotStore } from '../../../store/copilotStore'
import type { StoryboardPanel } from '../../../store/types'

interface StoryboardEditorProps {
  entityId: string
}

export default function StoryboardEditor({ entityId }: StoryboardEditorProps) {
  const { storyboards, updatePanel, characters, environments } = useProjectStore()
  const { addMessage } = useCopilotStore()
  const storyboard = storyboards.find(s => s.id === entityId)
  
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null)
  const [generatingPanelId, setGeneratingPanelId] = useState<string | null>(null)

  if (!storyboard) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        分镜不存在
      </div>
    )
  }

  const selectedPanel = storyboard.panels.find(p => p.id === selectedPanelId)

  // 模拟生成单个分镜图
  const handleGenerateImage = async (panel: StoryboardPanel) => {
    setGeneratingPanelId(panel.id)
    updatePanel(entityId, panel.id, { status: 'generating' })
    // 模拟生成延迟
    await new Promise(resolve => setTimeout(resolve, 2000))
    updatePanel(entityId, panel.id, { 
      status: 'completed',
      generatedPrompt: `masterpiece, best quality, ${panel.description}, cinematic lighting, dramatic composition`,
      imageUrl: `https://picsum.photos/seed/${panel.id}/400/600`
    })
    setGeneratingPanelId(null)
  }

  // 批量生成所有分镜
  const handleGenerateAll = async () => {
    addMessage({
      role: 'assistant',
      content: `⚡ **开始批量生成分镜图...**\n\n共 ${storyboard.panels.length} 个面板，请稍候。`,
      mode: 'action',
      status: 'completed',
    })
    for (const panel of storyboard.panels) {
      if (panel.status !== 'completed') {
        await handleGenerateImage(panel)
      }
    }
    addMessage({
      role: 'assistant',
      content: `✅ **批量生成完成！**\n\n${storyboard.panels.length} 个分镜图已全部生成。\n你可以点击任意面板查看详情或重新生成。`,
      mode: 'action',
      status: 'completed',
    })
  }

  const completedCount = storyboard.panels.filter(p => p.status === 'completed').length

  return (
    <div className="flex flex-col h-full">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#111]">
        <div className="flex items-center gap-3">
          <LayoutList className="w-5 h-5 text-violet-400" />
          <div>
            <h2 className="text-sm font-medium text-white">{storyboard.name}</h2>
            <p className="text-[10px] text-gray-500">{storyboard.panels.length} 个分镜 · {completedCount} 已生成</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateAll}
            disabled={!!generatingPanelId}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 transition-colors disabled:text-gray-600 disabled:cursor-not-allowed"
          >
            <Wand2 className="w-4 h-4" />
            <span className="text-sm">全部生成</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-400 hover:bg-white/5 transition-colors">
            <Eye className="w-4 h-4" />
            <span className="text-sm">预览</span>
          </button>
        </div>
      </div>

      {/* 来源文本 */}
      <div className="px-6 py-2 border-b border-white/5 bg-[#0d0d0d]">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">来源文本</span>
        </div>
        <p className="text-xs text-gray-400 line-clamp-2">{storyboard.sourceText}</p>
      </div>

      {/* 主区域：左侧面板列表 + 右侧详情 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 分镜卡片列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 max-w-3xl mx-auto">
            {storyboard.panels.map((panel, index) => (
              <div
                key={panel.id}
                onClick={() => setSelectedPanelId(panel.id)}
                className={`group bg-[#161616] border rounded-xl overflow-hidden cursor-pointer transition-all ${
                  selectedPanelId === panel.id 
                    ? 'border-violet-500/50 ring-1 ring-violet-500/25' 
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex">
                  {/* 序号 */}
                  <div className="w-12 bg-white/5 flex flex-col items-center justify-center border-r border-white/5">
                    <GripVertical className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 cursor-grab mb-1" />
                    <span className="text-lg font-bold text-gray-500">{String(index + 1).padStart(2, '0')}</span>
                  </div>

                  {/* 图片区域 */}
                  <div className="w-32 h-44 bg-white/5 flex items-center justify-center relative flex-shrink-0 border-r border-white/5">
                    {panel.status === 'completed' && panel.imageUrl ? (
                      <img src={panel.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : panel.status === 'generating' ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                        <span className="text-[10px] text-gray-500">生成中...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-600">
                        <Image className="w-8 h-8" />
                        <span className="text-[10px]">待生成</span>
                      </div>
                    )}
                    {/* 状态标识 */}
                    <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                      panel.status === 'completed' ? 'bg-green-400' :
                      panel.status === 'generating' ? 'bg-amber-400 animate-pulse' :
                      panel.status === 'prompt_ready' ? 'bg-blue-400' :
                      'bg-gray-600'
                    }`} />
                  </div>

                  {/* 描述与操作区 */}
                  <div className="flex-1 p-4 flex flex-col">
                    {/* 分镜描述 */}
                    <textarea
                      value={panel.description}
                      onChange={(e) => updatePanel(entityId, panel.id, { description: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-transparent text-sm text-gray-200 outline-none resize-none leading-relaxed placeholder-gray-600 min-h-[60px]"
                      placeholder="描述这个分镜的画面..."
                    />

                    {/* 关联的角色和场景 */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {panel.characterIds.map(cId => {
                        const char = characters.find(c => c.id === cId)
                        return char ? (
                          <span key={cId} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-[10px]">
                            <User className="w-2.5 h-2.5" />
                            {char.name}
                          </span>
                        ) : null
                      })}
                      {panel.environmentId && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px]">
                          <MapPin className="w-2.5 h-2.5" />
                          {environments.find(e => e.id === panel.environmentId)?.name || '场景'}
                        </span>
                      )}
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed border-white/10 text-gray-600 hover:text-violet-400 hover:border-violet-500/30 text-[10px] transition-colors"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        关联
                      </button>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleGenerateImage(panel) }}
                        disabled={generatingPanelId === panel.id}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-400 text-xs hover:bg-violet-500/30 transition-colors disabled:opacity-50"
                      >
                        {generatingPanelId === panel.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        {panel.status === 'completed' ? '重新生成' : '生成图片'}
                      </button>
                      {panel.status === 'completed' && (
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 text-gray-400 text-xs hover:bg-white/10 transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          生成视频
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* 添加新分镜 */}
            <button className="py-6 border-2 border-dashed border-white/10 hover:border-violet-500/50 rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:text-violet-400 transition-colors">
              <Plus className="w-5 h-5" />
              添加新分镜面板
            </button>
          </div>
        </div>

        {/* 右侧详情面板（选中分镜时展开） */}
        {selectedPanel && (
          <div className="w-72 border-l border-white/5 bg-[#0d0d0d] overflow-y-auto p-4 space-y-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">
                面板 #{(storyboard.panels.findIndex(p => p.id === selectedPanel.id) ?? 0) + 1} 详情
              </h3>
              <button 
                onClick={() => setSelectedPanelId(null)}
                className="text-gray-500 hover:text-white text-xs"
              >
                关闭
              </button>
            </div>

            {/* 镜头角度 */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">镜头角度</label>
              <select 
                value={selectedPanel.cameraAngle || ''}
                onChange={(e) => updatePanel(entityId, selectedPanel.id, { cameraAngle: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
              >
                <option value="">选择...</option>
                <option value="远景">远景</option>
                <option value="全景">全景</option>
                <option value="中景">中景</option>
                <option value="近景">近景</option>
                <option value="特写">特写</option>
                <option value="俯视">俯视</option>
                <option value="仰视">仰视</option>
              </select>
            </div>

            {/* 情绪氛围 */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">情绪氛围</label>
              <select 
                value={selectedPanel.emotion || ''}
                onChange={(e) => updatePanel(entityId, selectedPanel.id, { emotion: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
              >
                <option value="">选择...</option>
                <option value="平静">平静</option>
                <option value="紧张">紧张</option>
                <option value="悲伤">悲伤</option>
                <option value="愤怒">愤怒</option>
                <option value="喜悦">喜悦</option>
                <option value="恐惧">恐惧</option>
                <option value="神秘">神秘</option>
              </select>
            </div>

            {/* 生成的提示词 */}
            {selectedPanel.generatedPrompt && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">生成提示词</label>
                <textarea
                  value={selectedPanel.generatedPrompt}
                  onChange={(e) => updatePanel(entityId, selectedPanel.id, { generatedPrompt: e.target.value })}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono outline-none focus:border-violet-500/50 resize-none"
                />
              </div>
            )}

            {/* 关联角色 */}
            <div>
              <label className="block text-xs text-gray-500 mb-2">关联角色</label>
              <div className="space-y-1">
                {characters.map(char => {
                  const isLinked = selectedPanel.characterIds.includes(char.id)
                  return (
                    <button
                      key={char.id}
                      onClick={() => {
                        const newIds = isLinked 
                          ? selectedPanel.characterIds.filter(id => id !== char.id)
                          : [...selectedPanel.characterIds, char.id]
                        updatePanel(entityId, selectedPanel.id, { characterIds: newIds })
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        isLinked
                          ? 'bg-violet-500/20 text-violet-400'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {isLinked && <Check className="w-3 h-3" />}
                      <span>{char.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 关联场景 */}
            <div>
              <label className="block text-xs text-gray-500 mb-2">关联场景</label>
              <div className="space-y-1">
                {environments.map(env => {
                  const isLinked = selectedPanel.environmentId === env.id
                  return (
                    <button
                      key={env.id}
                      onClick={() => {
                        updatePanel(entityId, selectedPanel.id, { 
                          environmentId: isLinked ? undefined : env.id 
                        })
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        isLinked
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {isLinked && <Check className="w-3 h-3" />}
                      <span>{env.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部进度条 */}
      <div className="flex items-center justify-between px-6 py-2 border-t border-white/5 bg-[#111] text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>{storyboard.panels.length} 个分镜</span>
          <span>{completedCount} 已完成</span>
          {generatingPanelId && <span className="text-amber-400">生成中...</span>}
        </div>
        <div className="flex-1 mx-6">
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all"
              style={{ width: `${storyboard.panels.length > 0 ? (completedCount / storyboard.panels.length) * 100 : 0}%` }}
            />
          </div>
        </div>
        <span>{storyboard.panels.length > 0 ? Math.round((completedCount / storyboard.panels.length) * 100) : 0}%</span>
      </div>
    </div>
  )
}
