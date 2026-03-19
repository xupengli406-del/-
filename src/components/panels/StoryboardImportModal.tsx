import { useState, useCallback } from 'react'
import { useCanvasStore } from '../../store/canvasStore'
import type { StoryboardImportData } from '../../store/types'
import { parseExcelFile, parseWordFile, detectFileType } from '../../services/storyboardParser'
import { X, FileUp, Check, AlertCircle, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'

// 示例 JSON 供用户参考
const EXAMPLE_JSON = `{
  "title": "第1集 迟到的早晨",
  "frames": [
    {
      "index": 1,
      "dialogue": "铃声响起，教室里安静下来",
      "characters": ["林小雨"],
      "scene": "教室-白天",
      "shot": "远景",
      "description": "空旷的教室，阳光从窗户洒入，只有一个空座位"
    },
    {
      "index": 2,
      "dialogue": "砰！门被推开",
      "characters": ["林小雨"],
      "scene": "教室-白天",
      "shot": "中景",
      "description": "林小雨气喘吁吁地站在门口，书包歪挎着"
    }
  ],
  "characters": [
    {
      "name": "林小雨",
      "description": "17岁高中女生，齐腰长发，大眼睛，性格活泼冒失",
      "tags": ["女主", "长发", "校服"]
    }
  ],
  "scenes": [
    {
      "name": "教室-白天",
      "description": "标准高中教室，课桌整齐排列，黑板上有板书，窗外是操场"
    }
  ]
}`

interface Props {
  onClose: () => void
}

export default function StoryboardImportModal({ onClose }: Props) {
  const { importStoryboard } = useCanvasStore()
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<StoryboardImportData | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [uploadedFileType, setUploadedFileType] = useState<'json' | 'excel' | 'word' | null>(null)
  const [isParsing, setIsParsing] = useState(false)

  const handleParse = useCallback(() => {
    setError(null)
    setPreview(null)

    if (!jsonText.trim()) {
      setError('请输入或粘贴 JSON 内容')
      return
    }

    try {
      const parsed = JSON.parse(jsonText)

      // 基本校验
      if (!parsed.frames || !Array.isArray(parsed.frames) || parsed.frames.length === 0) {
        setError('JSON 格式错误：缺少 frames 数组或为空')
        return
      }

      for (const frame of parsed.frames) {
        if (typeof frame.index !== 'number') {
          setError('JSON 格式错误：每个 frame 需要 index 字段（数字）')
          return
        }
      }

      const data: StoryboardImportData = {
        title: parsed.title || '未命名脚本',
        frames: parsed.frames.map((f: Record<string, unknown>) => ({
          index: f.index as number,
          dialogue: (f.dialogue as string) || '',
          characters: Array.isArray(f.characters) ? f.characters : [],
          scene: (f.scene as string) || '',
          shot: (f.shot as string) || '',
          description: (f.description as string) || '',
        })),
        characters: Array.isArray(parsed.characters)
          ? parsed.characters.map((c: Record<string, unknown>) => ({
              name: (c.name as string) || '',
              description: (c.description as string) || '',
              referenceImageUrl: (c.referenceImageUrl as string) || '',
              tags: Array.isArray(c.tags) ? c.tags : [],
            }))
          : [],
        scenes: Array.isArray(parsed.scenes)
          ? parsed.scenes.map((s: Record<string, unknown>) => ({
              name: (s.name as string) || '',
              description: (s.description as string) || '',
              referenceImageUrl: (s.referenceImageUrl as string) || '',
            }))
          : [],
      }

      setPreview(data)
    } catch (e) {
      setError(`JSON 解析失败: ${e instanceof Error ? e.message : '未知错误'}`)
    }
  }, [jsonText])

  const handleImport = useCallback(() => {
    if (!preview) return
    importStoryboard(preview)
    onClose()
  }, [preview, importStoryboard, onClose])

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileType = detectFileType(file.name)
    setUploadedFileName(file.name)
    setUploadedFileType(fileType === 'unknown' ? null : fileType)
    setError(null)
    setPreview(null)

    if (fileType === 'json') {
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result
        if (typeof text === 'string') {
          setJsonText(text)
        }
      }
      reader.readAsText(file)
      return
    }

    if (fileType === 'excel') {
      setIsParsing(true)
      try {
        const buffer = await file.arrayBuffer()
        const result = parseExcelFile(buffer, file.name)
        if (result.success) {
          setJsonText(JSON.stringify(result.data, null, 2))
          setPreview(result.data)
        } else {
          setError(result.error)
        }
      } catch (err) {
        setError(`文件读取失败: ${err instanceof Error ? err.message : '未知错误'}`)
      } finally {
        setIsParsing(false)
      }
      return
    }

    if (fileType === 'word') {
      setIsParsing(true)
      try {
        const buffer = await file.arrayBuffer()
        const result = await parseWordFile(buffer)
        if (result.success) {
          setJsonText(JSON.stringify(result.data, null, 2))
          setPreview(result.data)
        } else {
          if (result.fallbackText) {
            setJsonText(result.fallbackText)
          }
          setError(result.error)
        }
      } catch (err) {
        setError(`文件读取失败: ${err instanceof Error ? err.message : '未知错误'}`)
      } finally {
        setIsParsing(false)
      }
      return
    }

    setError('不支持的文件格式，请上传 .json、.docx、.xlsx 或 .xls 文件')
  }, [])

  const handleClearFile = useCallback(() => {
    setUploadedFileName('')
    setUploadedFileType(null)
    setJsonText('')
    setError(null)
    setPreview(null)
  }, [])

  const handleLoadExample = useCallback(() => {
    setJsonText(EXAMPLE_JSON)
    setError(null)
    setPreview(null)
    setUploadedFileName('')
    setUploadedFileType(null)
  }, [])

  const fileTypeIcon = uploadedFileType === 'excel'
    ? <FileSpreadsheet size={14} />
    : uploadedFileType === 'word'
    ? <FileText size={14} />
    : <FileUp size={14} />

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[640px] max-h-[85vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-apple-border-light">
          <div className="flex items-center gap-2">
            <FileUp size={18} className="text-brand" />
            <h2 className="text-base font-semibold text-apple-text">导入分镜脚本</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-apple-bg-secondary text-apple-text-tertiary hover:text-apple-text transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* 提示 */}
          <div className="flex items-start gap-2 text-xs text-apple-text-secondary bg-apple-bg-secondary rounded-lg px-3 py-2">
            <span>支持 .json / .docx / .xlsx 文件，或直接粘贴 JSON。</span>
            <button
              onClick={handleLoadExample}
              className="text-brand hover:underline whitespace-nowrap"
            >
              加载示例
            </button>
          </div>

          {/* 文件上传 */}
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-apple-bg-secondary border border-apple-border-light rounded-lg text-xs text-apple-text hover:bg-apple-bg-tertiary cursor-pointer transition-colors">
              <FileUp size={14} />
              上传文件
              <input
                type="file"
                accept=".json,.docx,.xlsx,.xls,application/json,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>

            {uploadedFileName && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                {fileTypeIcon}
                <span className="max-w-[200px] truncate">{uploadedFileName}</span>
                <button
                  onClick={handleClearFile}
                  className="ml-0.5 text-blue-400 hover:text-blue-600"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          {/* 解析中状态 */}
          {isParsing && (
            <div className="flex items-center justify-center py-4 text-xs text-apple-text-secondary">
              <Loader2 size={16} className="animate-spin mr-2 text-brand" />
              正在解析文件...
            </div>
          )}

          {/* JSON 编辑区 */}
          <textarea
            value={jsonText}
            onChange={(e) => { setJsonText(e.target.value); setError(null); setPreview(null) }}
            placeholder="在此粘贴分镜脚本 JSON..."
            className="w-full h-60 px-3 py-2 text-xs font-mono bg-apple-bg-secondary border border-apple-border-light rounded-lg resize-none focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
          />

          {/* 错误提示 */}
          {error && (
            <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 解析预览 */}
          {preview && (
            <div className="px-3 py-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-green-700">
                <Check size={14} />
                解析成功
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-green-600">
                <span>标题: {preview.title}</span>
                <span>分镜格数: {preview.frames.length}</span>
                <span>角色数: {preview.characters.length}</span>
                <span>场景数: {preview.scenes.length}</span>
              </div>
              {preview.frames.length > 0 && (
                <div className="text-[10px] text-green-500 mt-1">
                  前3格: {preview.frames.slice(0, 3).map((f) => `#${f.index} "${f.dialogue?.slice(0, 15) || '..'}"`).join('、')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-apple-border-light">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-apple-text-secondary hover:bg-apple-bg-secondary rounded-lg transition-colors"
          >
            取消
          </button>
          {!preview ? (
            <button
              onClick={handleParse}
              disabled={!jsonText.trim() || isParsing}
              className="px-4 py-2 text-xs font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isParsing ? '解析中...' : '解析'}
            </button>
          ) : (
            <button
              onClick={handleImport}
              className="px-4 py-2 text-xs font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors"
            >
              导入 ({preview.frames.length} 格)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
