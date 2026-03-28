import { useState, useRef, useEffect, useCallback, useMemo, type ChangeEvent, type DragEvent } from 'react'
import {
  Image,
  Video,
  Music,
  Plus,
  Send,
  Search,
  BrainCircuit,
  X,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  Sparkles,
  MonitorPlay,
  FileText,
} from 'lucide-react'
import { useCanvasStore } from '../../store/canvasStore'
import { runNode } from '../../services/imageGeneration'
import {
  getImageReferenceMax,
  getVideoReferenceMax,
  buildReferenceThumbLabels,
  type VideoReferenceMode,
} from '../../services/modelCapabilities'
import { uploadImageFile, resolvePreviewToUploadedUrl } from '../../lib/referenceImageUpload'
import {
  modeConfig,
  IMAGE_RATIO_OPTIONS,
  IMAGE_RESOLUTION_OPTIONS,
  IMAGE_BATCH_OPTIONS,
  VIDEO_LENGTH_OPTIONS,
  VIDEO_RATIO_OPTIONS,
  VIDEO_REFERENCE_OPTIONS,
  type GenerateMode,
} from './constants'

// 附件类型：本地文件 或 拖拽引用
interface Attachment {
  type: 'file' | 'reference'
  file?: File
  previewUrl?: string
  name: string
  refId?: string
}

interface ChatAreaProps {
  selectedItemId: string | null
  onSelectItem: (id: string) => void
}

export default function ChatArea({ selectedItemId, onSelectItem }: ChatAreaProps) {
  const [activeMode, setActiveMode] = useState<GenerateMode>('image')
  const [showModeMenu, setShowModeMenu] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [isSending, setIsSending] = useState(false)
  const { ak, availableModels, addGeneratedAsset, generateHistory, addGenerateHistoryItem, updateGenerateHistoryItem, removeGenerateHistoryItem } = useCanvasStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const modeMenuRef = useRef<HTMLDivElement>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // 图片模式参数
  const imageModels = availableModels.filter((m) => m.ability === 'text2img')
  const [selectedImageModel, setSelectedImageModel] = useState('')
  const [imageRatio, setImageRatio] = useState('1:1')
  const [imageResolution, setImageResolution] = useState('2K')
  const [imageBatch, setImageBatch] = useState(3)

  // 视频模式参数
  const videoModels = availableModels.filter((m) => m.ability === 'text2video')
  const [selectedVideoModel, setSelectedVideoModel] = useState('')
  const [videoLength, setVideoLength] = useState(5)
  const [videoRatio, setVideoRatio] = useState('16:9')
  const [videoRefMode, setVideoRefMode] = useState('all')

  const maxRefAttachments = useMemo(() => {
    if (activeMode === 'image') {
      const m = imageModels.find((x) => x.name === (selectedImageModel || imageModels[0]?.name))
      return getImageReferenceMax(m?.id ?? '', m?.name ?? '')
    }
    if (activeMode === 'video') {
      const m = videoModels.find((x) => x.name === (selectedVideoModel || videoModels[0]?.name))
      return getVideoReferenceMax(m?.id ?? '', m?.name ?? '', videoRefMode as VideoReferenceMode)
    }
    return 0
  }, [activeMode, imageModels, videoModels, selectedImageModel, selectedVideoModel, videoRefMode])

  // 剧本模式参数
  const scriptModels = availableModels.filter((m) => m.ability === 'chat_completion')
  const [selectedScriptModel, setSelectedScriptModel] = useState('')

  // 音频模式参数
  const [audioVoice] = useState('克隆声音')

  // 附件（参考文件）
  const [attachments, setAttachments] = useState<Attachment[]>([])

  // 拖拽状态
  const [isDragOver, setIsDragOver] = useState(false)

  // 弹出面板状态
  const [activePopup, setActivePopup] = useState<string | null>(null)

  // 新消息自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [generateHistory.length])

  // 选中历史项时滚动到对应位置
  useEffect(() => {
    if (selectedItemId && scrollRef.current) {
      const element = scrollRef.current.querySelector(`[data-item-id="${selectedItemId}"]`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [selectedItemId])

  // 自动调整 textarea 高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [prompt])

  // 获取当前模式的有效模型名
  const getActiveModel = (): string => {
    if (activeMode === 'image') {
      return selectedImageModel || imageModels[0]?.name || ''
    }
    if (activeMode === 'video') {
      return selectedVideoModel || videoModels[0]?.name || ''
    }
    if (activeMode === 'script') {
      return selectedScriptModel || scriptModels[0]?.name || ''
    }
    return ''
  }

  // 获取当前模型显示名
  const getModelDisplayName = (): string => {
    const model = getActiveModel()
    if (!model) {
      if (activeMode === 'image') return '图片 5.0 Lite'
      if (activeMode === 'video') return 'Seedance 2.0 Fast'
      if (activeMode === 'script') return 'GLM5'
      return ''
    }
    return model.replace('MaaS_', '')
  }

  const handleSend = async () => {
    if (!prompt.trim() || isSending) return

    const config = modeConfig[activeMode]

    const cappedRefAttachments =
      activeMode === 'image' || activeMode === 'video'
        ? attachments.slice(0, maxRefAttachments)
        : []

    let refUrls: string[] = []
    let refThumbLabels: string[] = []
    if (cappedRefAttachments.length > 0) {
      try {
        for (const att of cappedRefAttachments) {
          if (att.type === 'file' && att.file?.type.startsWith('image/')) {
            refUrls.push(await uploadImageFile(att.file))
          } else if (att.type === 'reference' && att.previewUrl) {
            refUrls.push(await resolvePreviewToUploadedUrl(att.previewUrl, att.name))
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : '参考图处理失败'
        window.alert(msg)
        return
      }
      const vm = activeMode === 'video' ? (videoRefMode as VideoReferenceMode) : 'all'
      refThumbLabels = buildReferenceThumbLabels(
        activeMode === 'image' ? 'image' : 'video',
        vm,
        refUrls.length
      )
    }

    const newItem = {
      id: `gen_${Date.now()}`,
      mode: activeMode,
      prompt: prompt.trim(),
      status: 'generating' as const,
      createdAt: Date.now(),
      ...(refUrls.length > 0
        ? {
            referenceImageUrls: refUrls,
            referenceMode:
              activeMode === 'video' ? (videoRefMode as 'all' | 'first' | 'both') : undefined,
            referenceThumbLabels: refThumbLabels,
          }
        : {}),
    }
    addGenerateHistoryItem(newItem)
    onSelectItem(newItem.id)
    const currentPrompt = prompt.trim()
    setPrompt('')
    setAttachments([])
    setIsSending(true)

    try {
      if (activeMode === 'audio') {
        // 音频暂无对应模型，mock
        await new Promise((r) => setTimeout(r, 1500))
        updateGenerateHistoryItem(newItem.id, {
          status: 'completed',
          result: '音频生成（后端暂无对应模型）',
        })
        addGeneratedAsset({
          id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: currentPrompt.slice(0, 30) || config.label,
          url: '',
          type: 'audio',
          source: 'generate',
          createdAt: Date.now(),
        })
      } else if (activeMode === 'script') {
        // 剧本生成 - 使用 GLM5 (chat_completion)
        const model = getActiveModel()
        if (!model) throw new Error('没有可用的文本生成模型（GLM5），请检查后端服务')

        const result = await runNode(ak, {
          type: 'text',
          prompt: currentPrompt,
          model,
        })

        const generatedText = result.outputs.text || result.outputs.content_url || ''
        updateGenerateHistoryItem(newItem.id, {
          status: 'completed',
          result: generatedText || '生成完成',
        })
        addGeneratedAsset({
          id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: currentPrompt.slice(0, 30) || config.label,
          url: '',
          type: 'text',
          source: 'generate',
          textContent: generatedText,
          createdAt: Date.now(),
        })
      } else {
        // 图片/视频生成
        const model = getActiveModel()
        if (!model) throw new Error('没有可用的生成模型，请检查后端服务')

        const result = await runNode(ak, {
          type: config.apiType,
          prompt: currentPrompt,
          model,
          ...(activeMode === 'image'
            ? {
                size: imageResolution,
                response_format: 'url' as const,
                ...(refUrls.length > 0 ? { reference_image_urls: refUrls } : {}),
              }
            : {}),
          ...(activeMode === 'video'
            ? {
                length: videoLength,
                ...(refUrls.length > 0
                  ? {
                      reference_image_urls: refUrls,
                      video_reference_mode: videoRefMode as 'all' | 'first' | 'both',
                    }
                  : {}),
              }
            : {}),
        })

        const contentUrl = result.outputs.content_url || ''
        const resultText = contentUrl ? `${config.label}已完成` : '已生成'

        updateGenerateHistoryItem(newItem.id, {
          status: 'completed',
          result: resultText,
          resultUrl: contentUrl,
        })

        addGeneratedAsset({
          id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: currentPrompt.slice(0, 30) || config.label,
          url: contentUrl,
          type: config.apiType as 'image' | 'video',
          source: 'generate',
          createdAt: Date.now(),
        })
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '生成失败'
      updateGenerateHistoryItem(newItem.id, {
        status: 'completed',
        result: `生成失败: ${errorMsg}`,
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: Attachment[] = Array.from(e.target.files).map((file) => ({
        type: 'file' as const,
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        name: file.name,
      }))
      setAttachments((prev) => [...prev, ...newFiles])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  // 拖拽处理
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    // 处理拖入的文件
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles: Attachment[] = Array.from(e.dataTransfer.files).map((file) => ({
        type: 'file' as const,
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        name: file.name,
      }))
      setAttachments((prev) => {
        const merged = [...prev, ...newFiles]
        if ((activeMode === 'image' || activeMode === 'video') && maxRefAttachments > 0) {
          return merged.slice(0, maxRefAttachments)
        }
        return merged
      })
      return
    }

    // 处理拖入的引用数据（从历史记录拖入）
    try {
      const data = e.dataTransfer.getData('application/json')
      if (data) {
        const refData = JSON.parse(data)
        if (refData.type === 'generated-content') {
          const newRef: Attachment = {
            type: 'reference',
            previewUrl: refData.url,
            name: refData.name || '参考内容',
            refId: refData.id,
          }
          setAttachments((prev) => {
            const merged = [...prev, newRef]
            if ((activeMode === 'image' || activeMode === 'video') && maxRefAttachments > 0) {
              return merged.slice(0, maxRefAttachments)
            }
            return merged
          })
        }
      }
    } catch {
      // 忽略解析错误
    }
  }, [activeMode, maxRefAttachments])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const togglePopup = (name: string) => {
    setActivePopup(activePopup === name ? null : name)
  }

  const ModeIcon = modeConfig[activeMode].icon

  // ===== 渲染底部工具栏 =====
  const renderToolbar = () => {
    return (
      <div className="flex items-center gap-1.5 px-3 py-2 border-t border-apple-border-light/50">
        {/* 模式切换按钮 */}
        <div className="relative" ref={modeMenuRef}>
          <button
            onClick={() => setShowModeMenu(!showModeMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-brand bg-brand-50/60 hover:bg-brand-50 border border-brand/15 transition-all"
          >
            <ModeIcon size={14} />
            {modeConfig[activeMode].label}
            {showModeMenu ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {/* 模式选择菜单 - 向上弹出 */}
          {showModeMenu && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setShowModeMenu(false)} />
              <div
                className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-2xl border border-apple-border-light shadow-xl overflow-hidden z-[70]"
              >
                <div className="px-3 py-2 text-[10px] font-medium text-apple-text-tertiary">
                  创作类型
                </div>
                {(Object.entries(modeConfig) as [GenerateMode, (typeof modeConfig)[GenerateMode]][]).map(([key, config]) => {
                  const ItemIcon = config.icon
                  const isActive = activeMode === key
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setActiveMode(key)
                        setShowModeMenu(false)
                        setActivePopup(null)
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                        isActive
                          ? 'text-brand bg-brand-50'
                          : 'text-apple-text hover:bg-apple-bg-secondary'
                      }`}
                    >
                      <ItemIcon size={16} />
                      {config.label}
                      {isActive && <Check size={14} className="ml-auto text-brand" />}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* 根据模式显示不同参数按钮 */}
        {activeMode === 'image' && renderImageParams()}
        {activeMode === 'video' && renderVideoParams()}
        {activeMode === 'audio' && renderAudioParams()}
        {activeMode === 'script' && renderScriptParams()}

        {/* 右侧: 生成数量 + 发送按钮 */}
        <div className="flex-1" />
        {activeMode === 'image' && (
          <div className="relative">
            <button
              onClick={() => togglePopup('batch')}
              className="flex items-center gap-1 px-2 py-1 text-xs text-apple-text-secondary hover:bg-apple-bg-secondary rounded-lg transition-colors"
            >
              <Sparkles size={12} />
              {imageBatch} / 张
            </button>
            {activePopup === 'batch' && (
              <>
                <div className="fixed inset-0 z-[60]" onClick={() => setActivePopup(null)} />
                <div className="absolute bottom-full right-0 mb-2 min-w-[100px] bg-white rounded-xl border border-apple-border-light shadow-lg overflow-hidden z-[70]">
                  {IMAGE_BATCH_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setImageBatch(opt.value); setActivePopup(null) }}
                      className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between transition-colors ${
                        opt.value === imageBatch ? 'text-brand bg-brand-50' : 'text-apple-text hover:bg-apple-bg-secondary'
                      }`}
                    >
                      {opt.label}
                      {opt.value === imageBatch && <Check size={10} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {activeMode === 'video' && (
          <div className="flex items-center gap-1 px-2 py-1 text-xs text-apple-text-secondary">
            <Sparkles size={12} />
            50
          </div>
        )}
        <button
          onClick={handleSend}
          disabled={!prompt.trim() || isSending}
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-apple-text hover:bg-gray-700 disabled:bg-apple-border-light disabled:cursor-not-allowed transition-all"
        >
          {isSending ? (
            <Loader2 size={14} className="text-white animate-spin" />
          ) : (
            <Send size={14} className="text-white" />
          )}
        </button>
      </div>
    )
  }

  // 图片模式参数按钮
  const renderImageParams = () => {
    const modelName = getModelDisplayName()
    return (
      <>
        {/* 模型选择 */}
        <div className="relative">
          <button
            onClick={() => togglePopup('imageModel')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs text-apple-text-secondary hover:bg-apple-bg-secondary border border-apple-border-light/60 transition-colors"
          >
            <div className="w-4 h-4 rounded bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">S</span>
            </div>
            {modelName}
          </button>
          {activePopup === 'imageModel' && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setActivePopup(null)} />
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-2xl border border-apple-border-light shadow-xl overflow-hidden z-[70]">
                <div className="px-3 py-2 text-[10px] text-apple-text-tertiary">
                  选择模型
                </div>
                {imageModels.length > 0 ? imageModels.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedImageModel(m.name); setActivePopup(null) }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                      (selectedImageModel || imageModels[0]?.name) === m.name
                        ? 'text-brand bg-brand-50'
                        : 'text-apple-text hover:bg-apple-bg-secondary'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-white font-bold">AI</span>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">{m.name.replace('MaaS_', '')}</div>
                      <div className="text-[10px] text-apple-text-tertiary">{m.description || '指令响应精准'}</div>
                    </div>
                    {(selectedImageModel || imageModels[0]?.name) === m.name && <Check size={14} className="ml-auto text-brand" />}
                  </button>
                )) : (
                  <div className="px-3 py-4 text-xs text-apple-text-tertiary text-center">无可用模型</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 比例选择 */}
        <div className="relative">
          <button
            onClick={() => togglePopup('imageRatio')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs text-apple-text-secondary hover:bg-apple-bg-secondary border border-apple-border-light/60 transition-colors"
          >
            <MonitorPlay size={12} />
            {imageRatio}
            <span className="text-apple-text-tertiary ml-0.5">{imageResolution === '2K' ? '高清 2K' : '超清 4K'}</span>
          </button>
          {activePopup === 'imageRatio' && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setActivePopup(null)} />
              <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-2xl border border-apple-border-light shadow-xl p-4 z-[70]">
                <div className="text-xs text-apple-text-tertiary mb-3">选择比例</div>
                <div className="grid grid-cols-9 gap-1 mb-4">
                  {IMAGE_RATIO_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setImageRatio(opt.value)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] transition-colors ${
                        imageRatio === opt.value
                          ? 'bg-brand-50 text-brand border border-brand/20'
                          : 'hover:bg-apple-bg-secondary text-apple-text-secondary'
                      }`}
                    >
                      {opt.icon ? (
                        <span className="text-sm">{opt.icon}</span>
                      ) : (
                        <div className={`border border-current rounded-sm ${getRatioBoxStyle(opt.value)}`} />
                      )}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
                <div className="text-xs text-apple-text-tertiary mb-2">选择分辨率</div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {IMAGE_RESOLUTION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setImageResolution(opt.value)}
                      className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                        imageResolution === opt.value
                          ? 'bg-brand-50 text-brand border border-brand/20'
                          : 'bg-apple-bg-secondary text-apple-text-secondary hover:bg-apple-bg-tertiary'
                      }`}
                    >
                      {opt.label}
                      {opt.value === '4K' && <span className="ml-1 text-brand">✦</span>}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setActivePopup(null)}
                  className="w-full py-2 text-xs font-medium text-brand hover:bg-brand-50 rounded-xl transition-colors"
                >
                  确定
                </button>
              </div>
            </>
          )}
        </div>
      </>
    )
  }

  // 视频模式参数按钮
  const renderVideoParams = () => {
    const modelName = selectedVideoModel ? selectedVideoModel.replace('MaaS_', '') : 'Seedance 2.0 Fast'
    return (
      <>
        {/* 模型选择 */}
        <div className="relative">
          <button
            onClick={() => togglePopup('videoModel')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs text-apple-text-secondary hover:bg-apple-bg-secondary border border-apple-border-light/60 transition-colors"
          >
            <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">V</span>
            </div>
            {modelName}
          </button>
          {activePopup === 'videoModel' && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setActivePopup(null)} />
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-2xl border border-apple-border-light shadow-xl overflow-hidden z-[70]">
                <div className="px-3 py-2 text-[10px] text-apple-text-tertiary">选择模型</div>
                {videoModels.length > 0 ? videoModels.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedVideoModel(m.name); setActivePopup(null) }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                      (selectedVideoModel || videoModels[0]?.name) === m.name
                        ? 'text-brand bg-brand-50'
                        : 'text-apple-text hover:bg-apple-bg-secondary'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-white font-bold">V</span>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">{m.name.replace('MaaS_', '')}</div>
                      <div className="text-[10px] text-apple-text-tertiary">{m.description || ''}</div>
                    </div>
                    {(selectedVideoModel || videoModels[0]?.name) === m.name && <Check size={14} className="ml-auto text-brand" />}
                  </button>
                )) : (
                  <div className="px-3 py-4 text-xs text-apple-text-tertiary text-center">无可用模型</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 参考模式 */}
        <div className="relative">
          <button
            onClick={() => togglePopup('videoRef')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs text-apple-text-secondary hover:bg-apple-bg-secondary border border-apple-border-light/60 transition-colors"
          >
            <Image size={12} />
            {VIDEO_REFERENCE_OPTIONS.find((o) => o.value === videoRefMode)?.label || '全能参考'}
            <ChevronDown size={10} />
          </button>
          {activePopup === 'videoRef' && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setActivePopup(null)} />
              <div className="absolute bottom-full left-0 mb-2 min-w-[120px] bg-white rounded-xl border border-apple-border-light shadow-lg overflow-hidden z-[70]">
                {VIDEO_REFERENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setVideoRefMode(opt.value); setActivePopup(null) }}
                    className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between transition-colors ${
                      opt.value === videoRefMode ? 'text-brand bg-brand-50' : 'text-apple-text hover:bg-apple-bg-secondary'
                    }`}
                  >
                    {opt.label}
                    {opt.value === videoRefMode && <Check size={10} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 比例 */}
        <div className="relative">
          <button
            onClick={() => togglePopup('videoRatio')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs text-apple-text-secondary hover:bg-apple-bg-secondary border border-apple-border-light/60 transition-colors"
          >
            <MonitorPlay size={12} />
            {videoRatio}
          </button>
          {activePopup === 'videoRatio' && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setActivePopup(null)} />
              <div className="absolute bottom-full left-0 mb-2 min-w-[100px] bg-white rounded-xl border border-apple-border-light shadow-lg overflow-hidden z-[70]">
                {VIDEO_RATIO_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setVideoRatio(opt.value); setActivePopup(null) }}
                    className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between transition-colors ${
                      opt.value === videoRatio ? 'text-brand bg-brand-50' : 'text-apple-text hover:bg-apple-bg-secondary'
                    }`}
                  >
                    {opt.label}
                    {opt.value === videoRatio && <Check size={10} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 时长 */}
        <div className="relative">
          <button
            onClick={() => togglePopup('videoLen')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs text-apple-text-secondary hover:bg-apple-bg-secondary border border-apple-border-light/60 transition-colors"
          >
            <span className="w-3 h-3 border border-current rounded-full flex items-center justify-center text-[8px]">⏱</span>
            {videoLength}s
          </button>
          {activePopup === 'videoLen' && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setActivePopup(null)} />
              <div className="absolute bottom-full left-0 mb-2 min-w-[80px] bg-white rounded-xl border border-apple-border-light shadow-lg overflow-hidden z-[70]">
                {VIDEO_LENGTH_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setVideoLength(opt.value); setActivePopup(null) }}
                    className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between transition-colors ${
                      opt.value === videoLength ? 'text-brand bg-brand-50' : 'text-apple-text hover:bg-apple-bg-secondary'
                    }`}
                  >
                    {opt.label}
                    {opt.value === videoLength && <Check size={10} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </>
    )
  }

  // 音频模式参数
  const renderAudioParams = () => (
    <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs text-apple-text-secondary border border-apple-border-light/60">
      <Music size={12} className="text-brand" />
      {audioVoice}
    </span>
  )

  // 剧本模式参数
  const renderScriptParams = () => (
    <>
      {/* 模型选择 */}
      <div className="relative">
        <button
          onClick={() => togglePopup('scriptModel')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs text-apple-text-secondary hover:bg-apple-bg-secondary border border-apple-border-light/60 transition-colors"
        >
          <div className="w-4 h-4 rounded bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
            <span className="text-[8px] text-white font-bold">G</span>
          </div>
          {getModelDisplayName()}
        </button>
        {activePopup === 'scriptModel' && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setActivePopup(null)} />
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-2xl border border-apple-border-light shadow-xl overflow-hidden z-[70]">
              <div className="px-3 py-2 text-[10px] text-apple-text-tertiary">选择模型</div>
              {scriptModels.length > 0 ? scriptModels.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setSelectedScriptModel(m.name); setActivePopup(null) }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                    (selectedScriptModel || scriptModels[0]?.name) === m.name
                      ? 'text-brand bg-brand-50'
                      : 'text-apple-text hover:bg-apple-bg-secondary'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-white font-bold">G</span>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">{m.name}</div>
                    <div className="text-[10px] text-apple-text-tertiary">{m.description || '智谱大模型'}</div>
                  </div>
                  {(selectedScriptModel || scriptModels[0]?.name) === m.name && <Check size={14} className="ml-auto text-brand" />}
                </button>
              )) : (
                <div className="px-3 py-4 text-xs text-apple-text-tertiary text-center">无可用模型</div>
              )}
            </div>
          </>
        )}
      </div>
      <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs text-apple-text-secondary hover:bg-apple-bg-secondary border border-apple-border-light/60 transition-colors">
        <BrainCircuit size={12} />
        深度思考
      </button>
      <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs text-apple-text-secondary hover:bg-apple-bg-secondary border border-apple-border-light/60 transition-colors">
        <Search size={12} />
        搜索
      </button>
    </>
  )

  // 渲染占位文本
  const renderPlaceholder = () => {
    switch (activeMode) {
      case 'image':
        return '请描述你想生成的图片'
      case 'video':
        return '使用 @ 快速调用参考内容，例如：@图片1 模仿 @视频1 的动作，音色参考 @音频1'
      case 'audio':
        return '请输入你想生成的说话内容'
      case 'script':
        return '输入剧本大纲或创意，AI帮你生成完整剧本'
    }
  }

  // 获取比例示意框样式
  function getRatioBoxStyle(ratio: string): string {
    const styles: Record<string, string> = {
      '21:9': 'w-5 h-2',
      '16:9': 'w-4 h-2.5',
      '3:2': 'w-3.5 h-2.5',
      '4:3': 'w-3 h-2.5',
      '1:1': 'w-3 h-3',
      '3:4': 'w-2.5 h-3',
      '2:3': 'w-2.5 h-3.5',
      '9:16': 'w-2.5 h-4',
    }
    return styles[ratio] || 'w-3 h-3'
  }

  // 渲染单条历史记录（对话气泡样式）
  const renderHistoryItem = (item: typeof generateHistory[0]) => {
    const Icon = modeConfig[item.mode].icon
    const isSelected = selectedItemId === item.id

    return (
      <div
        key={item.id}
        data-item-id={item.id}
        className="space-y-3"
      >
        {/* 用户消息 - 右侧 */}
        <div className="flex justify-end">
          <div
            className="max-w-[85%] bg-brand-50 rounded-2xl rounded-tr-md px-4 py-3 cursor-pointer transition-colors hover:bg-brand-50/80"
            onClick={() => onSelectItem(item.id)}
          >
            {item.referenceImageUrls && item.referenceImageUrls.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap justify-end">
                {item.referenceImageUrls.map((url, ri) => (
                  <div key={`${item.id}-u-${ri}`} className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] text-apple-text-secondary">
                      {item.referenceThumbLabels?.[ri] ?? `参考${ri + 1}`}
                    </span>
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-brand/20 bg-white">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-apple-text leading-relaxed">{item.prompt}</p>
          </div>
        </div>

        {/* AI 回复 - 左侧 */}
        <div className="flex justify-start">
          <div
            onClick={() => onSelectItem(item.id)}
            draggable={item.status === 'completed' && !!item.resultUrl}
            onDragStart={(e) => {
              if (item.resultUrl) {
                e.dataTransfer.setData('application/json', JSON.stringify({
                  type: 'generated-content',
                  id: item.id,
                  url: item.resultUrl,
                  name: item.prompt.slice(0, 20),
                  mode: item.mode,
                }))
              }
            }}
            className={`max-w-[85%] bg-apple-bg-tertiary rounded-2xl rounded-tl-md border p-4 group/item relative cursor-pointer transition-colors ${
              isSelected ? 'border-brand/30 ring-1 ring-brand/10' : 'border-apple-border-light hover:border-apple-border'
            }`}
          >
            {/* 模式标签 + 时间 */}
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} className="text-brand" />
              <span className="text-xs font-medium text-brand">
                {modeConfig[item.mode].label}
              </span>
              <span className="text-[10px] text-apple-text-tertiary">
                {new Date(item.createdAt).toLocaleTimeString()}
              </span>
              <div className="flex-1" />
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(item.id) }}
                className="p-1 rounded-lg opacity-0 group-hover/item:opacity-100 text-apple-text-tertiary hover:text-red-500 hover:bg-red-50 transition-all"
                title="删除"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* 生成中状态 */}
            {item.status === 'generating' && (
              <div className="flex items-center gap-2 text-xs text-apple-text-secondary">
                <Loader2 size={14} className="animate-spin text-brand" />
                <span>
                  {item.mode === 'video' ? '视频生成中，预计需要1-5分钟...' : '生成中...'}
                </span>
              </div>
            )}

            {/* 生成完成 */}
            {item.status === 'completed' && item.result && (
              <div>
                {/* 图片结果 */}
                {item.resultUrl && item.mode === 'image' && (
                  <img src={item.resultUrl} alt="" className="w-full max-w-xs rounded-xl mb-3" />
                )}
                {/* 视频结果 */}
                {item.resultUrl && item.mode === 'video' && (
                  <video
                    src={item.resultUrl}
                    controls
                    preload="metadata"
                    className="w-full max-w-xs rounded-xl mb-3"
                  />
                )}
                {/* 音频结果 */}
                {item.resultUrl && item.mode === 'audio' && (
                  <audio src={item.resultUrl} controls className="w-full mb-3" />
                )}
                {/* 文本结果 */}
                <p className="text-sm text-apple-text-secondary whitespace-pre-wrap">{item.result}</p>
                <div className="flex items-center gap-2 mt-3">
                  <button className="px-3 py-1.5 text-xs font-medium bg-white text-apple-text-secondary rounded-lg border border-apple-border-light hover:bg-apple-bg-secondary transition-colors">
                    重新编辑
                  </button>
                  <button className="px-3 py-1.5 text-xs font-medium bg-white text-apple-text-secondary rounded-lg border border-apple-border-light hover:bg-apple-bg-secondary transition-colors">
                    再次生成
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full relative">
      {/* 历史记录区域 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8">
        {generateHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-apple-bg-secondary flex items-center justify-center">
                <ModeIcon size={28} className="text-apple-text-tertiary" />
              </div>
              <h2 className="text-lg font-semibold text-apple-text mb-2">开始你的创作</h2>
              <p className="text-sm text-apple-text-secondary">选择生成模式，输入提示词即可开始</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto">
            {generateHistory.map((item) => renderHistoryItem(item))}
          </div>
        )}
      </div>

      {/* 底部固定输入区域 - 即梦风格 */}
      <div className="bg-gradient-to-t from-white via-white/95 to-transparent pt-4 pb-5 px-4 relative z-[50]">
        <div className="max-w-3xl mx-auto">
          <div
            className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-visible ${
              isDragOver ? 'border-brand ring-2 ring-brand/20' : 'border-apple-border-light'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* 上方：附件 + 文本输入区 */}
            <div className="px-4 pt-3 pb-2">
              {/* 附件展示区 */}
              {attachments.length > 0 && (
                <div className="flex items-start gap-2 mb-3 flex-wrap">
                  {attachments.map((att, index) => (
                    <div
                      key={index}
                      className="relative group/att"
                    >
                      {att.previewUrl ? (
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-apple-border-light">
                          <img src={att.previewUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl border border-apple-border-light bg-apple-bg-secondary flex flex-col items-center justify-center">
                          <span className="text-[9px] text-apple-text-tertiary text-center px-1 truncate w-full">{att.name}</span>
                        </div>
                      )}
                      {att.type === 'reference' && (
                        <div className="absolute -bottom-1 left-0 right-0 flex justify-center">
                          <span className="px-1.5 py-0.5 bg-brand text-white text-[8px] rounded-full">参考内容</span>
                        </div>
                      )}
                      <button
                        onClick={() => removeAttachment(index)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover/att:opacity-100 transition-opacity"
                      >
                        <X size={10} className="text-white" />
                      </button>
                    </div>
                  ))}
                  {/* 添加更多附件按钮 */}
                  <label className="w-16 h-16 rounded-xl border-2 border-dashed border-apple-border flex flex-col items-center justify-center cursor-pointer hover:border-brand/40 hover:bg-brand-50/20 transition-colors">
                    <Plus size={16} className="text-apple-text-tertiary" />
                    <span className="text-[8px] text-apple-text-tertiary mt-0.5">参考内容</span>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*,video/*,audio/*"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
              )}

              {/* 输入行：加号 + textarea */}
              <div className="flex items-start gap-2">
                {/* 左侧 + 号上传按钮（无附件时显示） */}
                {attachments.length === 0 && (
                  <label className="flex-shrink-0 w-12 h-12 rounded-xl bg-apple-bg-secondary border border-apple-border-light/50 flex flex-col items-center justify-center cursor-pointer hover:bg-apple-bg-tertiary transition-colors mt-0.5">
                    <Plus size={18} className="text-apple-text-tertiary" />
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*,video/*,audio/*"
                      onChange={handleFileSelect}
                    />
                  </label>
                )}

                {/* 文本输入区 */}
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={renderPlaceholder()}
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-apple-text placeholder-apple-text-tertiary/60 resize-none outline-none leading-relaxed py-2 min-h-[44px] max-h-[120px]"
                  disabled={isSending}
                  style={{ overflow: 'auto' }}
                />
              </div>
            </div>

            {/* 下方工具栏 */}
            {renderToolbar()}
          </div>
        </div>
      </div>

      {/* 拖拽提示遮罩 */}
      {isDragOver && (
        <div className="absolute inset-0 bg-brand/5 pointer-events-none flex items-center justify-center z-30">
          <div className="bg-white rounded-2xl border-2 border-dashed border-brand px-8 py-6 shadow-lg">
            <p className="text-sm font-medium text-brand">松开即可添加为参考内容</p>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-apple-border-light p-6 w-[360px] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-apple-text">确认删除</h3>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="p-1 text-apple-text-tertiary hover:text-apple-text transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-apple-text-secondary mb-6">删除的历史记录将无法找回</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-medium text-apple-text-secondary bg-apple-bg-secondary rounded-xl border border-apple-border-light hover:bg-apple-border-light transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  removeGenerateHistoryItem(deleteConfirmId)
                  setDeleteConfirmId(null)
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
