import { useMemo, useCallback } from 'react'
import { useCanvasStore } from '../store/canvasStore'
import { useEditorPreferencesStore } from '../store/editorPreferencesStore'
import type { GenerateMode } from '../components/generate/constants'
import {
  getVideoModelCapabilities,
  findModelForRefMode,
  findModelForDuration,
  isRefModeAvailable,
  type VideoReferenceMode,
  type VideoModelCapabilities,
} from '../services/modelCapabilities'

export function useEditorOptions() {
  const availableModels = useCanvasStore((s) => s.availableModels)

  const imagePref = useEditorPreferencesStore((s) => s.image)
  const videoPref = useEditorPreferencesStore((s) => s.video)
  const scriptPref = useEditorPreferencesStore((s) => s.script)
  const audioPref = useEditorPreferencesStore((s) => s.audio)
  const { updateImagePref, updateVideoPref, updateScriptPref, updateAudioPref } =
    useEditorPreferencesStore()

  const imageModels = useMemo(
    () => availableModels.filter((m) => m.ability === 'text2img'),
    [availableModels],
  )
  const videoModels = useMemo(
    () => availableModels.filter((m) => m.ability === 'text2video'),
    [availableModels],
  )
  const scriptModels = useMemo(
    () => availableModels.filter((m) => m.ability === 'chat_completion'),
    [availableModels],
  )

  const resolveModel = (pref: string, models: { name: string }[]) => {
    if (pref && models.some((m) => m.name === pref)) return pref
    return models[0]?.name || ''
  }

  const selectedImageModel = useMemo(
    () => resolveModel(imagePref.model, imageModels),
    [imagePref.model, imageModels],
  )
  const selectedVideoModel = useMemo(
    () => resolveModel(videoPref.model, videoModels),
    [videoPref.model, videoModels],
  )
  const selectedScriptModel = useMemo(
    () => resolveModel(scriptPref.model, scriptModels),
    [scriptPref.model, scriptModels],
  )

  // 当前视频模型的能力
  const videoCapabilities: VideoModelCapabilities = useMemo(() => {
    const m = videoModels.find((x) => x.name === selectedVideoModel)
    if (!m) return { refModes: [], resolutions: [], durations: [5, 10], ratios: ['16:9'] }
    return getVideoModelCapabilities(m.id, m.name)
  }, [selectedVideoModel, videoModels])

  // 确保偏好值在当前模型支持范围内
  const videoRefMode = useMemo(() => {
    if (videoCapabilities.refModes.includes(videoPref.refMode as VideoReferenceMode))
      return videoPref.refMode
    return videoCapabilities.refModes[0] || 'both'
  }, [videoPref.refMode, videoCapabilities.refModes])

  const videoLength = useMemo(() => {
    if (videoCapabilities.durations.includes(videoPref.length)) return videoPref.length
    return videoCapabilities.durations[0] || 5
  }, [videoPref.length, videoCapabilities.durations])

  const videoResolution = useMemo(() => {
    if (videoCapabilities.resolutions.length === 0) return ''
    if (videoCapabilities.resolutions.includes(videoPref.resolution)) return videoPref.resolution
    return videoCapabilities.resolutions[0] || ''
  }, [videoPref.resolution, videoCapabilities.resolutions])

  // ── 联动设置器 ──

  /** 切换视频模型 → 自动调整不兼容的参数 */
  const setSelectedVideoModel = useCallback((modelName: string) => {
    const m = videoModels.find((x) => x.name === modelName)
    if (!m) { updateVideoPref({ model: modelName }); return }
    const caps = getVideoModelCapabilities(m.id, m.name)
    const updates: Record<string, unknown> = { model: modelName }

    if (!caps.refModes.includes(videoPref.refMode as VideoReferenceMode))
      updates.refMode = caps.refModes[0] || 'both'
    if (!caps.durations.includes(videoPref.length))
      updates.length = caps.durations[0] || 5
    if (caps.resolutions.length > 0 && !caps.resolutions.includes(videoPref.resolution))
      updates.resolution = caps.resolutions[0]
    if (caps.resolutions.length === 0)
      updates.resolution = ''

    updateVideoPref(updates)
  }, [videoModels, videoPref.refMode, videoPref.length, videoPref.resolution, updateVideoPref])

  /** 切换生成方式 → 如果当前模型不支持，自动换模型 */
  const setVideoRefMode = useCallback((mode: string) => {
    if (videoCapabilities.refModes.includes(mode as VideoReferenceMode)) {
      updateVideoPref({ refMode: mode })
      return
    }
    // 找到支持该 mode 的模型
    const target = findModelForRefMode(mode as VideoReferenceMode, videoModels)
    if (!target) return // 无模型支持此模式
    const caps = getVideoModelCapabilities(target.id, target.name)
    const updates: Record<string, unknown> = { refMode: mode, model: target.name }
    if (!caps.durations.includes(videoPref.length))
      updates.length = caps.durations[0] || 5
    if (caps.resolutions.length > 0 && !caps.resolutions.includes(videoPref.resolution))
      updates.resolution = caps.resolutions[0]
    if (caps.resolutions.length === 0)
      updates.resolution = ''
    updateVideoPref(updates)
  }, [videoCapabilities.refModes, videoModels, videoPref.length, videoPref.resolution, updateVideoPref])

  /** 切换时长 → 如果当前模型不支持，自动换模型 */
  const setVideoLength = useCallback((len: number) => {
    if (videoCapabilities.durations.includes(len)) {
      updateVideoPref({ length: len })
      return
    }
    const target = findModelForDuration(len, videoModels)
    if (!target) return
    const caps = getVideoModelCapabilities(target.id, target.name)
    const updates: Record<string, unknown> = { length: len, model: target.name }
    if (!caps.refModes.includes(videoPref.refMode as VideoReferenceMode))
      updates.refMode = caps.refModes[0] || 'both'
    if (caps.resolutions.length > 0 && !caps.resolutions.includes(videoPref.resolution))
      updates.resolution = caps.resolutions[0]
    if (caps.resolutions.length === 0)
      updates.resolution = ''
    updateVideoPref(updates)
  }, [videoCapabilities.durations, videoModels, videoPref.refMode, videoPref.resolution, updateVideoPref])

  /** 检查某个 refMode 在所有模型中是否可用（用于置灰） */
  const isVideoRefModeAvailable = useCallback(
    (mode: VideoReferenceMode) => isRefModeAvailable(mode, videoModels),
    [videoModels],
  )

  const getActiveModel = (mode: GenerateMode): string => {
    if (mode === 'image') return selectedImageModel
    if (mode === 'video') return selectedVideoModel
    if (mode === 'script') return selectedScriptModel
    return ''
  }

  const getModelDisplayName = (mode: GenerateMode): string => {
    const model = getActiveModel(mode)
    if (!model) return ''
    return model.replace('MaaS_', '')
  }

  return {
    imageModels,
    videoModels,
    scriptModels,

    selectedImageModel,
    imageRatio: imagePref.ratio,
    imageResolution: imagePref.resolution,
    imageBatch: imagePref.batch,

    selectedVideoModel,
    videoLength,
    videoRatio: videoPref.ratio,
    videoRefMode,
    videoResolution,
    videoCapabilities,

    selectedScriptModel,
    audioVoice: audioPref.voice,

    // 设置器
    setSelectedImageModel: (v: string) => updateImagePref({ model: v }),
    setImageRatio: (v: string) => updateImagePref({ ratio: v }),
    setImageResolution: (v: string) => updateImagePref({ resolution: v }),
    setImageBatch: (v: number) => updateImagePref({ batch: v }),

    setSelectedVideoModel,
    setVideoLength,
    setVideoRatio: (v: string) => updateVideoPref({ ratio: v }),
    setVideoRefMode,
    setVideoResolution: (v: string) => updateVideoPref({ resolution: v }),

    setSelectedScriptModel: (v: string) => updateScriptPref({ model: v }),

    // 工具
    getActiveModel,
    getModelDisplayName,
    isVideoRefModeAvailable,
  }
}
