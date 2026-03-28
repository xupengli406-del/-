const API_BASE = 'http://localhost:8000'

/** 上传本地图片到后端 /api/upload，返回可传给生成接口的绝对 URL */
export async function uploadImageFile(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: fd,
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`上传失败 (${res.status}): ${t}`)
  }
  const data = (await res.json()) as { url?: string }
  const path = data.url || ''
  if (!path.startsWith('http')) {
    return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
  }
  return path
}

/** 将 blob: 预览地址转为可持久化的 http URL（需已运行本地上传服务） */
export async function resolvePreviewToUploadedUrl(previewUrl: string, filename: string): Promise<string> {
  if (!previewUrl.startsWith('blob:')) return previewUrl
  const blob = await fetch(previewUrl).then((r) => r.blob())
  const file = new File([blob], filename || 'reference.png', {
    type: blob.type && blob.type.startsWith('image/') ? blob.type : 'image/png',
  })
  return uploadImageFile(file)
}
