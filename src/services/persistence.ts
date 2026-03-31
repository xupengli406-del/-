/**
 * 持久化 API 服务 - 与后端交互进行资产和画布文件的持久化存储
 * 后端不可用时自动 fallback 到 localStorage，确保跨标签页数据一致
 */

import type { CanvasFile } from '../store/types'

const API_BASE = 'http://localhost:8000'

// ===== localStorage 辅助函数 =====

const LS_KEYS = {
  assets: 'poc_assets',
  canvasFiles: 'poc_canvas_files',
  generateHistory: 'poc_generate_history',
} as const

export function resetDemoStorage(): void {
  try {
    localStorage.removeItem(LS_KEYS.assets)
    localStorage.removeItem(LS_KEYS.canvasFiles)
    localStorage.removeItem(LS_KEYS.generateHistory)
  } catch {
    console.warn('清理演示数据失败')
  }
}

function lsRead<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function lsWrite<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    console.warn('localStorage 写入失败:', key)
  }
}

/** 合并两个数组，以 id 去重（remote 优先），保留 local 独有项 */
function mergeById<T extends { id: string }>(remote: T[], local: T[]): T[] {
  const map = new Map<string, T>()
  for (const item of local) map.set(item.id, item)
  for (const item of remote) map.set(item.id, item)
  return Array.from(map.values())
}

// ===== 资产 API =====

export interface AssetPayload {
  id: string
  name: string
  url: string
  type: 'image' | 'video' | 'text' | 'audio'
  source: 'generate' | 'upload' | 'canvas'
  textContent?: string
  createdAt: number
}

export async function fetchAssets(): Promise<AssetPayload[]> {
  try {
    const res = await fetch(`${API_BASE}/api/assets`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const remote = await res.json()
    const local = lsRead<AssetPayload>(LS_KEYS.assets)
    const merged = mergeById<AssetPayload>(remote, local)
    lsWrite(LS_KEYS.assets, merged)
    return merged
  } catch {
    console.warn('后端不可用，从 localStorage 读取资产')
    return lsRead<AssetPayload>(LS_KEYS.assets)
  }
}

export async function createAssetAPI(asset: AssetPayload): Promise<void> {
  // 始终写入 localStorage
  const existing = lsRead<AssetPayload>(LS_KEYS.assets)
  lsWrite(LS_KEYS.assets, [...existing, asset])

  try {
    await fetch(`${API_BASE}/api/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(asset),
    })
  } catch {
    console.warn('后端不可用，资产已保存到 localStorage:', asset.id)
  }
}

export async function deleteAssetAPI(id: string): Promise<void> {
  // 始终从 localStorage 删除
  const existing = lsRead<AssetPayload>(LS_KEYS.assets)
  lsWrite(LS_KEYS.assets, existing.filter((a) => a.id !== id))

  try {
    await fetch(`${API_BASE}/api/assets/${id}`, { method: 'DELETE' })
  } catch {
    console.warn('后端不可用，资产已从 localStorage 删除:', id)
  }
}

// ===== 画布文件 API =====

export interface CanvasFilePayload {
  id: string
  name: string
  projectType?: 'canvas' | 'script' | 'image' | 'video' | 'audio'
  folderId?: string
  mediaState?: CanvasFile['mediaState']
  aiSession?: CanvasFile['aiSession']
  snapshot: { nodes: unknown[]; edges: unknown[] }
  thumbnailUrl: string
  nodeCount: number
  edgeCount: number
  createdAt: number
  updatedAt: number
}

export function canvasFileToPayload(f: CanvasFile): CanvasFilePayload {
  return {
    id: f.id,
    name: f.name,
    projectType: f.projectType,
    folderId: f.folderId,
    mediaState: f.mediaState,
    aiSession: f.aiSession,
    snapshot: f.snapshot as { nodes: unknown[]; edges: unknown[] },
    thumbnailUrl: f.thumbnailUrl,
    nodeCount: f.nodeCount,
    edgeCount: f.edgeCount,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  }
}

export async function fetchCanvasFiles(): Promise<CanvasFilePayload[]> {
  try {
    const res = await fetch(`${API_BASE}/api/canvas-files`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const remote = await res.json()
    const local = lsRead<CanvasFilePayload>(LS_KEYS.canvasFiles)
    const merged = mergeById<CanvasFilePayload>(remote, local)
    lsWrite(LS_KEYS.canvasFiles, merged)
    return merged
  } catch {
    console.warn('后端不可用，从 localStorage 读取画布文件')
    return lsRead<CanvasFilePayload>(LS_KEYS.canvasFiles)
  }
}

export async function createCanvasFileAPI(file: CanvasFilePayload): Promise<void> {
  const existing = lsRead<CanvasFilePayload>(LS_KEYS.canvasFiles)
  lsWrite(LS_KEYS.canvasFiles, [...existing, file])

  try {
    await fetch(`${API_BASE}/api/canvas-files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(file),
    })
  } catch {
    console.warn('后端不可用，画布文件已保存到 localStorage:', file.id)
  }
}

export async function updateCanvasFileAPI(id: string, file: CanvasFilePayload): Promise<void> {
  const existing = lsRead<CanvasFilePayload>(LS_KEYS.canvasFiles)
  const idx = existing.findIndex((f) => f.id === id)
  if (idx >= 0) {
    existing[idx] = file
  } else {
    existing.push(file)
  }
  lsWrite(LS_KEYS.canvasFiles, existing)

  try {
    await fetch(`${API_BASE}/api/canvas-files/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(file),
    })
  } catch {
    console.warn('后端不可用，画布文件已更新到 localStorage:', id)
  }
}

export async function deleteCanvasFileAPI(id: string): Promise<void> {
  const existing = lsRead<CanvasFilePayload>(LS_KEYS.canvasFiles)
  lsWrite(LS_KEYS.canvasFiles, existing.filter((f) => f.id !== id))

  try {
    await fetch(`${API_BASE}/api/canvas-files/${id}`, { method: 'DELETE' })
  } catch {
    console.warn('后端不可用，画布文件已从 localStorage 删除:', id)
  }
}

// ===== 生成页对话历史 API =====

export interface GenerateHistoryPayload {
  id: string
  mode: 'script' | 'image' | 'video' | 'audio'
  prompt: string
  result?: string
  resultUrl?: string
  referenceImageUrls?: string[]
  referenceMode?: 'all' | 'first' | 'both'
  referenceThumbLabels?: string[]
  status: 'generating' | 'completed' | 'failed'
  createdAt: number
}

export async function fetchGenerateHistory(): Promise<GenerateHistoryPayload[]> {
  try {
    const res = await fetch(`${API_BASE}/api/generate-history`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const remote = await res.json()
    const local = lsRead<GenerateHistoryPayload>(LS_KEYS.generateHistory)
    const merged = mergeById<GenerateHistoryPayload>(remote, local)
    lsWrite(LS_KEYS.generateHistory, merged)
    return merged
  } catch {
    console.warn('后端不可用，从 localStorage 读取对话历史')
    return lsRead<GenerateHistoryPayload>(LS_KEYS.generateHistory)
  }
}

export async function saveGenerateHistoryAPI(items: GenerateHistoryPayload[]): Promise<void> {
  // 始终写入 localStorage
  lsWrite(LS_KEYS.generateHistory, items)

  try {
    await fetch(`${API_BASE}/api/generate-history`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items),
    })
  } catch {
    console.warn('后端不可用，对话历史已保存到 localStorage')
  }
}
