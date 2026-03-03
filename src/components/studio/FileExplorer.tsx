import { useState, useRef, useCallback } from 'react'
import {
  ChevronRight, ChevronDown, Folder, Film, User, MapPin, FileText,
  Plus, Search, Upload, LayoutList, Trash2, Pencil, Copy, FolderPlus,
  FilePlus, MoreHorizontal, Image, Music, Video, Sparkles, LayoutGrid
} from 'lucide-react'
import { useProjectStore, type IPProject, type Season, type Episode } from '../../store'
import { useCopilotStore } from '../../store/copilotStore'
import * as XLSX from 'xlsx'
import mammoth from 'mammoth'
import ContextMenu, { type ContextMenuItem } from './ContextMenu'

interface FileExplorerProps {
  project: IPProject
  collapsed: boolean
  onOpenFile: (type: string, id: string, name: string) => void
}

interface RenameState { id: string; value: string }

export default function FileExplorer({ project, collapsed, onOpenFile }: FileExplorerProps) {
  const {
    characters, environments, scripts, storyboards,
    addScript, deleteScript, updateScript,
    addSeason, deleteSeason, renameSeason,
    addEpisode, deleteEpisode, duplicateEpisode, updateEpisode,
    addCharacter, deleteCharacter, updateCharacter, duplicateCharacter,
    addEnvironment, deleteEnvironment, updateEnvironment, duplicateEnvironment,
    deleteStoryboard,
    queueCanvasImport, setActiveTab, openTabs, activeTabId, closeTab,
  } = useProjectStore()

  // 在画布中打开素材：关闭当前编辑器 Tab，切到全局画布，排入导入队列
  const openInCanvas = (sourceType: 'script' | 'character' | 'environment' | 'storyboard', sourceId: string, sourceName: string) => {
    // 如果当前有活跃的编辑器 Tab，切到全局画布（取消选中任何 Tab）
    const store = useProjectStore.getState()
    if (store.activeTabId) {
      // 不关闭 tab，只是取消激活，让 WorkCanvas 显示画布
      useProjectStore.setState({ activeTabId: null })
    }
    queueCanvasImport({ sourceType, sourceId, sourceName })
  }
  const { addMessage } = useCopilotStore()

  const [expanded, setExpanded] = useState<Set<string>>(new Set(['scripts', 'episodes', 'characters', 'environments']))
  const [searchQuery, setSearchQuery] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [menu, setMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null)
  const [renaming, setRenaming] = useState<RenameState | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const renameRef = useRef<HTMLInputElement>(null)

  const toggle = (key: string) => {
    const n = new Set(expanded)
    n.has(key) ? n.delete(key) : n.add(key)
    setExpanded(n)
  }

  const showMenu = (e: React.MouseEvent, items: ContextMenuItem[]) => { e.preventDefault(); e.stopPropagation(); setMenu({ x: e.clientX, y: e.clientY, items }) }
  const startRename = (id: string, name: string) => { setRenaming({ id, value: name }); setTimeout(() => renameRef.current?.focus(), 50) }
  const commitRename = (fn: (v: string) => void) => { if (renaming?.value.trim()) fn(renaming.value.trim()); setRenaming(null) }

  // ========== 文件解析 ==========
  const parseExcel = (data: ArrayBuffer, fileName: string) => {
    const wb = XLSX.read(data, { type: 'array' })
    const lines: string[] = []
    const sheets: import('../../store/types').ExcelSheet[] = []
    wb.SheetNames.forEach(sn => {
      const s = wb.Sheets[sn]
      const json = XLSX.utils.sheet_to_json<any[]>(s, { header: 1 })
      if (!json.length) return
      sheets.push({ name: sn, data: json.map((r: any[]) => (r || []).map(c => c ?? null)) })
      if (wb.SheetNames.length > 1) { lines.push(`## ${sn}`, '') }
      const hdr = (json[0] as any[]).map(h => String(h || '').trim())
      for (let i = 1; i < json.length; i++) {
        const row = json[i] as any[]
        if (!row || row.every(c => !c)) continue
        const parts: string[] = []
        hdr.forEach((h, ci) => { const v = row[ci]; if (v != null && String(v).trim()) parts.push(`- ${h}：${String(v).trim()}`) })
        if (parts.length) { lines.push(row[0] ? `### 分镜 ${row[0]}` : `### 分镜 ${i}`, ...parts, '') }
      }
    })
    return { content: lines.join('\n'), excelSheets: sheets }
  }

  const parseWord = async (buf: ArrayBuffer) => (await mammoth.extractRawText({ arrayBuffer: buf })).value

  const handleUpload = useCallback((files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(async file => {
      const isXls = /\.(xlsx|xls)$/i.test(file.name)
      const isDoc = /\.docx?$/i.test(file.name)
      const name = file.name.replace(/\.(txt|md|docx?|xlsx|xls)$/i, '')
      if (isXls) {
        const r = new FileReader()
        r.onload = e => {
          const { content, excelSheets } = parseExcel(e.target?.result as ArrayBuffer, file.name)
          const id = addScript({ name, fileName: file.name, content, excelSheets })
          onOpenFile('script', id, name)
          addMessage({ role: 'assistant', content: `📊 Excel **${file.name}** 已导入（${content.length}字）`, mode: 'chat', status: 'completed' })
        }
        r.readAsArrayBuffer(file)
      } else if (isDoc) {
        const r = new FileReader()
        r.onload = async e => {
          try {
            const content = await parseWord(e.target?.result as ArrayBuffer)
            const id = addScript({ name, fileName: file.name, content })
            onOpenFile('script', id, name)
            addMessage({ role: 'assistant', content: `📝 Word **${file.name}** 已导入（${content.length}字）`, mode: 'chat', status: 'completed' })
          } catch { addMessage({ role: 'assistant', content: `❌ **${file.name}** 解析失败`, mode: 'chat', status: 'completed' }) }
        }
        r.readAsArrayBuffer(file)
      } else {
        const r = new FileReader()
        r.onload = e => {
          const content = e.target?.result as string
          const id = addScript({ name, fileName: file.name, content })
          onOpenFile('script', id, name)
          addMessage({ role: 'assistant', content: `📄 **${file.name}** 已导入（${content.length}字）`, mode: 'chat', status: 'completed' })
        }
        r.readAsText(file)
      }
    })
  }, [addScript, addMessage, onOpenFile])

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); if (e.dataTransfer.types.includes('Files')) setIsDragOver(true) }, [])
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false) }, [])
  const onDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); handleUpload(e.dataTransfer.files) }, [handleUpload])

  // ========== 内联重命名输入 ==========
  const RenameInput = ({ id, onCommit }: { id: string; onCommit: (v: string) => void }) => {
    if (renaming?.id !== id) return null
    return (
      <input ref={renameRef} value={renaming.value}
        onChange={e => setRenaming({ ...renaming, value: e.target.value })}
        onBlur={() => commitRename(onCommit)}
        onKeyDown={e => { if (e.key === 'Enter') commitRename(onCommit); if (e.key === 'Escape') setRenaming(null) }}
        onClick={e => e.stopPropagation()}
        className="flex-1 bg-white/10 border border-violet-500/50 rounded px-1.5 py-0.5 text-sm text-white outline-none min-w-0"
      />
    )
  }

  // ========== 折叠态 ==========
  if (collapsed) {
    return (
      <div className="w-12 bg-[#111] border-r border-white/5 flex flex-col items-center py-3 gap-2">
        <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5" title="上传"><Upload className="w-5 h-5" /></button>
        <div className="w-6 h-px bg-white/5 my-1" />
        <button className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5" title="脚本"><FileText className="w-4 h-4" /></button>
        <button className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5" title="剧集"><Film className="w-4 h-4" /></button>
        <button className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5" title="角色"><User className="w-4 h-4" /></button>
        <button className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5" title="场景"><MapPin className="w-4 h-4" /></button>
        <input ref={fileInputRef} type="file" accept=".txt,.md,.doc,.docx,.xlsx,.xls" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />
      </div>
    )
  }

  // ========== 展开态 ==========
  return (
    <div className={`w-72 bg-[#111] border-r flex flex-col overflow-hidden flex-shrink-0 transition-colors ${isDragOver ? 'border-violet-500 bg-violet-500/5' : 'border-white/5'}`}
      onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      {menu && <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} />}
      <input ref={fileInputRef} type="file" accept=".txt,.md,.doc,.docx,.xlsx,.xls" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />

      {/* 搜索栏 */}
      <div className="p-3 border-b border-white/5">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder="搜索文件..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-300 placeholder-gray-600 outline-none focus:border-violet-500/50" />
        </div>
      </div>

      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-violet-500/10 border-2 border-dashed border-violet-500 rounded-xl flex items-center justify-center pointer-events-none">
          <div className="text-center"><Upload className="w-10 h-10 text-violet-400 mx-auto mb-2" /><p className="text-violet-400 text-sm font-medium">释放以上传</p></div>
        </div>
      )}

      {/* 文件树 */}
      <div className="flex-1 overflow-y-auto">

        {/* ========== 脚本 / 大纲 ========== */}
        <Section title="脚本 / 大纲" icon={FileText} expanded={expanded.has('scripts')} onToggle={() => toggle('scripts')}
          onAdd={() => fileInputRef.current?.click()} addTooltip="上传脚本">
          {scripts.length === 0 ? (
            <EmptyDrop onClick={() => fileInputRef.current?.click()} text="上传或拖拽脚本" sub="支持 .txt .md .docx .xlsx" />
          ) : (
            <>
              {scripts.map(s => (
                <FileItem key={s.id} icon={FileText} iconColor="text-amber-400" name={s.name} badge={`${s.wordCount}字`}
                  status={s.parsedStructure ? '已解析' : undefined} statusColor="text-green-400 bg-green-500/20"
                  onClick={() => onOpenFile('script', s.id, s.name)}
                  onContextMenu={e => showMenu(e, [
                    { label: '在画布中打开', icon: LayoutGrid, onClick: () => openInCanvas('script', s.id, s.name) },
                    { label: '重命名', icon: Pencil, onClick: () => startRename(s.id, s.name), divider: true },
                    { label: '删除', icon: Trash2, onClick: () => deleteScript(s.id), danger: true, divider: true },
                  ])}
                  onDoubleClick={() => startRename(s.id, s.name)}
                  renaming={renaming?.id === s.id ? renaming : null}
                  RenameInput={<RenameInput id={s.id} onCommit={v => updateScript(s.id, { name: v })} />}
                />
              ))}
              <div className="flex items-center gap-2 px-4 py-1.5 hover:bg-white/5 cursor-pointer text-gray-600 hover:text-violet-400" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-3.5 h-3.5" /><span className="text-xs">上传更多...</span>
              </div>
            </>
          )}
          {storyboards.length > 0 && (
            <div className="mt-1 pt-1 border-t border-white/5">
              <div className="px-4 py-1 text-[10px] text-gray-600 uppercase tracking-wider">分镜</div>
              {storyboards.map(sb => (
                <FileItem key={sb.id} icon={LayoutList} iconColor="text-violet-400" name={sb.name} badge={`${sb.panels.length}镜`}
                  onClick={() => onOpenFile('storyboard', sb.id, sb.name)}
                  onContextMenu={e => showMenu(e, [
                    { label: '删除', icon: Trash2, onClick: () => deleteStoryboard(sb.id), danger: true },
                  ])}
                />
              ))}
            </div>
          )}
        </Section>

        {/* ========== 剧集目录 ========== */}
        <Section title="剧集目录" icon={Film} expanded={expanded.has('episodes')} onToggle={() => toggle('episodes')}
          onAdd={() => addSeason()} addTooltip="新建季">
          {project.seasons.map(season => (
            <div key={season.id}>
              <div className="flex items-center gap-2 px-4 py-1.5 hover:bg-white/5 cursor-pointer"
                onClick={() => toggle(`season-${season.id}`)}
                onContextMenu={e => showMenu(e, [
                  { label: '新建剧集', icon: FilePlus, onClick: () => addEpisode(season.id) },
                  { label: '重命名', icon: Pencil, onClick: () => startRename(season.id, season.name) },
                  { label: '删除季', icon: Trash2, onClick: () => deleteSeason(season.id), danger: true, divider: true },
                ])}>
                {expanded.has(`season-${season.id}`) ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
                <Folder className="w-4 h-4 text-amber-400" />
                {renaming?.id === season.id
                  ? <RenameInput id={season.id} onCommit={v => renameSeason(season.id, v)} />
                  : <span className="text-sm text-gray-300 flex-1 truncate">{season.name}</span>}
                <span className="text-xs text-gray-600 ml-auto flex-shrink-0">{season.episodes.length} 集</span>
              </div>
              {expanded.has(`season-${season.id}`) && (
                <div className="ml-4">
                  {season.episodes.map(ep => (
                    <div key={ep.id} className="flex items-center gap-2 px-4 py-1.5 hover:bg-white/5 cursor-pointer"
                      onClick={() => onOpenFile('episode', ep.id, ep.name)}
                      onContextMenu={e => showMenu(e, [
                        { label: '重命名', icon: Pencil, onClick: () => startRename(ep.id, ep.name) },
                        { label: '复制', icon: Copy, onClick: () => duplicateEpisode(ep.id) },
                        { label: '删除', icon: Trash2, onClick: () => deleteEpisode(ep.id), danger: true, divider: true },
                      ])}>
                      <Film className="w-3.5 h-3.5 text-gray-500" />
                      {renaming?.id === ep.id
                        ? <RenameInput id={ep.id} onCommit={v => updateEpisode(ep.id, { name: v })} />
                        : <span className="text-sm text-gray-400 truncate flex-1">{ep.name}</span>}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${ep.status === 'completed' ? 'bg-green-500/20 text-green-400' : ep.status === 'in_progress' ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {ep.status === 'completed' ? '已完成' : ep.status === 'in_progress' ? '进行中' : '草稿'}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 px-4 py-1.5 hover:bg-white/5 cursor-pointer text-gray-600 hover:text-violet-400"
                    onClick={e => { e.stopPropagation(); addEpisode(season.id) }}>
                    <Plus className="w-3.5 h-3.5" /><span className="text-xs">新建剧集</span>
                  </div>
                </div>
              )}
            </div>
          ))}
          {project.seasons.length === 0 && <EmptyDrop onClick={() => addSeason()} text="点击新建季" icon={<FolderPlus className="w-6 h-6" />} />}
        </Section>

        {/* ========== 角色库 ========== */}
        <Section title="角色库" icon={User} expanded={expanded.has('characters')} onToggle={() => toggle('characters')}
          onAdd={() => addCharacter({ name: '新角色', description: '', referenceImages: [], prompt: '', tags: [] })} addTooltip="新建角色">
          {characters.map(c => (
            <FileItem key={c.id} name={c.name} badge={c.tags.slice(0, 2).join('、')}
              icon={User} iconColor="text-violet-400" avatarBg="from-violet-500 to-purple-600" avatarText={c.name[0]}
              onClick={() => onOpenFile('character', c.id, c.name)}
              onContextMenu={e => showMenu(e, [
                { label: '在画布中打开', icon: LayoutGrid, onClick: () => openInCanvas('character', c.id, c.name) },
                { label: '重命名', icon: Pencil, onClick: () => startRename(c.id, c.name), divider: true },
                { label: '复制', icon: Copy, onClick: () => duplicateCharacter(c.id) },
                { label: '删除', icon: Trash2, onClick: () => deleteCharacter(c.id), danger: true, divider: true },
              ])}
              onDoubleClick={() => startRename(c.id, c.name)}
              renaming={renaming?.id === c.id ? renaming : null}
              RenameInput={<RenameInput id={c.id} onCommit={v => updateCharacter(c.id, { name: v })} />}
            />
          ))}
          {characters.length === 0 && <div className="px-4 py-3 text-xs text-gray-600">点击 + 新建或从脚本提取</div>}
        </Section>

        {/* ========== 场景道具库 ========== */}
        <Section title="场景与道具" icon={MapPin} expanded={expanded.has('environments')} onToggle={() => toggle('environments')}
          onAdd={() => addEnvironment({ name: '新场景', description: '', referenceImages: [], prompt: '', tags: [] })} addTooltip="新建场景">
          {environments.map(env => (
            <FileItem key={env.id} name={env.name} badge={env.tags.slice(0, 2).join('、')}
              icon={MapPin} iconColor="text-cyan-400" avatarBg="from-cyan-500 to-blue-600"
              onClick={() => onOpenFile('environment', env.id, env.name)}
              onContextMenu={e => showMenu(e, [
                { label: '在画布中打开', icon: LayoutGrid, onClick: () => openInCanvas('environment', env.id, env.name) },
                { label: '重命名', icon: Pencil, onClick: () => startRename(env.id, env.name), divider: true },
                { label: '复制', icon: Copy, onClick: () => duplicateEnvironment(env.id) },
                { label: '删除', icon: Trash2, onClick: () => deleteEnvironment(env.id), danger: true, divider: true },
              ])}
              onDoubleClick={() => startRename(env.id, env.name)}
              renaming={renaming?.id === env.id ? renaming : null}
              RenameInput={<RenameInput id={env.id} onCommit={v => updateEnvironment(env.id, { name: v })} />}
            />
          ))}
          {environments.length === 0 && <div className="px-4 py-3 text-xs text-gray-600">点击 + 新建或从脚本提取</div>}
        </Section>
      </div>
    </div>
  )
}

// ========== 子组件 ==========

function Section({ title, icon: Icon, expanded, onToggle, onAdd, addTooltip, children }: {
  title: string; icon: React.ElementType; expanded: boolean; onToggle: () => void; onAdd: () => void; addTooltip?: string; children: React.ReactNode
}) {
  return (
    <div className="border-b border-white/5">
      <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-white/5 cursor-pointer" onClick={onToggle}>
        {expanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-300 flex-1">{title}</span>
        <button onClick={e => { e.stopPropagation(); onAdd() }} className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white" title={addTooltip}>
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      {expanded && <div className="pb-2">{children}</div>}
    </div>
  )
}

function FileItem({ icon: Icon, iconColor, name, badge, status, statusColor, avatarBg, avatarText, onClick, onContextMenu, onDoubleClick, renaming, RenameInput }: {
  icon: React.ElementType; iconColor?: string; name: string; badge?: string; status?: string; statusColor?: string
  avatarBg?: string; avatarText?: string
  onClick: () => void; onContextMenu?: (e: React.MouseEvent) => void; onDoubleClick?: () => void
  renaming?: RenameState | null; RenameInput?: React.ReactNode
}) {
  return (
    <div className="group flex items-center gap-2 px-4 py-2 hover:bg-white/5 cursor-pointer transition-colors"
      onClick={onClick} onContextMenu={onContextMenu} onDoubleClick={e => { e.stopPropagation(); onDoubleClick?.() }}>
      {avatarBg ? (
        <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${avatarBg} flex items-center justify-center text-xs text-white flex-shrink-0`}>
          {avatarText || <Icon className="w-3 h-3" />}
        </div>
      ) : (
        <Icon className={`w-4 h-4 ${iconColor || 'text-gray-400'} flex-shrink-0`} />
      )}
      {renaming ? RenameInput : <span className="text-sm text-gray-300 truncate flex-1">{name}</span>}
      {badge && <span className="text-[10px] text-gray-600 flex-shrink-0">{badge}</span>}
      {status && <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${statusColor}`}>{status}</span>}
    </div>
  )
}

function EmptyDrop({ onClick, text, sub, icon }: { onClick: () => void; text: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <div className="mx-3 mb-2 py-5 border-2 border-dashed border-white/10 hover:border-violet-500/50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors group" onClick={onClick}>
      <div className="text-gray-600 group-hover:text-violet-400 transition-colors mb-1">{icon || <Upload className="w-7 h-7" />}</div>
      <span className="text-xs text-gray-600 group-hover:text-violet-400 transition-colors">{text}</span>
      {sub && <span className="text-[10px] text-gray-700 mt-0.5">{sub}</span>}
    </div>
  )
}
