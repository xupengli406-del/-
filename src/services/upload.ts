import type { AssetItem } from '../store/types'

const API_BASE = 'http://localhost:8000'

// 上传图片到后端服务器，后端不可用时使用本地 Blob URL
export async function uploadImage(file: File): Promise<AssetItem> {
  // 先尝试后端上传
  try {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      body: formData,
    })

    if (res.ok) {
      const data = await res.json()
      return {
        id: data.id,
        name: data.name || file.name,
        url: `${API_BASE}${data.url}`,
        type: 'image',
        source: 'upload',
        createdAt: data.created_at ? data.created_at * 1000 : Date.now(),
      }
    }
  } catch {
    // 后端不可用，回退到本地模式
  }

  // 本地模式：使用 Object URL
  const url = URL.createObjectURL(file)
  return {
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    url,
    type: 'image',
    source: 'upload',
    createdAt: Date.now(),
  }
}
