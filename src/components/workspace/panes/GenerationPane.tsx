import { useState, useRef, useEffect, useCallback, useMemo, type ChangeEvent, type DragEvent } from 'react'
import {
  Image,
  Video,
  Plus,
  Send,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Check,
  Sparkles,
  MonitorPlay,
  Film,
  Wand2,
  LayoutGrid,
} from 'lucide-react'
import { useProjectStore } from '../../../store/projectStore'
import { useWorkspaceStore } from '../../../store/workspaceStore'
import { runNode } from '../../../services/imageGeneration'
import {
  getImageReferenceMax,
  getVideoReferenceMax,
  buildReferenceThumbLabels,
  type VideoReferenceMode,
} from '../../../services/modelCapabilities'
import { uploadImageFile, resolvePreviewToUploadedUrl } from '../../../lib/referenceImageUpload'
import {
  modeConfig,
  IMAGE_RATIO_OPTIONS,
  VIDEO_LENGTH_OPTIONS,
  VIDEO_RATIO_OPTIONS,
  VIDEO_REFERENCE_OPTIONS,
  VIDEO_RESOLUTION_OPTIONS,
  resolveImageSize,
  type GenerateMode,
} from '../../generate/constants'
import type { ChatMessage } from '../../../store/types'
import { useEditorOptions } from '../../../hooks/useEditorOptions'
import { useAccountStore } from '../../../store/accountStore'

// 附件类型：本地文件 或 拖拽引用
interface Attachment {
  type: 'file' | 'reference'
  file?: File
  previewUrl?: string
  name: string
  refId?: string
}

interface AIPaneProps {
  fileId?: string
}

export default function AIPane({ fileId }: AIPaneProps) {
  // 从 projectFile 的 projectType 确定初始模式
  const projectFiles = useProjectStore((s) => s.projectFiles)
  const modeFromFile = (() => {
    if (!fileId) return null
    const f = projectFiles.find((cf) => cf.id === fileId)
    if (f?.projectType === 'image') return 'image' as GenerateMode
    if (f?.projectType === 'video') return 'video' as GenerateMode
    return null
  })()
  const initialAIMode = useProjectStore((s) => s.initialAIMode)
  const [activeMode, setActiveMode] = useState<GenerateMode>(modeFromFile || initialAIMode || 'image')
  const [showModeMenu, setShowModeMenu] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const historyEndRef = useRef<HTMLDivElement>(null)
  const modeMenuRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const {
    ak,
    chatMessages,
    appendProjectFileMediaVersion,
    setProjectFileSelectedMediaVersion,
  } = useProjectStore()

  const globalWatermarkDisabled = useAccountStore((s) => s.globalWatermarkDisabled)
  const addBalanceRecord = useAccountStore((s) => s.addBalanceRecord)

  // 从 WelcomeTab 传入的初始模式：消费后清除
  useEffect(() => {
    if (initialAIMode) {
      setActiveMode(initialAIMode)
      useProjectStore.getState().setInitialAIMode(null)
    }
  }, [initialAIMode])

  const boundFile = useMemo(() => {
    if (!fileId) return undefined
    return projectFiles.find((cf) => cf.id === fileId)
  }, [fileId, projectFiles])

  useEffect(() => {
    if (boundFile?.projectType === 'image') setActiveMode('image')
    else if (boundFile?.projectType === 'video') setActiveMode('video')
  }, [boundFile?.id, boundFile?.projectType])

  useEffect(() => {
    setTitleEditing(false)
  }, [fileId])

  // 编辑器参数（持久化）
  const {
    imageModels, videoModels,
    selectedImageModel, setSelectedImageModel,
    imageRatio, setImageRatio,
    imageResolution, setImageResolution,
    imageResolutionOptions,
    imagePromptOptimize, setImagePromptOptimize,
    imageSequentialGeneration, setImageSequentialGeneration,
    imageMaxImages, setImageMaxImages,
    imageOutputFormat, setImageOutputFormat, imageSupportsOutputFormat,
    selectedVideoModel, setSelectedVideoModel,
    videoLength, setVideoLength,
    videoRatio, setVideoRatio,
    videoRefMode, setVideoRefMode,
    videoResolution, setVideoResolution,
    videoCapabilities,
    getActiveModel: getActiveModelByMode,
    getModelDisplayName,
    isVideoRefModeAvailable,
  } = useEditorOptions()

  const maxRefAttachments = useMemo(() => {
    if (activeMode === 'image') {
      const m = imageModels.find((x) => x.name === selectedImageModel)
      return getImageReferenceMax(m?.id ?? '', m?.name ?? '')
    }
    if (activeMode === 'video') {
      const m = videoModels.find((x) => x.name === selectedVideoModel)
      return getVideoReferenceMax(m?.id ?? '', m?.name ?? '', videoRefMode as VideoReferenceMode)
    }
    return 0
  }, [activeMode, imageModels, videoModels, selectedImageModel, selectedVideoModel, videoRefMode])

  // 附件
  const [attachments, setAttachments] = useState<Attachment[]>([])

  // 拖拽状态
  const [isDragOver, setIsDragOver] = useState(false)

  // 图片预览
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // 弹出面板状态
  const [activePopup, setActivePopup] = useState<string | null>(null)

  const [titleEditing, setTitleEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  const renameProjectFile = useProjectStore((s) => s.renameProjectFile)

  const useDedicatedMediaSession = useMemo(
    () =>
      !!fileId &&
      !!boundFile &&
      ((boundFile.projectType === 'image' && activeMode === 'image') ||
        (boundFile.projectType === 'video' && activeMode === 'video')),
    [fileId, boundFile, activeMode]
  )

  const displayChatMessages = useDedicatedMediaSession
    ? (boundFile?.aiSession?.messages ?? [])
    : chatMessages

  const isDedicatedFileTab = boundFile?.projectType === 'image' || boundFile?.projectType === 'video'

  const selectedMediaVersion = useMemo(() => {
    const ms = boundFile?.mediaState
    if (!ms?.selectedVersionId) return null
    return ms.versions.find((v) => v.id === ms.selectedVersionId) ?? null
  }, [boundFile?.mediaState])

  // 自动调整 textarea 高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px'
    }
  }, [prompt])

  // 新消息自动滚动
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [displayChatMessages.length])

  // 获取当前模式的有效模型名
  const getActiveModel = (): string => getActiveModelByMode(activeMode)

  const handleSend = async () => {
    if (!prompt.trim() || isSending) return

    const messageId = `msg_${Date.now()}`

    // 组装上下文 prompt
    let assembledPrompt = prompt.trim()

    const boundNow = fileId ? useProjectStore.getState().projectFiles.find((f) => f.id === fileId) : undefined
    const useDedicatedMediaSessionSend =
      !!fileId &&
      !!boundNow &&
      ((boundNow.projectType === 'image' && activeMode === 'image') ||
        (boundNow.projectType === 'video' && activeMode === 'video'))

    const addMsg = (m: ChatMessage) => {
      const st = useProjectStore.getState()
      if (useDedicatedMediaSessionSend && fileId) st.addProjectFileChatMessage(fileId, m)
      else st.addChatMessage(m)
    }
    const updMsg = (id: string, updates: Partial<ChatMessage>) => {
      const st = useProjectStore.getState()
      if (useDedicatedMediaSessionSend && fileId) st.updateProjectFileChatMessage(fileId, id, updates)
      else st.updateChatMessage(id, updates)
    }

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

    const userMessage: ChatMessage = {
      id: messageId,
      role: 'user',
      mode: activeMode,
      content: prompt.trim(),
      referenceImageUrls: refUrls.length > 0 ? refUrls : undefined,
      referenceMode:
        activeMode === 'video' && refUrls.length > 0 ? (videoRefMode as 'all' | 'first' | 'both') : undefined,
      referenceThumbLabels: refThumbLabels.length > 0 ? refThumbLabels : undefined,
      status: 'sending',
      createdAt: Date.now(),
    }
    addMsg(userMessage)
    const currentPrompt = assembledPrompt
    setPrompt('')
    setAttachments([])

    setIsSending(true)
    updMsg(messageId, { status: 'generating' })

    try {
      if (activeMode === 'image') {
        const model = getActiveModel()
        if (!model) throw new Error('没有可用的图片生成模型，请检查后端服务')
        const result = await runNode(ak, {
          type: 'image',
          prompt: currentPrompt,
          model,
          size: resolveImageSize(model, imageRatio, imageResolution),
          response_format: 'url',
          watermark: !globalWatermarkDisabled,
          ...(imagePromptOptimize ? { optimize_prompt_options: { mode: 'standard' as const } } : {}),
          ...(imageSequentialGeneration ? {
            sequential_image_generation: 'auto' as const,
            sequential_image_generation_options: { max_images: imageMaxImages },
          } : {}),
          ...(imageSupportsOutputFormat && imageOutputFormat !== 'jpeg' ? { output_format: imageOutputFormat } : {}),
          ...(refUrls.length > 0 ? { image: refUrls } : {}),
        })
        const contentUrl = result.outputs.content_url || ''
        const contentUrls = result.outputs.content_urls || (contentUrl ? [contentUrl] : [])

        if (useDedicatedMediaSessionSend && fileId) {
          appendProjectFileMediaVersion(fileId, { url: contentUrls[0] || contentUrl, prompt: currentPrompt, model })
          updMsg(messageId, {
            status: 'completed',
            resultUrl: contentUrls[0] || contentUrl,
            ...(contentUrls.length > 1 ? { resultUrls: contentUrls } : {}),
            resultText: contentUrls.length > 1
              ? `已生成 ${contentUrls.length} 张组图，首张已保存为当前版本`
              : '已保存为本文件的当前版本（引用与缩略图均指向此版本）',
          })
        } else {
          updMsg(messageId, {
            status: 'completed',
            resultUrl: contentUrls[0] || contentUrl,
            ...(contentUrls.length > 1 ? { resultUrls: contentUrls } : {}),
            resultText: contentUrls.length > 1 ? `已生成 ${contentUrls.length} 张组图` : '图片已生成',
          })
        }

        // 记录余额消耗
        const modelInfo = imageModels.find((m) => m.name === model)
        const cost = (modelInfo?.costRate ?? 1) * 0.5 * (contentUrls.length || 1)
        addBalanceRecord({ type: 'consume', event: `图片生成 - ${model.replace('MaaS_', '')}`, amount: -cost, timestamp: Date.now(), model })
      } else if (activeMode === 'video') {
        const model = getActiveModel()
        if (!model) throw new Error('没有可用的视频生成模型，请检查后端服务')
        const result = await runNode(ak, {
          type: 'video',
          prompt: currentPrompt,
          model,
          length: videoLength,
          watermark: !globalWatermarkDisabled,
          ...(refUrls.length > 0
            ? {
                image: refUrls,
                video_reference_mode: videoRefMode as 'all' | 'first' | 'both',
              }
            : {}),
        })
        const contentUrl = result.outputs.content_url || ''
        if (useDedicatedMediaSessionSend && fileId) {
          appendProjectFileMediaVersion(fileId, { url: contentUrl, prompt: currentPrompt, model })
          updMsg(messageId, {
            status: 'completed',
            resultUrl: contentUrl,
            resultText: '已保存为本文件的当前视频版本',
          })
        } else {
          updMsg(messageId, { status: 'completed', resultUrl: contentUrl, resultText: '视频已生成' })
        }

        // 记录余额消耗
        const modelInfo = videoModels.find((m) => m.name === model)
        const cost = (modelInfo?.costRate ?? 1) * 3
        addBalanceRecord({ type: 'consume', event: `视频生成 - ${model.replace('MaaS_', '')}`, amount: -cost, timestamp: Date.now(), model })
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '生成失败'
      updMsg(messageId, { status: 'failed', errorMessage: errorMsg })
    } finally {
      setIsSending(false)
    }

    setTimeout(() => historyEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const imageFiles = Array.from(e.target.files).filter((f) => f.type.startsWith('image/'))
      if (imageFiles.length === 0) return
      const newFiles: Attachment[] = imageFiles.map((file) => ({
        type: 'file' as const,
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
      }))
      setAttachments((prev) => {
        const merged = [...prev, ...newFiles]
        if ((activeMode === 'image' || activeMode === 'video') && maxRefAttachments > 0) {
          return merged.slice(0, maxRefAttachments)
        }
        return merged
      })
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const imageFiles = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
      if (imageFiles.length === 0) return
      const newFiles: Attachment[] = imageFiles.map((file) => ({
        type: 'file' as const,
        file,
        previewUrl: URL.createObjectURL(file),
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

  function getRatioBoxStyle(ratio: string): string {
    const styles: Record<string, string> = {
      '21:9': 'w-4 h-1.5',
      '16:9': 'w-3.5 h-2',
      '3:2': 'w-3 h-2',
      '4:3': 'w-2.5 h-2',
      '1:1': 'w-2.5 h-2.5',
      '3:4': 'w-2 h-2.5',
      '2:3': 'w-2 h-3',
      '9:16': 'w-2 h-3.5',
    }
    return styles[ratio] || 'w-2.5 h-2.5'
  }

  // ===== 渲染底部工具栏 =====
  const renderToolbar = () => (
    <div className="flex items-center gap-1 px-2 py-1.5 border-t border-apple-border-light/50 flex-wrap">
      {isDedicatedFileTab ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-apple-text bg-apple-bg-secondary border border-apple-border-light/60">
          {boundFile?.projectType === 'image' ? <Image size={12} className="text-purple-500" /> : <Video size={12} className="text-rose-500" />}
          {boundFile?.projectType === 'image' ? '图片文件' : '视频文件'}
        </div>
      ) : (
        <div className="relative" ref={modeMenuRef}>
          <button
            onClick={() => setShowModeMenu(!showModeMenu)}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium text-brand bg-brand-50/60 hover:bg-brand-50 border border-brand/15 transition-all"
            disabled={isSending}
          >
            <ModeIcon size={12} />
            {modeConfig[activeMode].label}
            {showModeMenu ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>

          {showModeMenu && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setShowModeMenu(false)} />
              <div className="absolute bottom-full left-0 mb-2 w-40 bg-white rounded-2xl border border-apple-border-light shadow-xl overflow-hidden z-[70]">
                <div className="px-3 py-1.5 text-[10px] font-medium text-apple-text-tertiary">
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
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                        isActive
                          ? 'text-brand bg-brand-50'
                          : 'text-apple-text hover:bg-apple-bg-secondary'
                      }`}
                    >
                      <ItemIcon size={14} />
                      {config.label}
                      {isActive && <Check size={12} className="ml-auto text-brand" />}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* 根据模式显示不同参数按钮 */}
      {activeMode === 'image' && renderImageParams()}
      {activeMode === 'video' && renderVideoParams()}

      {/* 右侧: 发送按钮 */}
      <div className="flex-1" />
      {activeMode === 'video' && (
        <div className="flex items-center gap-0.5 px-1.5 py-1 text-[11px] text-apple-text-secondary">
          <Sparkles size={10} />
          50
        </div>
      )}
      <button
        onClick={handleSend}
        disabled={!prompt.trim() || isSending}
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-apple-text hover:bg-gray-700 disabled:bg-apple-border-light disabled:cursor-not-allowed transition-all"
      >
        {isSending ? (
          <Loader2 size={12} className="text-white animate-spin" />
        ) : (
          <Send size={12} className="text-white" />
        )}
      </button>
    </div>
  )

  // 图片模式参数按钮
  const renderImageParams = () => {
    const modelName = getModelDisplayName(activeMode)
    return (
      <>
        <div className="relative">
          <button
            onClick={() => togglePopup('imageModel')}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-apple-text-secondary hover:bg-apple-bg-secondary border border-apple-border-light/60 transition-colors"
          >
            <div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <span className="text-[7px] text-white font-bold">S</span>
            </div>
            {modelName}
          </button>
          {activePopup === 'imageModel' && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setActivePopup(null)} />
              <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-2xl border border-apple-border-light shadow-xl overflow-hidden z-[70]">
                <div className="px-3 py-1.5 text-[10px] text-apple-text-tertiary">选择模型</div>
                {imageModels.length > 0 ? imageModels.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedImageModel(m.name); setActivePopup(null) }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                      selectedImageModel === m.name
                        ? 'text-brand bg-brand-50'
                        : 'text-apple-text hover:bg-apple-bg-secondary'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-[8px] text-white font-bold">AI</span>
                    </div>
                    <div className="text-left min-w-0">
                      <div className="text-xs font-medium truncate">{m.name.replace('MaaS_', '')}</div>
                    </div>
                    {selectedImageModel === m.name && <Check size={12} className="ml-auto text-brand flex-shrink-0" />}
                  </button>
                )) : (
                  <div className="px-3 py-3 text-[11px] text-apple-text-tertiary text-center">无可用模型</div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => togglePopup('imageRatio')}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-apple-text-secondary hover:bg-apple-bg-secondary border border-apple-border-light/60 transition-colors"
          >
            <MonitorPlay size={10} />
            {imageRatio}
            <span className="text-apple-text-tertiary">{imageResolution === '2K' ? '2K' : '4K'}</span>
          </button>
          {activePopup === 'imageRatio' && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setActivePopup(null)} />
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-2xl border border-apple-border-light shadow-xl p-3 z-[70]">
                <div className="text-[10px] text-apple-text-tertiary mb-2">选择比例</div>
                <div className="grid grid-cols-9 gap-0.5 mb-3">
                  {IMAGE_RATIO_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setImageRatio(opt.value)}
                      className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[9px] transition-colors ${
                        imageRatio === opt.value
                          ? 'bg-brand-50 text-brand border border-brand/20'
                          : 'hover:bg-apple-bg-secondary text-apple-text-secondary'
                      }`}
                    >
                      {opt.icon ? (
                        <span className="text-xs">{opt.icon}</span>
                      ) : (
                        <div className={`border border-current rounded-sm ${getRatioBoxStyle(opt.value)}`} />
                      )}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-apple-text-tertiary mb-2">分辨率</div>
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {imageResolutionOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setImageResolution(opt.value)}
                      className={`py-1.5 rounded-xl text-[11px] font-medium transition-colors ${
                        imageResolution === opt.value
                          ? 'bg-brand-50 text-brand border border-brand/20'
                          : 'bg-apple-bg-secondary text-apple-text-secondary hover:bg-apple-bg-tertiary'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 提示词优化开关 */}
        <button
          onClick={() => setImagePromptOptimize(!imagePromptOptimize)}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] transition-colors border ${
            imagePromptOptimize
              ? 'text-violet-600 bg-violet-50/60 border-violet-200/60'
              : 'text-apple-text-tertiary hover:bg-apple-bg-secondary border-apple-border-light/60'
          }`}
          title={imagePromptOptimize ? '提示词优化：开启' : '提示词优化：关闭'}
        >
          <Wand2 size={10} />
          优化
        </button>

        {/* 组图生成 */}
        <div className="relative">
          <button
            onClick={() => togglePopup('seqGen')}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] transition-colors border ${
              imageSequentialGeneration
                ? 'text-emerald-600 bg-emerald-50/60 border-emerald-200/60'
                : 'text-apple-text-tertiary hover:bg-apple-bg-secondary border-apple-border-light/60'
            }`}
            title={imageSequentialGeneration ? `组图：${imageMaxImages}张` : '组图：关闭'}
          >
            <LayoutGrid size={10} />
            组图{imageSequentialGeneration ? ` ${imageMaxImages}` : ''}
          </button>
          {activePopup === 'seqGen' && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setActivePopup(null)} />
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-2xl border border-apple-border-light shadow-xl p-3 z-[70]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-apple-text">启用组图</span>
                  <button
                    onClick={() => setImageSequentialGeneration(!imageSequentialGeneration)}
                    className={`w-8 h-[18px] rounded-full transition-colors ${imageSequentialGeneration ? 'bg-emerald-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${imageSequentialGeneration ? 'translate-x-[15px]' : 'translate-x-[3px]'}`} />
                  </button>
                </div>
                {imageSequentialGeneration && (
                  <>
                    <div className="text-[10px] text-apple-text-tertiary mb-1.5">生成张数</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={2}
                        max={15}
                        value={imageMaxImages}
                        onChange={(e) => setImageMaxImages(Number(e.target.value))}
                        className="flex-1 h-1 accent-emerald-500"
                      />
                      <span className="text-[11px] font-medium text-apple-text w-5 text-center">{imageMaxImages}</span>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* 输出格式（仅 5.0_lite） */}
        {imageSupportsOutputFormat && (
          <button
            onClick={() => setImageOutputFormat(imageOutputFormat === 'jpeg' ? 'png' : 'jpeg')}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-apple-text-tertiary hover:bg-apple-bg-secondary border border-apple-border-light/60 transition-colors"
            title={`输出格式：${imageOutputFormat.toUpperCase()}`}
          >
            {imageOutputFormat.toUpperCase()}
          </button>
        )}

      </>
    )
  }

  // 视频模式参数按钮
  const renderVideoParams = () => {
    const modelName = getModelDisplayName('video')
    const refLabel = VIDEO_REFERENCE_OPTIONS.find((o) => o.value === videoRefMode)?.label || '首尾帧'
    const ratioLabel = videoResolution ? `${videoRatio}  ${videoResolution}` : videoRatio
    return (
      <>
        {/* 模型选择 */}
        <div className="relative">
          <button
            onClick={() => togglePopup('videoModel')}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-apple-text-secondary hover:bg-apple-bg-secondary border border-apple-border-light/60 transition-colors"
          >
            <div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
              <span className="text-[7px] text-white font-bold">V</span>
            </div>
            {modelName}
          </button>
          {activePopup === 'videoModel' && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setActivePopup(null)} />
              <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-2xl border border-apple-border-light shadow-xl overflow-hidden z-[70]">
                <div className="px-3 py-1.5 text-[10px] text-apple-text-tertiary">选择模型</div>
                {videoModels.length > 0 ? videoModels.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedVideoModel(m.name); setActivePopup(null) }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                      selectedVideoModel === m.name
                        ? 'text-brand bg-brand-50'
                        : 'text-apple-text hover:bg-apple-bg-secondary'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-[8px] text-white font-bold">V</span>
                    </div>
                    <div className="text-left min-w-0">
                      <div className="text-xs font-medium truncate">{m.name.replace('MaaS_', '')}</div>
                    </div>
                    {selectedVideoModel === m.name && <Check size={12} className="ml-auto text-brand flex-shrink-0" />}
                  </button>
                )) : (
                  <div className="px-3 py-3 text-[11px] text-apple-text-tertiary text-center">无可用模型</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 生成方式（全能参考/首尾帧/智能多帧） */}
        <div className="relative">
          <button
            onClick={() => togglePopup('videoRef')}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-apple-text-secondary hover:bg-apple-bg-secondary border border-apple-border-light/60 transition-colors"
          >
            <Film size={10} />
            {refLabel}
            <ChevronDown size={8} />
          </button>
          {activePopup === 'videoRef' && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setActivePopup(null)} />
              <div className="absolute bottom-full left-0 mb-2 min-w-[120px] bg-white rounded-xl border border-apple-border-light shadow-lg overflow-hidden z-[70]">
                <div className="px-3 py-1.5 text-[10px] text-apple-text-tertiary">选择视频生成时长</div>
                {VIDEO_REFERENCE_OPTIONS.map((opt) => {
                  const available = isVideoRefModeAvailable(opt.value as 'all' | 'first' | 'both')
                  const active = opt.value === videoRefMode
                  return (
                    <button
                      key={opt.value}
                      onClick={() => { if (available) { setVideoRefMode(opt.value); setActivePopup(null) } }}
                      disabled={!available}
                      className={`w-full px-3 py-2 text-[11px] text-left flex items-center justify-between transition-colors ${
                        !available
                          ? 'text-apple-text-tertiary/40 cursor-not-allowed'
                          : active
                            ? 'text-brand bg-brand-50'
                            : 'text-apple-text hover:bg-apple-bg-secondary'
                      }`}
                    >
                      {opt.label}
                      {active && <Check size={10} />}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* 比例 + 分辨率（合并弹窗） */}
        <div className="relative">
          <button
            onClick={() => togglePopup('videoRatioRes')}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-apple-text-secondary hover:bg-apple-bg-secondary border border-apple-border-light/60 transition-colors"
          >
            <MonitorPlay size={10} />
            {ratioLabel}
          </button>
          {activePopup === 'videoRatioRes' && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setActivePopup(null)} />
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-2xl border border-apple-border-light shadow-xl p-3 z-[70]">
                <div className="text-[10px] text-apple-text-tertiary mb-2">选择比例</div>
                <div className="grid grid-cols-6 gap-1.5 mb-3">
                  {VIDEO_RATIO_OPTIONS.map((opt) => {
                    const active = opt.value === videoRatio
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setVideoRatio(opt.value)}
                        className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[10px] transition-colors ${
                          active
                            ? 'bg-brand-50 text-brand border border-brand/30'
                            : 'hover:bg-apple-bg-secondary text-apple-text-secondary border border-transparent'
                        }`}
                      >
                        <MonitorPlay size={14} className={active ? 'text-brand' : 'text-apple-text-tertiary'} />
                        <span>{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
                {videoCapabilities.resolutions.length > 0 && (
                  <>
                    <div className="text-[10px] text-apple-text-tertiary mb-2">选择分辨率</div>
                    <div className="flex gap-2">
                      {VIDEO_RESOLUTION_OPTIONS.map((opt) => {
                        const active = opt.value === videoResolution
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setVideoResolution(opt.value)}
                            className={`flex-1 py-1.5 rounded-xl text-[11px] font-medium transition-colors ${
                              active
                                ? 'bg-brand-50 text-brand border border-brand/30'
                                : 'hover:bg-apple-bg-secondary text-apple-text-secondary border border-apple-border-light/60'
                            }`}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* 时长 */}
        <div className="relative">
          <button
            onClick={() => togglePopup('videoLen')}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-apple-text-secondary hover:bg-apple-bg-secondary border border-apple-border-light/60 transition-colors"
          >
            {videoLength}s
          </button>
          {activePopup === 'videoLen' && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setActivePopup(null)} />
              <div className="absolute bottom-full left-0 mb-2 min-w-[100px] bg-white rounded-xl border border-apple-border-light shadow-lg overflow-hidden z-[70]">
                <div className="px-3 py-1.5 text-[10px] text-apple-text-tertiary">选择视频生成时长</div>
                {VIDEO_LENGTH_OPTIONS.map((opt) => {
                  const supported = videoCapabilities.durations.includes(opt.value)
                  const active = opt.value === videoLength
                  return (
                    <button
                      key={opt.value}
                      onClick={() => { if (supported) { setVideoLength(opt.value); setActivePopup(null) } else { setVideoLength(opt.value); setActivePopup(null) } }}
                      className={`w-full px-3 py-2 text-[11px] text-left flex items-center justify-between transition-colors ${
                        active
                          ? 'text-brand bg-brand-50'
                          : 'text-apple-text hover:bg-apple-bg-secondary'
                      }`}
                    >
                      {opt.label}
                      {active && <Check size={10} />}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

      </>
    )
  }

  // 渲染占位文本
  const renderPlaceholder = () => {
    switch (activeMode) {
      case 'image':
        return '请描述你想生成的图片'
      case 'video':
        return '描述你想创作的视频内容...'
    }
  }

  // 渲染消息中的结果预览
  const renderResultPreview = (item: typeof chatMessages[0]) => {
    if (item.status !== 'completed') return null
    const urls = item.resultUrls || (item.resultUrl ? [item.resultUrl] : [])
    return (
      <div className="mt-2 p-2.5 bg-apple-bg-secondary rounded-xl border border-apple-border-light">
        {urls.length > 0 && item.mode === 'image' && (
          urls.length === 1 ? (
            <img
              src={urls[0]}
              alt=""
              className="w-full max-w-[200px] rounded-xl mb-2 cursor-pointer"
              draggable
              onClick={() => setPreviewImage(urls[0])}
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({
                  type: 'generated-content',
                  url: urls[0],
                  name: item.content?.slice(0, 20) || '生成图片',
                }))
              }}
            />
          ) : (
            <div className={`grid gap-1.5 mb-2 ${urls.length <= 2 ? 'grid-cols-2' : urls.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {urls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="w-full rounded-lg cursor-pointer aspect-square object-cover"
                  draggable
                  onClick={() => setPreviewImage(url)}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify({
                      type: 'generated-content',
                      url,
                      name: `${item.content?.slice(0, 15) || '组图'}_${i + 1}`,
                    }))
                  }}
                />
              ))}
            </div>
          )
        )}
        {item.resultUrl && item.mode === 'video' && (
          <div
            className="w-full max-w-[240px] mb-2"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({
                type: 'generated-content',
                url: item.resultUrl,
                name: item.content?.slice(0, 20) || '生成视频',
              }))
            }}
          >
            <video src={item.resultUrl} controls className="w-full rounded-xl" />
          </div>
        )}
        <p className="text-xs text-apple-text-secondary">{item.resultText || '已生成'}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <button className="px-2 py-1 text-[11px] bg-white text-apple-text-secondary rounded-lg border border-apple-border-light hover:bg-apple-bg-secondary transition-colors">
            重新编辑
          </button>
          <button className="px-2 py-1 text-[11px] bg-white text-apple-text-secondary rounded-lg border border-apple-border-light hover:bg-apple-bg-secondary transition-colors">
            再次生成
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="flex flex-col h-full w-full bg-white">
      {/* 头部 */}
      <div className="flex items-center px-4 py-3 flex-shrink-0 border-b border-apple-border-light min-h-[44px]">
        {isDedicatedFileTab && boundFile && fileId && titleEditing ? (
          <input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={() => {
              const n = titleDraft.trim()
              if (n) {
                renameProjectFile(fileId, n)
                useWorkspaceStore.getState().refreshTabLabels()
              }
              setTitleEditing(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') setTitleEditing(false)
            }}
            className="text-sm font-semibold text-apple-text w-full max-w-md px-2 py-1 rounded border border-brand/30 focus:outline-none focus:ring-2 focus:ring-brand/20"
            autoFocus
          />
        ) : (
          <span
            className={`text-sm font-semibold text-apple-text truncate ${
              isDedicatedFileTab && boundFile && fileId ? 'cursor-text select-none' : ''
            }`}
            title={isDedicatedFileTab && fileId ? '双击重命名' : undefined}
            onDoubleClick={() => {
              if (isDedicatedFileTab && boundFile && fileId) {
                setTitleDraft(boundFile.name)
                setTitleEditing(true)
              }
            }}
          >
            {isDedicatedFileTab && boundFile
              ? `${boundFile.projectType === 'image' ? '图片' : '视频'} · ${boundFile.name}`
              : '创作助手'}
          </span>
        )}
      </div>

      {isDedicatedFileTab && fileId && (
        <div className="flex flex-col min-h-0 overflow-hidden max-h-[40%] px-3 py-2.5 border-b border-apple-border-light bg-apple-bg-secondary/40">
          <p className="flex-shrink-0 text-[10px] font-medium text-apple-text-secondary mb-2">
            当前选用版本 · 文件树引用与此缩略图均指向该版本
          </p>
          {selectedMediaVersion ? (
            <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-apple-border-light bg-white flex items-center justify-center">
              {boundFile?.projectType === 'image' ? (
                <img src={selectedMediaVersion.url} alt="" className="max-w-full max-h-full object-contain" />
              ) : (
                <video src={selectedMediaVersion.url} controls className="max-w-full max-h-full" />
              )}
            </div>
          ) : (
            <p className="text-xs text-apple-text-tertiary py-4 text-center">尚未生成，在下方输入描述开始</p>
          )}
          {boundFile?.mediaState && boundFile.mediaState.versions.length > 0 && (
            <div className="flex-shrink-0 mt-2">
              <p className="text-[10px] text-apple-text-tertiary mb-1.5">历史版本（点击切换当前选用）</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {boundFile.mediaState.versions.map((v) => {
                  const sel = boundFile.mediaState.selectedVersionId === v.id
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setProjectFileSelectedMediaVersion(fileId, v.id)}
                      className={`flex-shrink-0 rounded-lg border-2 overflow-hidden transition-colors ${
                        sel ? 'border-brand ring-1 ring-brand/30' : 'border-apple-border-light hover:border-apple-text-tertiary/40'
                      }`}
                      title={v.prompt.slice(0, 80)}
                    >
                      {boundFile.projectType === 'image' ? (
                        <img src={v.url} alt="" className="w-16 h-16 object-cover" />
                      ) : (
                        <div className="w-16 h-16 bg-black flex items-center justify-center">
                          <Video size={20} className="text-white/80" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 历史记录区域 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 min-h-0">
        {displayChatMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-apple-text-tertiary">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-apple-bg-secondary flex items-center justify-center">
                <ModeIcon size={24} className="text-apple-text-tertiary" />
              </div>
              <p className="text-xs">
                {useDedicatedMediaSession
                  ? '此标签页对应文件树中的一个图片/视频文件，反复生成将保留版本历史'
                  : '选择生成模式，开始创作'}
              </p>
              <p className="text-[10px] text-apple-text-tertiary mt-1">
                {useDedicatedMediaSession
                  ? '只有「当前选用」的那一版会被引用；可随时在历史中切换'
                  : '生成的内容将自动展示在画布上'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {displayChatMessages.map((item) => {
              const Icon = modeConfig[item.mode as GenerateMode]?.icon || Image
              return (
                <div
                  key={item.id}
                  className="bg-apple-bg-secondary rounded-2xl border border-apple-border-light p-3"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon size={12} className="text-brand" />
                    <span className="text-[11px] text-brand">
                      {modeConfig[item.mode as GenerateMode]?.label || item.mode}
                    </span>
                    <span className="text-[9px] text-apple-text-tertiary">
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  {item.referenceImageUrls && item.referenceImageUrls.length > 0 && (
                    <div className="flex gap-2 mb-2 flex-wrap">
                      {item.referenceImageUrls.map((url, ri) => (
                        <div key={`${item.id}-refimg-${ri}`} className="flex flex-col items-center gap-0.5">
                          <span className="text-[9px] text-apple-text-tertiary">
                            {item.referenceThumbLabels?.[ri] ?? `参考${ri + 1}`}
                          </span>
                          <div
                            className="w-14 h-14 rounded-lg overflow-hidden border border-apple-border-light bg-white cursor-pointer"
                            draggable
                            onClick={() => setPreviewImage(url)}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('application/json', JSON.stringify({
                                type: 'generated-content',
                                url,
                                name: item.referenceThumbLabels?.[ri] ?? `参考${ri + 1}`,
                              }))
                            }}
                          >
                            <img src={url} alt="" className="w-full h-full object-cover pointer-events-none" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.references && item.references.length > 0 && (
                    <div className="flex gap-1.5 mb-2 flex-wrap">
                      {item.references.map((ref) => (
                        <div key={ref.nodeId} className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-apple-border-light text-[10px] text-apple-text-secondary">
                          {ref.previewUrl ? (
                            <img src={ref.previewUrl} alt="" className="w-6 h-6 rounded object-cover" />
                          ) : null}
                          <span>{ref.label || ref.nodeType}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-apple-text mb-2">{item.content}</p>

                  {item.status === 'generating' && (
                    <div className="flex items-center gap-2 text-[11px] text-apple-text-tertiary">
                      <Loader2 size={12} className="animate-spin text-brand" />
                      <span>
                        {item.mode === 'video' ? '视频生成中，预计需要1-5分钟...' : '生成中...'}
                      </span>
                    </div>
                  )}
                  {renderResultPreview(item)}
                  {item.status === 'failed' && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-xs text-red-500">{item.errorMessage || '生成失败'}</p>
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={historyEndRef} />
          </div>
        )}
      </div>

      {/* 底部输入区域 */}
      <div className="flex-shrink-0 px-3 pb-3 pt-2">
      {/* 输入卡片 */}
        <div
          className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-visible ${
            isDragOver ? 'border-brand ring-2 ring-brand/20' : 'border-apple-border-light'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="px-3 pt-2.5 pb-1.5">
            {/* 首尾帧参考图卡片（视频 both 模式） */}
            {activeMode === 'video' && videoRefMode === 'both' && (
              <div className="flex items-center gap-2 mb-2">
                {/* 首帧 */}
                <label className="relative group/frame cursor-pointer">
                  {attachments[0]?.previewUrl ? (
                    <div className="w-16 h-20 rounded-xl overflow-hidden border border-apple-border-light">
                      <img src={attachments[0].previewUrl} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => { e.preventDefault(); removeAttachment(0) }}
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover/frame:opacity-100 transition-opacity"
                      >
                        <X size={8} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-20 rounded-xl border-2 border-dashed border-apple-border flex flex-col items-center justify-center hover:border-brand/40 hover:bg-brand-50/20 transition-colors">
                      <Plus size={16} className="text-apple-text-tertiary" />
                      <span className="text-[8px] text-apple-text-tertiary mt-0.5">首帧</span>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const att: Attachment = { type: 'file', file, previewUrl: URL.createObjectURL(file), name: file.name }
                    setAttachments((prev) => { const next = [...prev]; next[0] = att; return next })
                    e.target.value = ''
                  }} />
                </label>
                <span className="text-apple-text-tertiary text-xs">⇄</span>
                {/* 尾帧 */}
                <label className="relative group/frame cursor-pointer">
                  {attachments[1]?.previewUrl ? (
                    <div className="w-16 h-20 rounded-xl overflow-hidden border border-apple-border-light">
                      <img src={attachments[1].previewUrl} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => { e.preventDefault(); removeAttachment(1) }}
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover/frame:opacity-100 transition-opacity"
                      >
                        <X size={8} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-20 rounded-xl border-2 border-dashed border-apple-border flex flex-col items-center justify-center hover:border-brand/40 hover:bg-brand-50/20 transition-colors">
                      <Plus size={16} className="text-apple-text-tertiary" />
                      <span className="text-[8px] text-apple-text-tertiary mt-0.5">尾帧</span>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const att: Attachment = { type: 'file', file, previewUrl: URL.createObjectURL(file), name: file.name }
                    setAttachments((prev) => { const next = [...prev]; if (next.length < 1) next.push({ type: 'file', name: '' }); next[1] = att; return next })
                    e.target.value = ''
                  }} />
                </label>
              </div>
            )}
            {/* 通用附件（非 video-both 模式） */}
            {!(activeMode === 'video' && videoRefMode === 'both') && attachments.length > 0 && (
              <div className="flex items-start gap-1.5 mb-2 flex-wrap">
                {attachments.map((att, index) => (
                  <div key={index} className="relative group/att">
                    {att.previewUrl ? (
                      <div
                        className="w-12 h-12 rounded-xl overflow-hidden border border-apple-border-light cursor-pointer"
                        onClick={() => att.previewUrl && setPreviewImage(att.previewUrl)}
                      >
                        <img src={att.previewUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl border border-apple-border-light bg-apple-bg-secondary flex flex-col items-center justify-center">
                        <span className="text-[8px] text-apple-text-tertiary text-center px-0.5 truncate w-full">{att.name}</span>
                      </div>
                    )}
                    {att.type === 'reference' && (
                      <div className="absolute -bottom-1 left-0 right-0 flex justify-center">
                        <span className="px-1 py-0.5 bg-brand text-white text-[7px] rounded-full">参考内容</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeAttachment(index)}
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover/att:opacity-100 transition-opacity"
                    >
                      <X size={8} className="text-white" />
                    </button>
                  </div>
                ))}
                <label className="w-12 h-12 rounded-xl border-2 border-dashed border-apple-border flex flex-col items-center justify-center cursor-pointer hover:border-brand/40 hover:bg-brand-50/20 transition-colors">
                  <Plus size={14} className="text-apple-text-tertiary" />
                  <span className="text-[7px] text-apple-text-tertiary mt-0.5">参考内容</span>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
            )}

            <div className="flex items-start gap-1.5">
              {!(activeMode === 'video' && videoRefMode === 'both') && attachments.length === 0 && (
                <label className="flex-shrink-0 w-10 h-10 rounded-xl bg-apple-bg-secondary border border-apple-border-light/50 flex flex-col items-center justify-center cursor-pointer hover:bg-apple-bg-tertiary transition-colors mt-0.5">
                  <Plus size={16} className="text-apple-text-tertiary" />
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </label>
              )}

              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={renderPlaceholder()}
                  rows={1}
                  className="w-full bg-transparent text-sm text-apple-text placeholder-apple-text-tertiary/60 resize-none outline-none leading-relaxed py-2 min-h-[36px] max-h-[100px]"
                  disabled={isSending}
                  style={{ overflow: 'auto' }}
                />
              </div>
            </div>
          </div>

          {renderToolbar()}
        </div>
      </div>
    </div>

    {/* 图片全屏预览 */}
    {previewImage && (
      <div
        className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center cursor-pointer"
        onClick={() => setPreviewImage(null)}
      >
        <img
          src={previewImage}
          alt="预览"
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          onClick={() => setPreviewImage(null)}
        >
          <X size={16} className="text-white" />
        </button>
      </div>
    )}
  </>
  )
}
