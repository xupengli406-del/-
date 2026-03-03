import { useState, useRef, useCallback, useEffect } from 'react'
import { 
  Save, Sparkles, FileText, ChevronDown, Bold, Italic, List, AlignLeft, 
  Heading1, Heading2, LayoutList, Loader2, Users, MapPin, CheckCircle2,
  Scissors, Table2, FileCode2
} from 'lucide-react'
import type { ExcelSheet } from '../../../store/types'
import { useProjectStore } from '../../../store'
import { useCopilotStore } from '../../../store/copilotStore'

interface ScriptEditorProps {
  entityId: string
}

export default function ScriptEditor({ entityId }: ScriptEditorProps) {
  const { scripts, updateScript, parseScriptStructure, generatePanelFromScript, openTab } = useProjectStore()
  const { addMessage } = useCopilotStore()
  const script = scripts.find(s => s.id === entityId)
  
  const [content, setContent] = useState(script?.content || '')
  const [selectedText, setSelectedText] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [isGeneratingPanels, setIsGeneratingPanels] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Excel 表格视图状态
  const hasExcel = !!(script?.excelSheets && script.excelSheets.length > 0)
  const [viewMode, setViewMode] = useState<'table' | 'text'>(hasExcel ? 'table' : 'text')
  const [activeSheetIndex, setActiveSheetIndex] = useState(0)

  // 当切换到不同剧本时，更新content状态
  useEffect(() => {
    if (script) {
      setContent(script.content)
      setSelectedText('')
      // 重置视图模式
      const hasExcelSheets = !!(script.excelSheets && script.excelSheets.length > 0)
      setViewMode(hasExcelSheets ? 'table' : 'text')
      setActiveSheetIndex(0)
    }
  }, [entityId, script?.content])

  // 监听文本选中
  const handleSelect = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      const selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)
      setSelectedText(selected)
    }
  }, [])

  // 保存内容到store
  const handleSave = () => {
    if (script) {
      updateScript(entityId, { content })
    }
  }

  // AI分析剧本结构
  const handleParseStructure = async () => {
    if (!script) return
    setIsParsing(true)
    // 先保存当前内容
    updateScript(entityId, { content })
    await parseScriptStructure(entityId)
    setIsParsing(false)
    // AI副驾反馈
    addMessage({
      role: 'assistant',
      content: `✅ **剧本结构分析完成！**\n\n从「${script.name}」中检测到：\n- 📖 **2 个章节**，共 3 个场景\n- 👤 **4 个角色**：秦羽、秦德、凌雪、神秘老者\n- 🏔 **4 个场景**：后山悬崖、镇国公府餐厅、后山密林、青云山\n\n**下一步建议：**\n1. 选中一段场景描述 → 点击「拆解分镜」\n2. 或让我为检测到的角色自动创建角色卡`,
      mode: 'chat',
      status: 'completed',
    })
  }

  // 拆解选中文本为分镜
  const handleGeneratePanels = async () => {
    if (!selectedText.trim() || !script) return
    setIsGeneratingPanels(true)
    const sbId = await generatePanelFromScript(entityId, selectedText)
    setIsGeneratingPanels(false)
    // 自动打开分镜编辑器Tab
    openTab({
      type: 'storyboard_edit',
      title: `分镜 - ${selectedText.slice(0, 15)}...`,
      entityId: sbId,
      isDirty: false,
    })
    // AI副驾反馈
    addMessage({
      role: 'assistant',
      content: `⚡ **分镜拆解完成！**\n\n已将选中文本拆解为 **5 个分镜面板**：\n1. 远景：场景全貌\n2. 中景：角色入场\n3. 近景：表情特写\n4. 动态：冲突爆发\n5. 定格：悬念收尾\n\n已自动打开分镜编辑器，你可以：\n- 调整分镜描述和顺序\n- 为每个分镜关联角色和场景\n- 生成分镜提示词 → 生图`,
      mode: 'action',
      status: 'completed',
    })
  }

  const parsed = script?.parsedStructure

  if (!script) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        剧本不存在
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#111]">
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
            <Heading1 className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
            <Heading2 className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <button className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
            <Bold className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
            <Italic className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <button className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
            <List className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
            <AlignLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* AI分析结构按钮 */}
          <button 
            onClick={handleParseStructure}
            disabled={isParsing}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              isParsing 
                ? 'text-gray-500 cursor-wait' 
                : parsed 
                  ? 'text-green-400 hover:bg-green-500/10'
                  : 'text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            {isParsing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : parsed ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span className="text-sm">{isParsing ? '分析中...' : parsed ? '已分析' : 'AI 分析结构'}</span>
          </button>

          {/* 拆解分镜按钮 */}
          <button 
            onClick={handleGeneratePanels}
            disabled={!selectedText.trim() || isGeneratingPanels}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              selectedText.trim() && !isGeneratingPanels
                ? 'text-violet-400 hover:bg-violet-500/10'
                : 'text-gray-600 cursor-not-allowed'
            }`}
          >
            {isGeneratingPanels ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Scissors className="w-4 h-4" />
            )}
            <span className="text-sm">
              {isGeneratingPanels ? '拆解中...' : selectedText ? '拆解选中文本为分镜' : '选中文本后拆解分镜'}
            </span>
          </button>

          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>

      {/* AI解析结构结果条 */}
      {parsed && (
        <div className="flex items-center gap-4 px-6 py-2 border-b border-white/5 bg-[#0d0d0d]">
          <div className="flex items-center gap-2 text-xs">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-gray-400">{parsed.chapters.length} 章 · {parsed.chapters.reduce((sum, ch) => sum + ch.scenes.length, 0)} 场景</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2 text-xs">
            <Users className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-gray-400">
              {parsed.detectedCharacters.slice(0, 3).join('、')}
              {parsed.detectedCharacters.length > 3 && ` +${parsed.detectedCharacters.length - 3}`}
            </span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2 text-xs">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-gray-400">
              {parsed.detectedLocations.slice(0, 3).join('、')}
              {parsed.detectedLocations.length > 3 && ` +${parsed.detectedLocations.length - 3}`}
            </span>
          </div>
        </div>
      )}

      {/* 选中文本提示条 */}
      {selectedText && (
        <div className="flex items-center gap-3 px-6 py-2 border-b border-violet-500/20 bg-violet-500/5">
          <LayoutList className="w-4 h-4 text-violet-400" />
          <span className="text-xs text-violet-400">
            已选中 {selectedText.length} 字 — 
          </span>
          <button
            onClick={handleGeneratePanels}
            disabled={isGeneratingPanels}
            className="text-xs text-violet-300 underline hover:text-violet-200 transition-colors"
          >
            点击拆解为分镜
          </button>
        </div>
      )}

      {/* 视图切换按钮条（仅Excel剧本显示） */}
      {hasExcel && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-white/5 bg-[#0e0e0e]">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-violet-600/20 text-violet-300 ring-1 ring-violet-500/30'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            表格视图
          </button>
          <button
            onClick={() => setViewMode('text')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'text'
                ? 'bg-violet-600/20 text-violet-300 ring-1 ring-violet-500/30'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            文本视图
          </button>
          {viewMode === 'table' && script?.excelSheets && script.excelSheets.length > 1 && (
            <>
              <div className="w-px h-4 bg-white/10 mx-1" />
              {script.excelSheets.map((sheet, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSheetIndex(idx)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    idx === activeSheetIndex
                      ? 'bg-white/10 text-white'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {sheet.name}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* 编辑区域 */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'table' && hasExcel ? (
          <ExcelTableView sheets={script!.excelSheets!} activeSheetIndex={activeSheetIndex} />
        ) : (
          <div className="max-w-4xl mx-auto p-8">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => { setContent(e.target.value) }}
              onSelect={handleSelect}
              onMouseUp={handleSelect}
              className="w-full min-h-[600px] bg-transparent text-gray-200 outline-none resize-none leading-relaxed"
              placeholder="开始编写剧本，或从左侧上传剧本文件..."
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
            />
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="flex items-center justify-between px-6 py-2 border-t border-white/5 bg-[#111] text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>字数：{content.length}</span>
          {parsed && (
            <>
              <span>章节：{parsed.chapters.length}</span>
              <span>场景：{parsed.chapters.reduce((sum, ch) => sum + ch.scenes.length, 0)}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>{script.name}</span>
          <span>已保存</span>
        </div>
      </div>
    </div>
  )
}

// Excel 表格预览组件
function ExcelTableView({ sheets, activeSheetIndex }: { sheets: ExcelSheet[]; activeSheetIndex: number }) {
  const sheet = sheets[activeSheetIndex]
  if (!sheet || sheet.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>该工作表无数据</p>
      </div>
    )
  }

  const headers = sheet.data[0] || []
  const rows = sheet.data.slice(1)
  // 计算最大列数（有些行可能列数不一致）
  const maxCols = Math.max(...sheet.data.map(row => row.length))

  return (
    <div className="p-4">
      <div className="rounded-lg border border-white/10 overflow-hidden">
        <div className="overflow-auto max-h-[calc(100vh-280px)]">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#1a1a2e]">
                {/* 行号列 */}
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 border-b border-r border-white/10 w-12 bg-[#1a1a2e]">
                  #
                </th>
                {Array.from({ length: maxCols }, (_, i) => (
                  <th
                    key={i}
                    className="px-4 py-2.5 text-left text-xs font-semibold text-violet-300 border-b border-r border-white/10 bg-[#1a1a2e] whitespace-nowrap"
                  >
                    {headers[i] != null ? String(headers[i]) : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => {
                const isEmpty = !row || row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')
                return (
                  <tr
                    key={rowIdx}
                    className={`transition-colors ${
                      isEmpty
                        ? 'opacity-40'
                        : rowIdx % 2 === 0
                          ? 'bg-[#111] hover:bg-white/5'
                          : 'bg-[#0d0d0d] hover:bg-white/5'
                    }`}
                  >
                    <td className="px-3 py-2 text-xs text-gray-600 border-b border-r border-white/5 text-center font-mono">
                      {rowIdx + 1}
                    </td>
                    {Array.from({ length: maxCols }, (_, colIdx) => {
                      const cell = row[colIdx]
                      const cellStr = cell != null ? String(cell) : ''
                      return (
                        <td
                          key={colIdx}
                          className="px-4 py-2 text-gray-300 border-b border-r border-white/5 max-w-[320px]"
                          title={cellStr}
                        >
                          <span className="block truncate">{cellStr}</span>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 px-1 text-xs text-gray-500">
        <span>工作表：{sheet.name}</span>
        <span>{rows.length} 行 × {maxCols} 列</span>
      </div>
    </div>
  )
}
