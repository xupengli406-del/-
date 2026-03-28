import { FileText, Image, Video, Music } from 'lucide-react'
import type { ModelInfo } from '../../store/types'

// 生成模式类型
export type GenerateMode = 'script' | 'image' | 'video' | 'audio'

// 模式配置
export const modeConfig: Record<
  GenerateMode,
  { label: string; icon: typeof FileText; color: string; apiType: 'text' | 'image' | 'video' | 'audio'; ability?: ModelInfo['ability'] }
> = {
  script: { label: '剧本生成', icon: FileText, color: '#2B5AE8', apiType: 'text' },
  image: { label: '图片生成', icon: Image, color: '#2B5AE8', apiType: 'image', ability: 'text2img' },
  video: { label: '视频生成', icon: Video, color: '#2B5AE8', apiType: 'video', ability: 'text2video' },
  audio: { label: '音频生成', icon: Music, color: '#2B5AE8', apiType: 'audio' },
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

// 图片生成数量选项
export const IMAGE_BATCH_OPTIONS = [
  { label: '1 / 张', value: 1 },
  { label: '2 / 张', value: 2 },
  { label: '3 / 张', value: 3 },
  { label: '4 / 张', value: 4 },
]

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
