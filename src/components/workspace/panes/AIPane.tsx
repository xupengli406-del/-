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
  ChevronDown,
  ChevronUp,
  Check,
  Sparkles,
  MonitorPlay,
  FileText,
  User,
  MapPin,
  Film,
} from 'lucide-react'
import { useCanvasStore } from '../../../store/canvasStore'
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
  IMAGE_RESOLUTION_OPTIONS,
  IMAGE_BATCH_OPTIONS,
  VIDEO_LENGTH_OPTIONS,
  VIDEO_RATIO_OPTIONS,
  VIDEO_REFERENCE_OPTIONS,
  type GenerateMode,
} from '../../generate/constants'
import type { StoryboardVersion, ScriptNodeData, ChatMessage } from '../../../store/types'

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
  // 从 canvasFile 的 projectType 确定初始模式
  const canvasFiles = useCanvasStore((s) => s.canvasFiles)
  const modeFromFile = (() => {
    if (!fileId) return null
    const f = canvasFiles.find((cf) => cf.id === fileId)
    if (f?.projectType === 'image') return 'image' as GenerateMode
    if (f?.projectType === 'video') return 'video' as GenerateMode
    if (f?.projectType === 'audio') return 'audio' as GenerateMode
    return null
  })()
  const initialAIMode = useCanvasStore((s) => s.initialAIMode)
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
    availableModels,
    chatMessages,
    addChatMessage,
    updateChatMessage,
    chatReferences,
    removeChatReference,
    clearChatReferences,
    addMediaNode,
    characters,
    scenes,
    activeFrameId,
    activeCharacterId,
    activeSceneId,
    getFrameContext,
    addFrameVersion,
    updateNodeData,
    updateCharacter,
    updateScene,
    nodes: storeNodes,
    appendCanvasFileMediaVersion,
    setCanvasFileSelectedMediaVersion,
  } = useCanvasStore()

  // 从 WelcomeTab 传入的初始模式：消费后清除
  useEffect(() => {
    if (initialAIMode) {
      setActiveMode(initialAIMode)
      useCanvasStore.getState().setInitialAIMode(null)
    }
  }, [initialAIMode])

  const boundFile = useMemo(() => {
    if (!fileId) return undefined
    return canvasFiles.find((cf) => cf.id === fileId)
  }, [fileId, canvasFiles])

  useEffect(() => {
    if (boundFile?.projectType === 'image') setActiveMode('image')
    else if (boundFile?.projectType === 'video') setActiveMode('video')
  }, [boundFile?.id, boundFile?.projectType])

  useEffect(() => {
    setTitleEditing(false)
  }, [fileId])

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

  // 附件
  const [attachments, setAttachments] = useState<Attachment[]>([])

  // 拖拽状态
  const [isDragOver, setIsDragOver] = useState(false)

  // 弹出面板状态
  const [activePopup, setActivePopup] = useState<string | null>(null)

  // @mention 状态
  const [mentions, setMentions] = useState<Array<{ type: 'character' | 'scene'; id: string; name: string }>>([])
  const [showMentionPopup, setShowMentionPopup] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [titleEditing, setTitleEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  const renameCanvasFile = useCanvasStore((s) => s.renameCanvasFile)

  // 分镜格上下文
  const frameContext = useMemo(() => {
    if (!activeFrameId) return null
    return getFrameContext(activeFrameId)
  }, [activeFrameId, getFrameContext, characters, scenes])

  // 角色/场景上下文（隐式选中）
  const activeCharacter = useMemo(() => {
    if (!activeCharacterId) return null
    return characters.find((c) => c.id === activeCharacterId) || null
  }, [activeCharacterId, characters])

  const activeScene = useMemo(() => {
    if (!activeSceneId) return null
    return scenes.find((s) => s.id === activeSceneId) || null
  }, [activeSceneId, scenes])

  // 当前生成目标类型
  const activeTarget = activeFrameId ? 'frame' : activeCharacterId ? 'character' : activeSceneId ? 'scene' : null

  const isFrameModeUI = !!(activeFrameId && frameContext?.frame && activeMode === 'image')
  const isCharModeUI = !!(activeCharacterId && activeCharacter && activeMode === 'image')
  const isSceneModeUI = !!(activeSceneId && activeScene && activeMode === 'image')
  const useDedicatedMediaSession = useMemo(
    () =>
      !!fileId &&
      !!boundFile &&
      ((boundFile.projectType === 'image' && activeMode === 'image' && !isFrameModeUI && !isCharModeUI && !isSceneModeUI) ||
        (boundFile.projectType === 'video' && activeMode === 'video')),
    [fileId, boundFile, activeMode, isFrameModeUI, isCharModeUI, isSceneModeUI]
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

  // @mention 过滤结果
  const mentionResults = useMemo(() => {
    const q = mentionQuery.toLowerCase()
    const charResults = characters
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .map((c) => ({ type: 'character' as const, id: c.id, name: c.name }))
    const sceneResults = scenes
      .filter((s) => !q || s.name.toLowerCase().includes(q))
      .map((s) => ({ type: 'scene' as const, id: s.id, name: s.name }))
    return [...charResults, ...sceneResults]
  }, [mentionQuery, characters, scenes])

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
  const getActiveModel = (): string => {
    if (activeMode === 'image') return selectedImageModel || imageModels[0]?.name || ''
    if (activeMode === 'video') return selectedVideoModel || videoModels[0]?.name || ''
    if (activeMode === 'script') return selectedScriptModel || scriptModels[0]?.name || ''
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

    const messageId = `msg_${Date.now()}`

    // 组装上下文 prompt
    let assembledPrompt = prompt.trim()

    // @mention 注入：将角色/场景描述拼入 prompt
    if (mentions.length > 0) {
      const mentionParts: string[] = []
      for (const m of mentions) {
        if (m.type === 'character') {
          const char = characters.find((c) => c.id === m.id)
          if (char) mentionParts.push(`[角色 ${char.name}]: ${char.description}`)
        } else {
          const sc = scenes.find((s) => s.id === m.id)
          if (sc) mentionParts.push(`[场景 ${sc.name}]: ${sc.description}`)
        }
      }
      if (mentionParts.length > 0) {
        assembledPrompt = mentionParts.join('\n') + '\n\n' + assembledPrompt
      }
    }

    // 分镜格上下文自动组装
    const isFrameMode = !!(activeFrameId && frameContext?.frame && activeMode === 'image')
    if (isFrameMode && frameContext?.frame) {
      const ctxParts: string[] = []
      if (frameContext.frame.dialogue) ctxParts.push(`台词: ${frameContext.frame.dialogue}`)
      if (frameContext.frame.shot) ctxParts.push(`镜头: ${frameContext.frame.shot}`)
      if (frameContext.frame.description) ctxParts.push(`描述: ${frameContext.frame.description}`)
      for (const c of frameContext.characters) {
        ctxParts.push(`角色 ${c.name}: ${c.description}`)
      }
      if (frameContext.scene) {
        ctxParts.push(`场景 ${frameContext.scene.name}: ${frameContext.scene.description}`)
      }
      if (ctxParts.length > 0) {
        assembledPrompt = ctxParts.join('\n') + '\n\n' + assembledPrompt
      }
    }

    // 角色上下文自动组装
    const isCharMode = !!(activeCharacterId && activeCharacter && activeMode === 'image')
    if (isCharMode && activeCharacter) {
      const ctxParts: string[] = [`为角色「${activeCharacter.name}」生成参考图`]
      if (activeCharacter.description) ctxParts.push(`角色描述: ${activeCharacter.description}`)
      if (activeCharacter.tags.length > 0) ctxParts.push(`特征标签: ${activeCharacter.tags.join(', ')}`)
      assembledPrompt = ctxParts.join('\n') + '\n\n' + assembledPrompt
    }

    // 场景上下文自动组装
    const isSceneMode = !!(activeSceneId && activeScene && activeMode === 'image')
    if (isSceneMode && activeScene) {
      const ctxParts: string[] = [`为场景「${activeScene.name}」生成参考图`]
      if (activeScene.description) ctxParts.push(`场景描述: ${activeScene.description}`)
      assembledPrompt = ctxParts.join('\n') + '\n\n' + assembledPrompt
    }

    const boundNow = fileId ? useCanvasStore.getState().canvasFiles.find((f) => f.id === fileId) : undefined
    const useDedicatedMediaSessionSend =
      !!fileId &&
      !!boundNow &&
      ((boundNow.projectType === 'image' && activeMode === 'image' && !isFrameMode && !isCharMode && !isSceneMode) ||
        (boundNow.projectType === 'video' && activeMode === 'video'))

    const addMsg = (m: ChatMessage) => {
      const st = useCanvasStore.getState()
      if (useDedicatedMediaSessionSend && fileId) st.addCanvasFileChatMessage(fileId, m)
      else st.addChatMessage(m)
    }
    const updMsg = (id: string, updates: Partial<ChatMessage>) => {
      const st = useCanvasStore.getState()
      if (useDedicatedMediaSessionSend && fileId) st.updateCanvasFileChatMessage(fileId, id, updates)
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
      mode: activeMode as 'script' | 'image' | 'video' | 'audio',
      content: prompt.trim(),
      references: chatReferences.length > 0 ? [...chatReferences] : undefined,
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
    setMentions([])

    if (chatReferences.length > 0) {
      clearChatReferences()
    }

    setIsSending(true)
    updMsg(messageId, { status: 'generating' })

    // 分镜格模式：标记节点生成中
    if (isFrameMode && activeFrameId) {
      updateNodeData(activeFrameId, { status: 'generating' })
    }

    try {
      if (activeMode === 'script') {
        const model = getActiveModel()
        if (!model) throw new Error('没有可用的剧本生成模型，请检查后端服务')
        const result = await runNode(ak, { type: 'text', prompt: currentPrompt, model })
        const generatedText = result.outputs.text || ''
        const nodeId = addMediaNode('text', {
          label: currentPrompt.slice(0, 20) || '剧本文本',
          textContent: generatedText,
          prompt: currentPrompt,
        })
        updMsg(messageId, { status: 'completed', resultText: generatedText, resultNodeIds: [nodeId] })
      } else if (activeMode === 'audio') {
        await new Promise((r) => setTimeout(r, 1500))
        const nodeId = addMediaNode('audio', {
          label: currentPrompt.slice(0, 20) || '生成音频',
          prompt: currentPrompt,
        })
        updMsg(messageId, { status: 'completed', resultText: '音频生成（后端暂无对应模型）', resultNodeIds: [nodeId] })
      } else if (activeMode === 'image') {
        const model = getActiveModel()
        if (!model) throw new Error('没有可用的图片生成模型，请检查后端服务')
        const result = await runNode(ak, {
          type: 'image',
          prompt: currentPrompt,
          model,
          size: imageResolution,
          response_format: 'url',
          ...(refUrls.length > 0 ? { reference_image_urls: refUrls } : {}),
        })
        const contentUrl = result.outputs.content_url || ''

        if (isFrameMode && activeFrameId) {
          const versionId = `ver_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
          const version: StoryboardVersion = {
            id: versionId,
            imageUrl: contentUrl,
            prompt: currentPrompt,
            createdAt: Date.now(),
          }
          addFrameVersion(activeFrameId, version)
          updMsg(messageId, { status: 'completed', resultUrl: contentUrl, resultText: `已添加为第${frameContext?.frame?.index || '?'}格新版本` })
        } else if (isCharMode && activeCharacterId) {
          updateCharacter(activeCharacterId, { referenceImageUrl: contentUrl })
          updMsg(messageId, { status: 'completed', resultUrl: contentUrl, resultText: `已设为「${activeCharacter?.name}」的参考图` })
        } else if (isSceneMode && activeSceneId) {
          updateScene(activeSceneId, { referenceImageUrl: contentUrl })
          updMsg(messageId, { status: 'completed', resultUrl: contentUrl, resultText: `已设为「${activeScene?.name}」的参考图` })
        } else if (useDedicatedMediaSessionSend && fileId) {
          appendCanvasFileMediaVersion(fileId, { url: contentUrl, prompt: currentPrompt, model })
          updMsg(messageId, {
            status: 'completed',
            resultUrl: contentUrl,
            resultText: '已保存为本文件的当前版本（引用与缩略图均指向此版本）',
          })
        } else {
          const nodeId = addMediaNode('image', {
            label: currentPrompt.slice(0, 20) || '生成图片',
            url: contentUrl,
            prompt: currentPrompt,
          })
          updMsg(messageId, { status: 'completed', resultUrl: contentUrl, resultText: '图片已生成', resultNodeIds: [nodeId] })
        }
      } else if (activeMode === 'video') {
        const model = getActiveModel()
        if (!model) throw new Error('没有可用的视频生成模型，请检查后端服务')
        const result = await runNode(ak, {
          type: 'video',
          prompt: currentPrompt,
          model,
          length: videoLength,
          ...(refUrls.length > 0
            ? {
                reference_image_urls: refUrls,
                video_reference_mode: videoRefMode as 'all' | 'first' | 'both',
              }
            : {}),
        })
        const contentUrl = result.outputs.content_url || ''
        if (useDedicatedMediaSessionSend && fileId) {
          appendCanvasFileMediaVersion(fileId, { url: contentUrl, prompt: currentPrompt, model })
          updMsg(messageId, {
            status: 'completed',
            resultUrl: contentUrl,
            resultText: '已保存为本文件的当前视频版本',
          })
        } else {
          const nodeId = addMediaNode('video', {
            label: currentPrompt.slice(0, 20) || '生成视频',
            url: contentUrl,
            prompt: currentPrompt,
          })
          updMsg(messageId, { status: 'completed', resultUrl: contentUrl, resultText: '视频已生成', resultNodeIds: [nodeId] })
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '生成失败'
      updMsg(messageId, { status: 'failed', errorMessage: errorMsg })
      if (isFrameMode && activeFrameId) {
        updateNodeData(activeFrameId, { status: 'idle' })
      }
    } finally {
      setIsSending(false)
    }

    setTimeout(() => historyEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: Attachment[] = Array.from(e.target.files).map((file) => ({
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
      {activeMode === 'audio' && renderAudioParams()}
      {activeMode === 'script' && renderScriptParams()}

      {/* 右侧: 生成数量 + 发送按钮 */}
      <div className="flex-1" />
      {activeMode === 'image' && !useDedicatedMediaSession && (
        <div className="relative">
          <button
            onClick={() => togglePopup('batch')}
            className="flex items-center gap-0.5 px-1.5 py-1 text-[11px] text-apple-text-secondary hover:bg-apple-bg-secondary rounded-lg transition-colors"
          >
            <Sparkles size={10} />
            {imageBatch}/张
          </button>
          {activePopup === 'batch' && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setActivePopup(null)} />
              <div className="absolute bottom-full right-0 mb-2 min-w-[80px] bg-white rounded-xl border border-apple-border-light shadow-lg overflow-hidden z-[70]">
                {IMAGE_BATCH_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setImageBatch(opt.value); setActivePopup(null) }}
                    className={`w-full px-3 py-1.5 text-[11px] text-left flex items-center justify-between transition-colors ${
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
    const modelName = getModelDisplayName()
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
                      (selectedImageModel || imageModels[0]?.name) === m.name
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
                    {(selectedImageModel || imageModels[0]?.name) === m.name && <Check size={12} className="ml-auto text-brand flex-shrink-0" />}
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
                  {IMAGE_RESOLUTION_OPTIONS.map((opt) => (
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
                <button
                  onClick={() => setActivePopup(null)}
                  className="w-full py-1.5 text-[11px] font-medium text-brand hover:bg-brand-50 rounded-xl transition-colors"
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
                      (selectedVideoModel || videoModels[0]?.name) === m.name
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
                    {(selectedVideoModel || videoModels[0]?.name) === m.name && <Check size={12} className="ml-auto text-brand flex-shrink-0" />}
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
            onClick={() => togglePopup('videoRef')}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-apple-text-secondary hover:bg-apple-bg-secondary border border-apple-border-light/60 transition-colors"
          >
            <Image size={10} />
            {VIDEO_REFERENCE_OPTIONS.find((o) => o.value === videoRefMode)?.label || '全能参考'}
            <ChevronDown size={8} />
          </button>
          {activePopup === 'videoRef' && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setActivePopup(null)} />
              <div className="absolute bottom-full left-0 mb-2 min-w-[100px] bg-white rounded-xl border border-apple-border-light shadow-lg overflow-hidden z-[70]">
                {VIDEO_REFERENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setVideoRefMode(opt.value); setActivePopup(null) }}
                    className={`w-full px-3 py-1.5 text-[11px] text-left flex items-center justify-between transition-colors ${
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

        <div className="relative">
          <button
            onClick={() => togglePopup('videoRatio')}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-apple-text-secondary hover:bg-apple-bg-secondary border border-apple-border-light/60 transition-colors"
          >
            <MonitorPlay size={10} />
            {videoRatio}
          </button>
          {activePopup === 'videoRatio' && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setActivePopup(null)} />
              <div className="absolute bottom-full left-0 mb-2 min-w-[80px] bg-white rounded-xl border border-apple-border-light shadow-lg overflow-hidden z-[70]">
                {VIDEO_RATIO_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setVideoRatio(opt.value); setActivePopup(null) }}
                    className={`w-full px-3 py-1.5 text-[11px] text-left flex items-center justify-between transition-colors ${
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
              <div className="absolute bottom-full left-0 mb-2 min-w-[60px] bg-white rounded-xl border border-apple-border-light shadow-lg overflow-hidden z-[70]">
                {VIDEO_LENGTH_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setVideoLength(opt.value); setActivePopup(null) }}
                    className={`w-full px-3 py-1.5 text-[11px] text-left flex items-center justify-between transition-colors ${
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
    <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-apple-text-secondary border border-apple-border-light/60">
      <Music size={10} className="text-brand" />
      {audioVoice}
    </span>
  )

  // 剧本模式参数
  const renderScriptParams = () => (
    <>
      <div className="relative">
        <button
          onClick={() => togglePopup('scriptModel')}
          className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-apple-text-secondary hover:bg-apple-bg-secondary border border-apple-border-light/60 transition-colors"
        >
          <div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
            <span className="text-[7px] text-white font-bold">G</span>
          </div>
          {getModelDisplayName()}
        </button>
        {activePopup === 'scriptModel' && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setActivePopup(null)} />
            <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-2xl border border-apple-border-light shadow-xl overflow-hidden z-[70]">
              <div className="px-3 py-1.5 text-[10px] text-apple-text-tertiary">选择模型</div>
              {scriptModels.length > 0 ? scriptModels.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setSelectedScriptModel(m.name); setActivePopup(null) }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                    (selectedScriptModel || scriptModels[0]?.name) === m.name
                      ? 'text-brand bg-brand-50'
                      : 'text-apple-text hover:bg-apple-bg-secondary'
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-[8px] text-white font-bold">G</span>
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-xs font-medium truncate">{m.name}</div>
                  </div>
                  {(selectedScriptModel || scriptModels[0]?.name) === m.name && <Check size={12} className="ml-auto text-brand flex-shrink-0" />}
                </button>
              )) : (
                <div className="px-3 py-3 text-[11px] text-apple-text-tertiary text-center">无可用模型</div>
              )}
            </div>
          </>
        )}
      </div>
      <button className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-apple-text-secondary hover:bg-apple-bg-secondary border border-apple-border-light/60 transition-colors">
        <BrainCircuit size={10} />
        深度思考
      </button>
      <button className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-apple-text-secondary hover:bg-apple-bg-secondary border border-apple-border-light/60 transition-colors">
        <Search size={10} />
        搜索
      </button>
    </>
  )

  // 渲染占位文本
  const renderPlaceholder = () => {
    if (activeCharacter && activeMode === 'image') return `描述「${activeCharacter.name}」的形象...`
    if (activeScene && activeMode === 'image') return `描述「${activeScene.name}」的场景画面...`
    switch (activeMode) {
      case 'image':
        return '请描述你想生成的图片'
      case 'video':
        return '描述你想创作的视频内容...'
      case 'audio':
        return '输入你想生成的说话内容...'
      case 'script':
        return '输入剧本大纲或创意...'
    }
  }

  // 渲染消息中的结果预览
  const renderResultPreview = (item: typeof chatMessages[0]) => {
    if (item.status !== 'completed') return null
    return (
      <div className="mt-2 p-2.5 bg-apple-bg-secondary rounded-xl border border-apple-border-light">
        {item.resultUrl && item.mode === 'image' && (
          <img src={item.resultUrl} alt="" className="w-full max-w-[200px] rounded-xl mb-2" />
        )}
        {item.resultUrl && item.mode === 'video' && (
          <video src={item.resultUrl} controls className="w-full max-w-[240px] rounded-xl mb-2" />
        )}
        {item.resultUrl && item.mode === 'audio' && (
          <audio src={item.resultUrl} controls className="w-full mb-2" />
        )}
        {item.mode === 'script' && item.resultText ? (
          <div className="text-xs text-apple-text leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto mb-2">
            {item.resultText}
          </div>
        ) : (
          <p className="text-xs text-apple-text-secondary">{item.resultText || '已生成到画布'}</p>
        )}
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
                renameCanvasFile(fileId, n)
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
        <div className="flex-shrink-0 px-3 py-2.5 border-b border-apple-border-light bg-apple-bg-secondary/40">
          <p className="text-[10px] font-medium text-apple-text-secondary mb-2">
            当前选用版本 · 文件树引用与此缩略图均指向该版本
          </p>
          {selectedMediaVersion ? (
            <div className="rounded-xl overflow-hidden border border-apple-border-light bg-white max-h-[min(40vh,280px)] flex items-center justify-center">
              {boundFile?.projectType === 'image' ? (
                <img src={selectedMediaVersion.url} alt="" className="max-w-full max-h-[min(40vh,280px)] object-contain" />
              ) : (
                <video src={selectedMediaVersion.url} controls className="max-w-full max-h-[min(40vh,280px)]" />
              )}
            </div>
          ) : (
            <p className="text-xs text-apple-text-tertiary py-4 text-center">尚未生成，在下方输入描述开始</p>
          )}
          {boundFile?.mediaState && boundFile.mediaState.versions.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] text-apple-text-tertiary mb-1.5">历史版本（点击切换当前选用）</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {boundFile.mediaState.versions.map((v) => {
                  const sel = boundFile.mediaState.selectedVersionId === v.id
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setCanvasFileSelectedMediaVersion(fileId, v.id)}
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
              const Icon = modeConfig[item.mode as GenerateMode]?.icon || FileText
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
                          <div className="w-14 h-14 rounded-lg overflow-hidden border border-apple-border-light bg-white">
                            <img src={url} alt="" className="w-full h-full object-cover" />
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
        {/* 引用展示区域 */}
        {chatReferences.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2 flex-wrap px-1">
            {chatReferences.map((ref) => (
              <div
                key={ref.nodeId}
                className="flex items-center gap-1 px-2 py-1 bg-brand-50 rounded-lg border border-brand/20 text-[10px] text-brand group"
              >
                {ref.previewUrl ? (
                  <img src={ref.previewUrl} alt="" className="w-5 h-5 rounded object-cover" />
                ) : null}
                <span>{ref.label || ref.nodeType}</span>
                <button
                  onClick={() => removeChatReference(ref.nodeId)}
                  className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* @mention chips */}
        {mentions.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2 flex-wrap px-1">
            {mentions.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-1 px-2 py-1 bg-brand-50 rounded-lg border border-brand/20 text-[10px] text-brand group"
              >
                {m.type === 'character' ? <User size={10} /> : <MapPin size={10} />}
                <span>{m.name}</span>
                <button
                  onClick={() => setMentions((prev) => prev.filter((x) => x.id !== m.id))}
                  className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 分镜格上下文自动组装区 */}
        {frameContext?.frame && (
          <div className="mb-2 px-3 py-2.5 bg-apple-bg-secondary rounded-xl border border-apple-border-light space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-apple-text">
              <Film size={12} className="text-brand" />
              <span>第{frameContext.frame.index}格</span>
              {frameContext.frame.shot && (
                <span className="px-1.5 py-0.5 bg-white rounded text-[10px] text-apple-text-secondary border border-apple-border-light/50">{frameContext.frame.shot}</span>
              )}
            </div>
            {frameContext.frame.dialogue && (
              <p className="text-[11px] text-apple-text-secondary leading-relaxed">「{frameContext.frame.dialogue}」</p>
            )}
            {frameContext.characters.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] text-apple-text-tertiary">角色:</span>
                {frameContext.characters.map((c) => (
                  <span key={c.id} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white rounded text-[10px] text-brand border border-brand/15">
                    <User size={9} />
                    {c.name}
                  </span>
                ))}
              </div>
            )}
            {frameContext.scene && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-apple-text-tertiary">场景:</span>
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white rounded text-[10px] text-emerald-600 border border-emerald-200">
                  <MapPin size={9} />
                  {frameContext.scene.name}
                </span>
              </div>
            )}
            <p className="text-[10px] text-apple-text-tertiary italic">点击生成将自动组装上下文</p>
          </div>
        )}

        {/* 角色上下文自动组装区 */}
        {activeCharacter && !frameContext?.frame && (
          <div className="mb-2 px-3 py-2.5 bg-blue-50/50 rounded-xl border border-blue-200/40 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-medium text-apple-text">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
                {activeCharacter.referenceImageUrl ? (
                  <img src={activeCharacter.referenceImageUrl} alt={activeCharacter.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={14} className="text-blue-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-brand font-medium">{activeCharacter.name}</span>
                  <span className="text-[10px] text-apple-text-tertiary">角色</span>
                </div>
                {activeCharacter.description && (
                  <p className="text-[10px] text-apple-text-secondary line-clamp-1 mt-0.5">{activeCharacter.description}</p>
                )}
              </div>
            </div>
            {activeCharacter.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {activeCharacter.tags.map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 bg-white/80 text-blue-500 text-[10px] rounded border border-blue-100">{tag}</span>
                ))}
              </div>
            )}
            <p className="text-[10px] text-blue-400 italic">
              {activeCharacter.referenceImageUrl ? '生成将更新此角色的参考图' : '生成将为此角色创建参考图'}
            </p>
          </div>
        )}

        {/* 场景上下文自动组装区 */}
        {activeScene && !frameContext?.frame && !activeCharacter && (
          <div className="mb-2 px-3 py-2.5 bg-emerald-50/50 rounded-xl border border-emerald-200/40 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-medium text-apple-text">
              <div className="w-8 h-8 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center shrink-0 overflow-hidden">
                {activeScene.referenceImageUrl ? (
                  <img src={activeScene.referenceImageUrl} alt={activeScene.name} className="w-full h-full object-cover" />
                ) : (
                  <MapPin size={14} className="text-green-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-medium">{activeScene.name}</span>
                  <span className="text-[10px] text-apple-text-tertiary">场景</span>
                </div>
                {activeScene.description && (
                  <p className="text-[10px] text-apple-text-secondary line-clamp-1 mt-0.5">{activeScene.description}</p>
                )}
              </div>
            </div>
            <p className="text-[10px] text-emerald-400 italic">
              {activeScene.referenceImageUrl ? '生成将更新此场景的参考图' : '生成将为此场景创建参考图'}
            </p>
          </div>
        )}

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
            {attachments.length > 0 && (
              <div className="flex items-start gap-1.5 mb-2 flex-wrap">
                {attachments.map((att, index) => (
                  <div key={index} className="relative group/att">
                    {att.previewUrl ? (
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-apple-border-light">
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
                    accept="image/*,video/*,audio/*"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
            )}

            <div className="flex items-start gap-1.5">
              {attachments.length === 0 && (
                <label className="flex-shrink-0 w-10 h-10 rounded-xl bg-apple-bg-secondary border border-apple-border-light/50 flex flex-col items-center justify-center cursor-pointer hover:bg-apple-bg-tertiary transition-colors mt-0.5">
                  <Plus size={16} className="text-apple-text-tertiary" />
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*,video/*,audio/*"
                    onChange={handleFileSelect}
                  />
                </label>
              )}

              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => {
                    const val = e.target.value
                    setPrompt(val)
                    const cursorPos = e.target.selectionStart
                    const textBeforeCursor = val.slice(0, cursorPos)
                    const atMatch = textBeforeCursor.match(/@([^\s@]*)$/)
                    if (atMatch) {
                      setShowMentionPopup(true)
                      setMentionQuery(atMatch[1])
                    } else {
                      setShowMentionPopup(false)
                      setMentionQuery('')
                    }
                  }}
                  onKeyDown={(e) => {
                    if (showMentionPopup && e.key === 'Escape') {
                      e.preventDefault()
                      setShowMentionPopup(false)
                      return
                    }
                    handleKeyDown(e)
                  }}
                  placeholder={renderPlaceholder()}
                  rows={1}
                  className="w-full bg-transparent text-sm text-apple-text placeholder-apple-text-tertiary/60 resize-none outline-none leading-relaxed py-2 min-h-[36px] max-h-[100px]"
                  disabled={isSending}
                  style={{ overflow: 'auto' }}
                />

                {showMentionPopup && mentionResults.length > 0 && (
                  <>
                    <div className="fixed inset-0 z-[55]" onClick={() => setShowMentionPopup(false)} />
                    <div className="absolute bottom-full left-0 mb-1 w-56 max-h-48 overflow-y-auto bg-white rounded-xl border border-apple-border-light shadow-xl z-[60]">
                      <div className="px-3 py-1.5 text-[10px] text-apple-text-tertiary border-b border-apple-border-light/50">
                        选择角色或场景
                      </div>
                      {mentionResults.map((item) => (
                        <button
                          key={`${item.type}-${item.id}`}
                          onClick={() => {
                            const cursorPos = textareaRef.current?.selectionStart || prompt.length
                            const textBefore = prompt.slice(0, cursorPos)
                            const textAfter = prompt.slice(cursorPos)
                            const atIdx = textBefore.lastIndexOf('@')
                            const newText = textBefore.slice(0, atIdx) + `@${item.name} ` + textAfter
                            setPrompt(newText)
                            setMentions((prev) => {
                              if (prev.some((m) => m.id === item.id)) return prev
                              return [...prev, item]
                            })
                            setShowMentionPopup(false)
                            setMentionQuery('')
                            textareaRef.current?.focus()
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-apple-text hover:bg-apple-bg-secondary transition-colors"
                        >
                          {item.type === 'character' ? (
                            <User size={12} className="text-brand flex-shrink-0" />
                          ) : (
                            <MapPin size={12} className="text-emerald-500 flex-shrink-0" />
                          )}
                          <span className="truncate">{item.name}</span>
                          <span className="text-[10px] text-apple-text-tertiary ml-auto">
                            {item.type === 'character' ? '角色' : '场景'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {renderToolbar()}
        </div>
      </div>
    </div>
  )
}
