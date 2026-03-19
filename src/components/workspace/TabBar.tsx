import { useCallback, useState, useRef, useEffect } from 'react'
import { X, Plus, Columns, Rows, MoreHorizontal } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { getDocumentIcon } from '../../store/documentHelpers'
import type { PaneLeaf } from '../../store/workspaceTypes'

interface TabBarProps {
  leaf: PaneLeaf
}

export default function TabBar({ leaf }: TabBarProps) {
  const { setActiveTab, closeTab, setActivePaneId, activePaneId, splitPane } = useWorkspaceStore()

  // 新标签页 → 打开一个 welcome 类型的 tab
  const handleNewTab = useCallback(() => {
    const { openDocument } = useWorkspaceStore.getState()
    openDocument({ type: 'welcome', id: `welcome_${Date.now()}` }, leaf.id)
  }, [leaf.id])

  // 三个点下拉菜单（fixed 定位，避免被 overflow 裁剪）
  const [splitMenuPos, setSplitMenuPos] = useState<{ x: number; y: number } | null>(null)
  const splitMenuRef = useRef<HTMLDivElement>(null)
  const splitBtnRef = useRef<HTMLButtonElement>(null)

  // 标签页右键菜单
  const [tabContextMenu, setTabContextMenu] = useState<{
    x: number; y: number; tabIndex: number
  } | null>(null)
  const tabContextMenuRef = useRef<HTMLDivElement>(null)

  // 关闭三个点菜单
  useEffect(() => {
    if (!splitMenuPos) return
    const handler = (e: MouseEvent) => {
      if (splitMenuRef.current && !splitMenuRef.current.contains(e.target as Node) &&
          splitBtnRef.current && !splitBtnRef.current.contains(e.target as Node)) {
        setSplitMenuPos(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [splitMenuPos])

  // 关闭标签页右键菜单
  useEffect(() => {
    if (!tabContextMenu) return
    const handler = (e: MouseEvent) => {
      if (tabContextMenuRef.current && !tabContextMenuRef.current.contains(e.target as Node)) {
        setTabContextMenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [tabContextMenu])

  const handleTabClick = useCallback((index: number) => {
    setActiveTab(leaf.id, index)
    setActivePaneId(leaf.id)
  }, [leaf.id, setActiveTab, setActivePaneId])

  const handleClose = useCallback((e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    closeTab(leaf.id, index)
  }, [leaf.id, closeTab])

  const handleMouseDown = useCallback((e: React.MouseEvent, index: number) => {
    if (e.button === 1) {
      e.preventDefault()
      closeTab(leaf.id, index)
    }
  }, [leaf.id, closeTab])

  // 三个点按钮点击 → 计算按钮位置，用 fixed 定位显示菜单
  const handleSplitBtnClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (splitMenuPos) {
      setSplitMenuPos(null)
      return
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setSplitMenuPos({ x: rect.right, y: rect.bottom + 4 })
  }, [splitMenuPos])

  const handleSplit = useCallback((direction: 'horizontal' | 'vertical') => {
    splitPane(leaf.id, direction)
    setSplitMenuPos(null)
  }, [leaf.id, splitPane])

  // 标签页右键菜单
  const handleTabContextMenu = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault()
    setActivePaneId(leaf.id)
    setActiveTab(leaf.id, index)
    setTabContextMenu({ x: e.clientX, y: e.clientY, tabIndex: index })
  }, [leaf.id, setActivePaneId, setActiveTab])

  // 渲染分屏下拉菜单（共用）
  const renderSplitMenu = () => splitMenuPos && (
    <div
      ref={splitMenuRef}
      className="fixed z-[100] bg-white rounded-lg shadow-lg border border-apple-border-light py-1 min-w-[140px]"
      style={{ left: splitMenuPos.x, top: splitMenuPos.y, transform: 'translateX(-100%)' }}
    >
      <button
        onClick={() => handleSplit('horizontal')}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-apple-text hover:bg-apple-bg-secondary transition-colors"
      >
        <Columns size={13} />
        左右分屏
      </button>
      <button
        onClick={() => handleSplit('vertical')}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-apple-text hover:bg-apple-bg-secondary transition-colors"
      >
        <Rows size={13} />
        上下分屏
      </button>
    </div>
  )

  // 渲染标签页右键菜单
  const renderTabContextMenu = () => tabContextMenu && (
    <div
      ref={tabContextMenuRef}
      className="fixed z-[100] bg-white rounded-lg shadow-lg border border-apple-border-light py-1 min-w-[160px]"
      style={{ left: tabContextMenu.x, top: tabContextMenu.y }}
    >
      <button
        onClick={() => { closeTab(leaf.id, tabContextMenu.tabIndex); setTabContextMenu(null) }}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-apple-text hover:bg-apple-bg-secondary transition-colors"
      >
        <X size={13} />
        关闭
      </button>
      <div className="h-px bg-apple-border-light my-1" />
      <button
        onClick={() => { splitPane(leaf.id, 'horizontal'); setTabContextMenu(null) }}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-apple-text hover:bg-apple-bg-secondary transition-colors"
      >
        <Columns size={13} />
        左右分屏
      </button>
      <button
        onClick={() => { splitPane(leaf.id, 'vertical'); setTabContextMenu(null) }}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-apple-text hover:bg-apple-bg-secondary transition-colors"
      >
        <Rows size={13} />
        上下分屏
      </button>
    </div>
  )

  // 渲染单个标签
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTab = (label: string, isActiveTab: boolean, index: number, icon?: any, dirty?: boolean) => {
    const Icon = icon
    return (
      <div
        key={index}
        onClick={() => handleTabClick(index)}
        onMouseDown={(e) => handleMouseDown(e, index)}
        onContextMenu={(e) => handleTabContextMenu(e, index)}
        className={`group relative flex items-center gap-1.5 h-full px-3 text-[12px] cursor-pointer whitespace-nowrap select-none transition-colors border-r border-apple-border-light ${
          isActiveTab
            ? 'bg-white text-apple-text font-medium'
            : 'text-apple-text-secondary hover:bg-white/50'
        }`}
      >
        {Icon && <Icon size={13} className="flex-shrink-0 text-apple-text-tertiary" />}
        <span className="truncate max-w-[160px]">{label}</span>
        {dirty && <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />}
        <button
          onClick={(e) => handleClose(e, index)}
          className={`flex-shrink-0 p-0.5 rounded hover:bg-black/10 transition-all ${
            isActiveTab ? 'opacity-50 hover:opacity-100' : 'opacity-0 group-hover:opacity-50 group-hover:hover:opacity-100'
          }`}
        >
          <X size={12} />
        </button>
      </div>
    )
  }

  if (leaf.tabs.length === 0) {
    // 空标签栏 — 显示"新标签页"占位标签
    return (
      <div
        className="flex items-stretch h-[36px] bg-[#f0f0f0] border-b border-apple-border-light flex-shrink-0"
        onClick={() => setActivePaneId(leaf.id)}
      >
        <div className="flex items-stretch flex-1 min-w-0">
          {/* 新标签页占位 */}
          <div className="flex items-center gap-1.5 h-full px-3 bg-white text-apple-text font-medium text-[12px] border-r border-apple-border-light">
            <span>新标签页</span>
            <button className="flex-shrink-0 p-0.5 rounded hover:bg-black/10 transition-all opacity-50 hover:opacity-100">
              <X size={12} />
            </button>
          </div>
          {/* + 按钮 */}
          <button onClick={handleNewTab} className="flex items-center justify-center w-[36px] h-full hover:bg-white/50 transition-colors">
            <Plus size={14} className="text-apple-text-tertiary" />
          </button>
        </div>
        {renderSplitMenu()}
      </div>
    )
  }

  return (
    <div
      className="flex items-stretch h-[36px] bg-[#f0f0f0] border-b border-apple-border-light flex-shrink-0"
      onClick={() => setActivePaneId(leaf.id)}
    >
      <div className="flex items-stretch flex-1 min-w-0 overflow-x-auto scrollbar-none">
        {leaf.tabs.map((tab, i) => {
          const Icon = getDocumentIcon(tab.docId)
          const isActiveTab = i === leaf.activeTabIndex
          return renderTab(tab.label, isActiveTab, i, Icon, tab.dirty)
        })}
        {/* + 新标签页按钮 */}
        <button onClick={handleNewTab} className="flex items-center justify-center w-[36px] flex-shrink-0 hover:bg-white/50 transition-colors">
          <Plus size={14} className="text-apple-text-tertiary" />
        </button>
      </div>

      {renderSplitMenu()}
      {renderTabContextMenu()}
    </div>
  )
}
