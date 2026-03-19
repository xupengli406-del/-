import * as XLSX from 'xlsx'
import mammoth from 'mammoth'
import type { StoryboardImportData } from '../store/types'

// ─── 类型定义 ───

export type ParseResult =
  | { success: true; data: StoryboardImportData }
  | { success: false; error: string; fallbackText?: string }

type FileType = 'json' | 'excel' | 'word' | 'unknown'

// ─── 列名别名映射（支持中英文） ───

const FRAME_COLUMN_ALIASES: Record<string, string[]> = {
  index:       ['序号', 'index', '编号', 'no', '#', 'idx'],
  dialogue:    ['台词', '对话', 'dialogue', 'dialog', '对白'],
  characters:  ['角色', '人物', 'characters', 'character', '出场角色'],
  scene:       ['场景', 'scene', '场景名'],
  shot:        ['镜头', 'shot', '景别', '机位', '镜头类型'],
  description: ['描述', 'description', '画面描述', '说明', '画面', '分镜描述', '内容'],
}

const CHARACTER_COLUMN_ALIASES: Record<string, string[]> = {
  name:        ['名称', '角色名', 'name', '姓名'],
  description: ['描述', 'description', '说明', '角色描述'],
  tags:        ['标签', 'tags', 'tag', '关键词'],
}

const SCENE_COLUMN_ALIASES: Record<string, string[]> = {
  name:        ['名称', '场景名', 'name', '场景'],
  description: ['描述', 'description', '说明', '场景描述'],
}

// ─── 公共 API ───

export function detectFileType(fileName: string): FileType {
  const ext = fileName.toLowerCase().split('.').pop()
  if (ext === 'json') return 'json'
  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return 'excel'
  if (ext === 'docx') return 'word'
  return 'unknown'
}

export function parseExcelFile(buffer: ArrayBuffer, fileName: string): ParseResult {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' })

    // 1. 解析分镜帧（第一个 Sheet）
    const frameSheetName = workbook.SheetNames[0]
    if (!frameSheetName) {
      return { success: false, error: 'Excel 文件中没有工作表' }
    }
    const frameSheet = workbook.Sheets[frameSheetName]
    const frameRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(frameSheet)
    if (frameRows.length === 0) {
      return { success: false, error: 'Excel 文件中没有数据行' }
    }

    const headers = Object.keys(frameRows[0])
    const colMap = buildColumnMap(headers, FRAME_COLUMN_ALIASES)

    if (!colMap.dialogue && !colMap.description) {
      return { success: false, error: '未找到"台词"或"描述"列，请检查表头是否包含：台词、对话、描述、画面描述等' }
    }

    const frames = frameRows.map((row, i) => ({
      index: colMap.index ? Number(row[colMap.index]) || (i + 1) : (i + 1),
      dialogue: colMap.dialogue ? String(row[colMap.dialogue] ?? '') : '',
      characters: colMap.characters
        ? splitMultiValue(String(row[colMap.characters] ?? ''))
        : [],
      scene: colMap.scene ? String(row[colMap.scene] ?? '') : '',
      shot: colMap.shot ? String(row[colMap.shot] ?? '') : '',
      description: colMap.description ? String(row[colMap.description] ?? '') : '',
    }))

    // 2. 尝试从独立 Sheet 解析角色
    const characters = parseCharacterSheet(workbook) ?? extractCharactersFromFrames(frames)

    // 3. 尝试从独立 Sheet 解析场景
    const scenes = parseSceneSheet(workbook) ?? extractScenesFromFrames(frames)

    // 4. title 从文件名推断
    const title = fileName.replace(/\.(xlsx?|csv)$/i, '') || '导入的分镜脚本'

    return { success: true, data: { title, frames, characters, scenes } }
  } catch (e) {
    return { success: false, error: `Excel 解析失败: ${e instanceof Error ? e.message : '未知错误'}` }
  }
}

export async function parseWordFile(buffer: ArrayBuffer): Promise<ParseResult> {
  try {
    // 提取 HTML（保留表格结构）
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer: buffer })
    const html = htmlResult.value

    // 检查是否含表格
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const tables = doc.querySelectorAll('table')

    if (tables.length > 0) {
      return parseHtmlTable(tables[0])
    }

    // 纯文本回退
    const textResult = await mammoth.extractRawText({ arrayBuffer: buffer })
    return {
      success: false,
      fallbackText: textResult.value,
      error: '该 Word 文档为纯文本格式，已提取内容到编辑区。请手动整理为 JSON 格式后点击"解析"。',
    }
  } catch (e) {
    return { success: false, error: `Word 文件解析失败: ${e instanceof Error ? e.message : '未知错误'}` }
  }
}

// ─── 内部工具函数 ───

function buildColumnMap(headers: string[], aliasMap: Record<string, string[]>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [field, aliases] of Object.entries(aliasMap)) {
    const found = headers.find(h => {
      const normalized = h.trim().toLowerCase()
      return aliases.some(alias => normalized === alias.toLowerCase())
    })
    if (found) result[field] = found
  }
  return result
}

function splitMultiValue(value: string): string[] {
  return value.split(/[,，、;；\s]+/).filter(Boolean)
}

function extractCharactersFromFrames(frames: StoryboardImportData['frames']): StoryboardImportData['characters'] {
  const nameSet = new Set<string>()
  for (const f of frames) {
    for (const c of f.characters) {
      if (c.trim()) nameSet.add(c.trim())
    }
  }
  return Array.from(nameSet).map(name => ({ name, description: '' }))
}

function extractScenesFromFrames(frames: StoryboardImportData['frames']): StoryboardImportData['scenes'] {
  const nameSet = new Set<string>()
  for (const f of frames) {
    if (f.scene.trim()) nameSet.add(f.scene.trim())
  }
  return Array.from(nameSet).map(name => ({ name, description: '' }))
}

function findSheetByNames(workbook: XLSX.WorkBook, names: string[]): XLSX.WorkSheet | null {
  for (const sheetName of workbook.SheetNames) {
    const normalized = sheetName.trim().toLowerCase()
    if (names.some(n => normalized === n.toLowerCase())) {
      return workbook.Sheets[sheetName]
    }
  }
  return null
}

function parseCharacterSheet(workbook: XLSX.WorkBook): StoryboardImportData['characters'] | null {
  const sheet = findSheetByNames(workbook, ['角色', 'characters', '人物'])
  if (!sheet) return null

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)
  if (rows.length === 0) return null

  const headers = Object.keys(rows[0])
  const colMap = buildColumnMap(headers, CHARACTER_COLUMN_ALIASES)
  if (!colMap.name) return null

  return rows.map(row => ({
    name: String(row[colMap.name] ?? ''),
    description: colMap.description ? String(row[colMap.description] ?? '') : '',
    tags: colMap.tags ? splitMultiValue(String(row[colMap.tags] ?? '')) : [],
  })).filter(c => c.name.trim() !== '')
}

function parseSceneSheet(workbook: XLSX.WorkBook): StoryboardImportData['scenes'] | null {
  const sheet = findSheetByNames(workbook, ['场景', 'scenes'])
  if (!sheet) return null

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)
  if (rows.length === 0) return null

  const headers = Object.keys(rows[0])
  const colMap = buildColumnMap(headers, SCENE_COLUMN_ALIASES)
  if (!colMap.name) return null

  return rows.map(row => ({
    name: String(row[colMap.name] ?? ''),
    description: colMap.description ? String(row[colMap.description] ?? '') : '',
  })).filter(s => s.name.trim() !== '')
}

function parseHtmlTable(table: Element): ParseResult {
  const rows = Array.from(table.querySelectorAll('tr'))
  if (rows.length < 2) {
    return { success: false, error: 'Word 表格至少需要表头行和一行数据' }
  }

  const headerCells = Array.from(rows[0].querySelectorAll('th, td'))
  const headers = headerCells.map(cell => cell.textContent?.trim() || '')
  const colMap = buildColumnMap(headers, FRAME_COLUMN_ALIASES)

  if (!colMap.dialogue && !colMap.description) {
    return { success: false, error: '表格中未找到"台词"或"描述"列，请检查表头' }
  }

  const frames = rows.slice(1).map((row, i) => {
    const cells = Array.from(row.querySelectorAll('td'))
    const cellValues: Record<string, string> = {}
    headers.forEach((h, idx) => {
      cellValues[h] = cells[idx]?.textContent?.trim() || ''
    })
    return {
      index: colMap.index ? Number(cellValues[colMap.index]) || (i + 1) : (i + 1),
      dialogue: colMap.dialogue ? cellValues[colMap.dialogue] || '' : '',
      characters: colMap.characters
        ? splitMultiValue(cellValues[colMap.characters] || '')
        : [],
      scene: colMap.scene ? cellValues[colMap.scene] || '' : '',
      shot: colMap.shot ? cellValues[colMap.shot] || '' : '',
      description: colMap.description ? cellValues[colMap.description] || '' : '',
    }
  }).filter(f => f.dialogue || f.description) // 过滤空行

  if (frames.length === 0) {
    return { success: false, error: 'Word 表格中没有有效的分镜数据行' }
  }

  const characters = extractCharactersFromFrames(frames)
  const scenes = extractScenesFromFrames(frames)

  return {
    success: true,
    data: { title: '导入的分镜脚本', frames, characters, scenes },
  }
}
