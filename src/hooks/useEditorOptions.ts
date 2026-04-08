import { useMemo, useCallback } from 'react'
import { useProjectStore } from '../store/projectStore'
import { useEditorPreferencesStore } from '../store/editorPreferencesStore'
import type { GenerateMode } from '../components/generate/constants'
import {
  getVideoModelCapabilities,
  getImageResolutionOptions,
  isSeedream5Lite,
  findModelForRefMode,
  findModelForDuration,
  isRefModeAvailable,
  type VideoReferenceMode,
  type VideoModelCapabilities,
  type ImageResolutionOption,
} from '../services/modelCapabilities'

export function useEditorOptions() {
  const availableModels = useProjectStore((s) => s.availableModels)

  const imagePref = useEditorPreferencesStore((s) => s.image)
  const videoPref = useEditorPreferencesStore((s) => s.video)
  const { updateImagePref, updateVideoPref } =
    useEditorPreferencesStore()

  const imageModels = useMemo(
    () => availableModels.filter((m) => m.ability === 'text2img'),
    [availableModels],
  )
  const videoModels = useMemo(
    () => availableModels.filter((m) => m.ability === 'text2video'),
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

  // 当前图片模型的分辨率选项
  const imageResolutionOptions: ImageResolutionOption[] = useMemo(() => {
    const m = imageModels.find((x) => x.name === selectedImageModel)
    if (!m) return [{ label: '高清 2K', value: '2K' }, { label: '超清 4K', value: '4K' }]
    return getImageResolutionOptions(m.id, m.name)
  }, [selectedImageModel, imageModels])

  // 确保图片分辨率在当前模型支持范围内
  const imageResolution = useMemo(() => {
    const values = imageResolutionOptions.map((o) => o.value)
    if (values.includes(imagePref.resolution)) return imagePref.resolution
    return values[0] || '2K'
  }, [imagePref.resolution, imageResolutionOptions])

  const selectedVideoModel = useMemo(
    () => resolveModel(videoPref.model, videoModels),
    [videoPref.model, videoModels],
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

    selectedImageModel,
    imageRatio: imagePref.ratio,
    imageResolution,
    imageResolutionOptions,
    imagePromptOptimize: imagePref.promptOptimize,
    imageSequentialGeneration: imagePref.sequentialGeneration,
    imageMaxImages: imagePref.maxImages,
    imageOutputFormat: imagePref.outputFormat,
    imageSupportsOutputFormat: useMemo(() => {
      const m = imageModels.find((x) => x.name === selectedImageModel)
      return m ? isSeedream5Lite(m.id, m.name) : false
    }, [selectedImageModel, imageModels]),
    selectedVideoModel,
    videoLength,
    videoRatio: videoPref.ratio,
    videoRefMode,
    videoResolution,
    videoCapabilities,

    // 设置器
    setSelectedImageModel: (v: string) => {
      const m = imageModels.find((x) => x.name === v)
      if (m) {
        const opts = getImageResolutionOptions(m.id, m.name)
        const values = opts.map((o) => o.value)
        if (!values.includes(imagePref.resolution)) {
          updateImagePref({ model: v, resolution: values[0] || '2K' })
          return
        }
      }
      updateImagePref({ model: v })
    },
    setImageRatio: (v: string) => updateImagePref({ ratio: v }),
    setImageResolution: (v: string) => updateImagePref({ resolution: v }),
    setImagePromptOptimize: (v: boolean) => updateImagePref({ promptOptimize: v }),
    setImageSequentialGeneration: (v: boolean) => updateImagePref({ sequentialGeneration: v }),
    setImageMaxImages: (v: number) => updateImagePref({ maxImages: v }),
    setImageOutputFormat: (v: 'jpeg' | 'png') => updateImagePref({ outputFormat: v }),

    setSelectedVideoModel,
    setVideoLength,
    setVideoRatio: (v: string) => updateVideoPref({ ratio: v }),
    setVideoRefMode,
    setVideoResolution: (v: string) => updateVideoPref({ resolution: v }),

    // 工具
    getActiveModel,
    getModelDisplayName,
    isVideoRefModeAvailable,
  }
}
