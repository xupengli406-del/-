import { useCallback, useState, useRef, useEffect } from 'react'
import { X, Plus, Columns, Rows } from 'lucide-react'
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
      className="fixed z-[100] bg-white rounded-ds-lg shadow-ambient py-1 min-w-[140px]"
      style={{ left: splitMenuPos.x, top: splitMenuPos.y, transform: 'translateX(-100%)', border: '1px solid rgba(179,177,183,0.2)' }}
    >
      <button
        onClick={() => handleSplit('horizontal')}
        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-ds-on-surface hover:bg-ds-surface-container-low transition-colors"
      >
        <Columns size={13} />
        左右分屏
      </button>
      <button
        onClick={() => handleSplit('vertical')}
        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-ds-on-surface hover:bg-ds-surface-container-low transition-colors"
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
      className="fixed z-[100] bg-white rounded-ds-lg shadow-ambient py-1 min-w-[160px]"
      style={{ left: tabContextMenu.x, top: tabContextMenu.y, border: '1px solid rgba(179,177,183,0.2)' }}
    >
      <button
        onClick={() => { closeTab(leaf.id, tabContextMenu.tabIndex); setTabContextMenu(null) }}
        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-ds-on-surface hover:bg-ds-surface-container-low transition-colors"
      >
        <X size={13} />
        关闭
      </button>
      <div className="h-px bg-ds-surface-container-high my-1" />
      <button
        onClick={() => { splitPane(leaf.id, 'horizontal'); setTabContextMenu(null) }}
        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-ds-on-surface hover:bg-ds-surface-container-low transition-colors"
      >
        <Columns size={13} />
        左右分屏
      </button>
      <button
        onClick={() => { splitPane(leaf.id, 'vertical'); setTabContextMenu(null) }}
        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-ds-on-surface hover:bg-ds-surface-container-low transition-colors"
      >
        <Rows size={13} />
        上下分屏
      </button>
    </div>
  )

  return (
    <div className="flex-shrink-0" onClick={() => setActivePaneId(leaf.id)}>
      <div className="flex items-end h-10 px-2 bg-gray-50 border-b border-ds-outline-variant/20">
        <div className="flex items-end flex-1 min-w-0 overflow-x-auto scrollbar-none h-full">
          {leaf.tabs.map((tab, i) => {
            const Icon = getDocumentIcon(tab.docId)
            const isActiveTab = i === leaf.activeTabIndex
            return (
              <div
                key={i}
                onClick={() => handleTabClick(i)}
                onMouseDown={(e) => handleMouseDown(e, i)}
                onContextMenu={(e) => handleTabContextMenu(e, i)}
                className={`group relative flex items-center gap-1.5 h-8 px-4 mt-auto text-[11px] cursor-pointer whitespace-nowrap select-none transition-colors ${
                  isActiveTab
                    ? 'bg-white rounded-t-lg border border-ds-outline-variant/20 border-b-0 text-ds-on-surface font-medium'
                    : 'text-ds-on-surface-variant hover:bg-ds-surface-container-high/60 rounded-t-lg mb-0'
                }`}
              >
                {Icon && <Icon size={13} className="flex-shrink-0 text-ds-on-surface-variant" />}
                <span className="truncate max-w-[160px]">{tab.label}</span>
                {tab.dirty && <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />}
                <button
                  onClick={(e) => handleClose(e, i)}
                  className={`flex-shrink-0 ml-1 p-0.5 rounded hover:bg-ds-surface-container-high transition-all ${
                    isActiveTab ? 'opacity-60 hover:opacity-100' : 'opacity-0 group-hover:opacity-60 group-hover:hover:opacity-100'
                  }`}
                >
                  <X size={11} />
                </button>
              </div>
            )
          })}
          <button onClick={handleNewTab} className="flex items-center justify-center w-7 h-7 mb-0.5 ml-1 flex-shrink-0 rounded-md hover:bg-ds-surface-container-high transition-colors">
            <Plus size={14} className="text-ds-on-surface-variant opacity-60" />
          </button>
        </div>
        {renderSplitMenu()}
        {renderTabContextMenu()}
      </div>
    </div>
  )
}
