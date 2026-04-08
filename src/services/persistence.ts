/**
 * 持久化 API 服务 - 与后端交互进行项目文件的持久化存储
 * 后端不可用时自动 fallback 到 localStorage，确保跨标签页数据一致
 */

import type { ProjectFile } from '../store/types'

const API_BASE = 'http://localhost:8000'

// ===== localStorage 辅助函数 =====

const LS_KEYS = {
  projectFiles: 'poc_project_files',
  generateHistory: 'poc_generate_history',
} as const

export function resetDemoStorage(): void {
  try {
    localStorage.removeItem(LS_KEYS.projectFiles)
    localStorage.removeItem(LS_KEYS.generateHistory)
    // 清理旧版 key
    localStorage.removeItem('poc_assets')
    localStorage.removeItem('poc_canvas_files')
  } catch {
    console.warn('清理演示数据失败')
  }
}

function lsRead<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
    // 兼容旧 key：如果新 key 不存在，尝试读取旧 key
    if (key === LS_KEYS.projectFiles) {
      const legacy = localStorage.getItem('poc_canvas_files')
      return legacy ? JSON.parse(legacy) : []
    }
    return []
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

// ===== 项目文件 API =====

export interface ProjectFilePayload {
  id: string
  name: string
  projectType?: 'image' | 'video'
  folderId?: string
  mediaState?: ProjectFile['mediaState']
  aiSession?: ProjectFile['aiSession']
  thumbnailUrl: string
  createdAt: number
  updatedAt: number
}

export function projectFileToPayload(f: ProjectFile): ProjectFilePayload {
  return {
    id: f.id,
    name: f.name,
    projectType: f.projectType,
    folderId: f.folderId,
    mediaState: f.mediaState,
    aiSession: f.aiSession,
    thumbnailUrl: f.thumbnailUrl,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  }
}

export async function fetchProjectFiles(): Promise<ProjectFilePayload[]> {
  try {
    const res = await fetch(`${API_BASE}/api/canvas-files`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const remote = await res.json()
    const local = lsRead<ProjectFilePayload>(LS_KEYS.projectFiles)
    const merged = mergeById<ProjectFilePayload>(remote, local)
    lsWrite(LS_KEYS.projectFiles, merged)
    return merged
  } catch {
    console.warn('后端不可用，从 localStorage 读取项目文件')
    return lsRead<ProjectFilePayload>(LS_KEYS.projectFiles)
  }
}

export async function createProjectFileAPI(file: ProjectFilePayload): Promise<void> {
  const existing = lsRead<ProjectFilePayload>(LS_KEYS.projectFiles)
  lsWrite(LS_KEYS.projectFiles, [...existing, file])

  try {
    await fetch(`${API_BASE}/api/canvas-files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(file),
    })
  } catch {
    console.warn('后端不可用，项目文件已保存到 localStorage:', file.id)
  }
}

export async function updateProjectFileAPI(id: string, file: ProjectFilePayload): Promise<void> {
  const existing = lsRead<ProjectFilePayload>(LS_KEYS.projectFiles)
  const idx = existing.findIndex((f) => f.id === id)
  if (idx >= 0) {
    existing[idx] = file
  } else {
    existing.push(file)
  }
  lsWrite(LS_KEYS.projectFiles, existing)

  try {
    await fetch(`${API_BASE}/api/canvas-files/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(file),
    })
  } catch {
    console.warn('后端不可用，项目文件已更新到 localStorage:', id)
  }
}

export async function deleteProjectFileAPI(id: string): Promise<void> {
  const existing = lsRead<ProjectFilePayload>(LS_KEYS.projectFiles)
  lsWrite(LS_KEYS.projectFiles, existing.filter((f) => f.id !== id))

  try {
    await fetch(`${API_BASE}/api/canvas-files/${id}`, { method: 'DELETE' })
  } catch {
    console.warn('后端不可用，项目文件已从 localStorage 删除:', id)
  }
}

// ===== 向后兼容别名 =====
/** @deprecated 使用 ProjectFilePayload */
export type CanvasFilePayload = ProjectFilePayload
/** @deprecated 使用 projectFileToPayload */
export const canvasFileToPayload = projectFileToPayload
/** @deprecated 使用 fetchProjectFiles */
export const fetchCanvasFiles = fetchProjectFiles
/** @deprecated 使用 createProjectFileAPI */
export const createCanvasFileAPI = createProjectFileAPI
/** @deprecated 使用 updateProjectFileAPI */
export const updateCanvasFileAPI = updateProjectFileAPI
/** @deprecated 使用 deleteProjectFileAPI */
export const deleteCanvasFileAPI = deleteProjectFileAPI

// ===== 生成页对话历史 API =====

export interface GenerateHistoryPayload {
  id: string
  mode: 'image' | 'video'
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
