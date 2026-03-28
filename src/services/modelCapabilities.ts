/**
 * 各模型参考图数量上限（与后端真实配置对齐时可改为接口下发）。
 * Seedance 1.5 等：视频「全能参考」下最多 5 张图。
 */

export type VideoReferenceMode = 'all' | 'first' | 'both'

export interface VideoModelCapabilities {
  refModes: VideoReferenceMode[]
  resolutions: string[]   // 空数组 = 不显示分辨率选项
  durations: number[]
  ratios: string[]
}

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '')
}

function isSeedance15(s: string): boolean {
  return (s.includes('seedance1.5') || s.includes('seedance_1.5') || s.includes('seedance_1_5'))
}

/** 查询视频模型的完整能力 */
export function getVideoModelCapabilities(modelId: string, modelName: string): VideoModelCapabilities {
  const s = norm(`${modelId} ${modelName}`)
  const allRatios = ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16']

  if (isSeedance15(s)) {
    return {
      refModes: ['both'],
      resolutions: ['720P', '1080P'],
      durations: [5, 10, 12],
      ratios: allRatios,
    }
  }
  // Seedance 1.0 及其它视频模型
  return {
    refModes: ['both'],
    resolutions: [],
    durations: [5, 10],
    ratios: allRatios,
  }
}

/** 在给定模型列表中查找支持指定 refMode 的模型 */
export function findModelForRefMode(
  mode: VideoReferenceMode,
  models: { id: string; name: string }[],
): { id: string; name: string } | undefined {
  return models.find((m) => {
    const caps = getVideoModelCapabilities(m.id, m.name)
    return caps.refModes.includes(mode)
  })
}

/** 在给定模型列表中查找支持指定时长的模型 */
export function findModelForDuration(
  duration: number,
  models: { id: string; name: string }[],
): { id: string; name: string } | undefined {
  return models.find((m) => {
    const caps = getVideoModelCapabilities(m.id, m.name)
    return caps.durations.includes(duration)
  })
}

/** 检查全局（所有模型）是否有任一支持该 refMode */
export function isRefModeAvailable(
  mode: VideoReferenceMode,
  models: { id: string; name: string }[],
): boolean {
  return models.some((m) => {
    const caps = getVideoModelCapabilities(m.id, m.name)
    return caps.refModes.includes(mode)
  })
}

/** 图片参考：多数模型支持多图，默认 4 */
export function getImageReferenceMax(modelId: string, modelName: string): number {
  const s = norm(`${modelId} ${modelName}`)
  if (s.includes('seedance1.5') || s.includes('seedance_1.5')) return 5
  return 4
}

/**
 * 视频参考张数随「参考模式」变化；Seedance 1.5 在 all 模式下最多 5 张。
 */
export function getVideoReferenceMax(
  modelId: string,
  modelName: string,
  mode: VideoReferenceMode
): number {
  if (mode === 'first') return 1
  if (mode === 'both') return 2
  const s = norm(`${modelId} ${modelName}`)
  if (s.includes('seedance') && (s.includes('1.5') || s.includes('1_5'))) return 5
  if (s.includes('seedance')) return 5
  return 3
}

/** 与上传顺序对应的缩略图标签（历史气泡展示） */
export function buildReferenceThumbLabels(
  kind: 'image' | 'video',
  videoMode: VideoReferenceMode,
  count: number
): string[] {
  if (count <= 0) return []
  if (kind === 'image') {
    return Array.from({ length: count }, (_, i) => `参考${i + 1}`)
  }
  if (videoMode === 'first') return ['首帧图']
  if (videoMode === 'both') {
    if (count <= 1) return ['首帧图']
    return ['首帧图', '尾帧图']
  }
  return Array.from({ length: count }, (_, i) => `参考${i + 1}`)
}
