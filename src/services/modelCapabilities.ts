/**
 * 各模型参考图数量上限（与后端真实配置对齐时可改为接口下发）。
 * Seedance 1.5 等：视频「全能参考」下最多 5 张图。
 */

export type VideoReferenceMode = 'all' | 'first' | 'both'

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '')
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
