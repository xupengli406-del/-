import { Image, Video } from 'lucide-react'
import type { ModelInfo } from '../../store/types'

// 生成模式类型
export type GenerateMode = 'image' | 'video'

// 模式配置
export const modeConfig: Record<
  GenerateMode,
  { label: string; icon: typeof Image; color: string; apiType: 'image' | 'video'; ability?: ModelInfo['ability'] }
> = {
  image: { label: '图片生成', icon: Image, color: '#2B5AE8', apiType: 'image', ability: 'text2img' },
  video: { label: '视频生成', icon: Video, color: '#2B5AE8', apiType: 'video', ability: 'text2video' },
}

// 图片尺寸选项
export const IMAGE_SIZE_OPTIONS = [
  { label: '1K', value: '1K' },
  { label: '2K', value: '2K' },
]

// 图片比例选项
export const IMAGE_RATIO_OPTIONS = [
  { label: '智能', value: 'auto', icon: '🔄' },
  { label: '21:9', value: '21:9' },
  { label: '16:9', value: '16:9' },
  { label: '3:2', value: '3:2' },
  { label: '4:3', value: '4:3' },
  { label: '1:1', value: '1:1' },
  { label: '3:4', value: '3:4' },
  { label: '2:3', value: '2:3' },
  { label: '9:16', value: '9:16' },
]

// 图片分辨率选项
export const IMAGE_RESOLUTION_OPTIONS = [
  { label: '高清 2K', value: '2K' },
  { label: '超清 4K', value: '4K' },
]

// ===== Seedream 像素尺寸查找表 =====
// key: "模型系列:比例:分辨率" → value: "WxH"
// 数据来源: https://docs.cloudsway.net/zh/maasapi/api-reference/image/seedream

const SEEDREAM_SIZE_MAP: Record<string, string> = {
  // Seedream 4.0 / 4.5 — 1K
  'seedream4:1:1:1K': '1024x1024', 'seedream4:4:3:1K': '1152x864', 'seedream4:3:4:1K': '864x1152',
  'seedream4:16:9:1K': '1280x720', 'seedream4:9:16:1K': '720x1280', 'seedream4:3:2:1K': '1248x832',
  'seedream4:2:3:1K': '832x1248', 'seedream4:21:9:1K': '1512x648',
  // Seedream 4.0 / 4.5 — 2K
  'seedream4:1:1:2K': '2048x2048', 'seedream4:4:3:2K': '2304x1728', 'seedream4:3:4:2K': '1728x2304',
  'seedream4:16:9:2K': '2560x1440', 'seedream4:9:16:2K': '1440x2560', 'seedream4:3:2:2K': '2496x1664',
  'seedream4:2:3:2K': '1664x2496', 'seedream4:21:9:2K': '3024x1296',
  // Seedream 4.0 — 4K
  'seedream4:1:1:4K': '4096x4096', 'seedream4:4:3:4K': '4608x3456', 'seedream4:3:4:4K': '3456x4608',
  'seedream4:16:9:4K': '5120x2880', 'seedream4:9:16:4K': '2880x5120', 'seedream4:3:2:4K': '4992x3328',
  'seedream4:2:3:4K': '3328x4992', 'seedream4:21:9:4K': '6048x2592',
  // Seedream 5.0 — 2K
  'seedream5:1:1:2K': '2048x2048', 'seedream5:4:3:2K': '2304x1728', 'seedream5:3:4:2K': '1728x2304',
  'seedream5:16:9:2K': '2848x1600', 'seedream5:9:16:2K': '1600x2848', 'seedream5:3:2:2K': '2496x1664',
  'seedream5:2:3:2K': '1664x2496', 'seedream5:21:9:2K': '3136x1344',
  // Seedream 5.0 — 3K
  'seedream5:1:1:3K': '3072x3072', 'seedream5:4:3:3K': '3456x2592', 'seedream5:3:4:3K': '2592x3456',
  'seedream5:16:9:3K': '4096x2304', 'seedream5:9:16:3K': '2304x4096', 'seedream5:3:2:3K': '3744x2496',
  'seedream5:2:3:3K': '2496x3744', 'seedream5:21:9:3K': '4704x2016',
}

/** 从模型名推断 Seedream 系列：'seedream4' | 'seedream5' | null */
export function getSeedreamSeries(modelName: string): 'seedream4' | 'seedream5' | null {
  const s = modelName.toLowerCase().replace(/[\s_-]/g, '')
  if (s.includes('seedream5')) return 'seedream5'
  if (s.includes('seedream4') || s.includes('seedream3')) return 'seedream4'  // 4.0 和 4.5 用同一份尺寸表
  return null
}

/**
 * 将 ratio + resolution 解析为像素尺寸字符串 "WxH"。
 * - ratio='auto' 或找不到精确映射时，降级返回分辨率字符串 (如 "2K")。
 */
export function resolveImageSize(modelName: string, ratio: string, resolution: string): string {
  if (ratio === 'auto') return resolution // 让模型自行决定
  const series = getSeedreamSeries(modelName)
  if (!series) return resolution // 非 Seedream 模型，走原逻辑
  const key = `${series}:${ratio}:${resolution}`
  return SEEDREAM_SIZE_MAP[key] || resolution
}

// 视频时长选项
export const VIDEO_LENGTH_OPTIONS = [
  { label: '5s', value: 5 },
  { label: '10s', value: 10 },
  { label: '12s', value: 12 },
]

// 视频比例选项
export const VIDEO_RATIO_OPTIONS = [
  { label: '21:9', value: '21:9' },
  { label: '16:9', value: '16:9' },
  { label: '4:3', value: '4:3' },
  { label: '1:1', value: '1:1' },
  { label: '3:4', value: '3:4' },
  { label: '9:16', value: '9:16' },
]

// 视频分辨率选项
export const VIDEO_RESOLUTION_OPTIONS = [
  { label: '720P', value: '720P' },
  { label: '1080P ✦', value: '1080P' },
]

// 视频参考模式选项
export const VIDEO_REFERENCE_OPTIONS = [
  { label: '全能参考', value: 'all' },
  { label: '首尾帧', value: 'both' },
  { label: '智能多帧', value: 'first' },
]
