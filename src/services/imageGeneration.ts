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
  size?: string
  length?: number
  watermark?: boolean
  response_format?: 'url' | 'b64_json'
}

export interface RunNodeResponse {
  status: 'success' | 'failed'
  outputs: {
    content_url?: string
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
