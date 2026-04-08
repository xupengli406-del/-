import type { ModelInfo } from '../store/types'

const API_BASE = 'http://localhost:8000'

// ===== 认证 =====

export interface AuthResponse {
  ak: string
  authedModels: Record<string, string[]>
}

export async function authenticate(userId: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/user/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })
  if (!res.ok) {
    throw new Error(`认证失败: ${res.status}`)
  }
  return res.json()
}

// ===== 模型列表 =====

export interface ModelListResponse {
  models: ModelInfo[]
  total: number
}

export async function listModels(
  ak: string,
  ability?: 'text2img' | 'text2video' | 'chat_completion'
): Promise<ModelListResponse> {
  const url = new URL(`${API_BASE}/model/list`)
  if (ability) url.searchParams.set('ability', ability)

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${ak}` },
  })
  if (!res.ok) {
    throw new Error(`获取模型列表失败: ${res.status}`)
  }
  return res.json()
}

// ===== 节点执行（核心生成接口） =====

export interface RunNodeRequest {
  type: 'text' | 'image' | 'video' | 'audio'
  prompt: string
  model: string
  name?: string
  /** 尺寸：分辨率字符串 "2K"/"4K" 或像素值 "WxH"（如 "2048x2048"） */
  size?: string
  length?: number
  watermark?: boolean
  response_format?: 'url' | 'b64_json'
  /** 参考图 URL 列表（Seedream 4.0+ 最多 14 张，与 API image 字段对齐） */
  image?: string[]
  /** 视频：全能参考 / 仅首帧 / 首帧+尾帧 */
  video_reference_mode?: 'all' | 'first' | 'both'
  /** 提示词优化 */
  optimize_prompt_options?: { mode: 'standard' | 'fast' }
  /** 组图生成：auto 启用 / disabled 关闭 */
  sequential_image_generation?: 'auto' | 'disabled'
  /** 组图选项 */
  sequential_image_generation_options?: { max_images: number }
  /** 输出格式（仅 5.0_lite 支持 png） */
  output_format?: 'jpeg' | 'png'
  /** 启用流式输出 */
  stream?: boolean
}

export interface RunNodeResponse {
  status: 'success' | 'failed'
  outputs: {
    content_url?: string
    content_urls?: string[]
    content_b64?: string
    text?: string
    size?: string
  }
  error: string | null
}

export async function runNode(ak: string, params: RunNodeRequest): Promise<RunNodeResponse> {
  const res = await fetch(`${API_BASE}/nodes/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ak}`,
    },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API 请求失败 (${res.status}): ${text}`)
  }

  const data: RunNodeResponse = await res.json()

  if (data.status === 'failed') {
    throw new Error(data.error || '生成失败')
  }

  return data
}

// ===== 便捷包装函数 =====

export async function generateText(
  ak: string,
  prompt: string,
  model: string
): Promise<{ text: string }> {
  const result = await runNode(ak, {
    type: 'text',
    prompt,
    model,
  })
  return {
    text: result.outputs.text || '',
  }
}

export async function generateImage(
  ak: string,
  prompt: string,
  model: string,
  size?: string
): Promise<{ contentUrl: string; size?: string }> {
  const result = await runNode(ak, {
    type: 'image',
    prompt,
    model,
    size,
    response_format: 'url',
  })
  return {
    contentUrl: result.outputs.content_url || '',
    size: result.outputs.size,
  }
}

export async function generateVideo(
  ak: string,
  prompt: string,
  model: string,
  length?: number
): Promise<{ contentUrl: string }> {
  const result = await runNode(ak, {
    type: 'video',
    prompt,
    model,
    length,
  })
  return {
    contentUrl: result.outputs.content_url || '',
  }
}

// ===== 流式节点执行 =====

export interface StreamEvent {
  type: 'partial_succeeded' | 'completed' | 'failed'
  content_url?: string
  content_urls?: string[]
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
  error?: string
}

/**
 * 以 SSE 方式执行节点，逐步回调已生成的图片。
 * 调用方负责在 `onEvent` 中更新 UI。
 */
export async function runNodeStream(
  ak: string,
  params: RunNodeRequest,
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
  const res = await fetch(`${API_BASE}/nodes/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ak}`,
    },
    body: JSON.stringify({ ...params, stream: true }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API 请求失败 (${res.status}): ${text}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('无法读取流式响应')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') return
      try {
        const event: StreamEvent = JSON.parse(data)
        onEvent(event)
      } catch {
        // skip malformed JSON
      }
    }
  }
}
