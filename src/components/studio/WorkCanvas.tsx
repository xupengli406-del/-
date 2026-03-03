import { useState, useCallback } from 'react'
import { X, Plus, FileText, Table2, User, MapPin, Film, LayoutGrid } from 'lucide-react'
import { useProjectStore } from '../../store'
import type { CanvasNode, CanvasEdge, WorkTab } from '../../store/types'
import NodeCanvas from './NodeCanvas'
import { ScriptEditor } from './editors'
import { EpisodeEditor } from './editors'
import { CharacterEditor } from './editors'
import { EnvironmentEditor } from './editors'

// Tab 类型对应的图标和颜色
const TAB_META: Record<string, { icon: React.ElementType; color: string }> = {
  script:          { icon: FileText, color: '#f59e0b' },
  episode:         { icon: Film,     color: '#3b82f6' },
  character:       { icon: User,     color: '#10b981' },
  environment:     { icon: MapPin,   color: '#8b5cf6' },
  storyboard:      { icon: LayoutGrid, color: '#ec4899' },
  storyboard_edit: { icon: LayoutGrid, color: '#ec4899' },
  frame:           { icon: Table2,   color: '#06b6d4' },
}

// 需要显示原文件编辑器的 Tab 类型（非画布）
const EDITOR_TAB_TYPES = new Set(['script', 'character', 'environment', 'episode'])

export default function WorkCanvas() {
  const { openTabs, activeTabId, closeTab, setActiveTab } = useProjectStore()

  // 全局画布状态（无 Tab 打开时，或画布类 Tab）
  const [tabCanvasStates, setTabCanvasStates] = useState<Record<string, { nodes: CanvasNode[]; edges: CanvasEdge[] }>>({})
  const [globalNodes, setGlobalNodes] = useState<CanvasNode[]>([])
  const [globalEdges, setGlobalEdges] = useState<CanvasEdge[]>([])

  const activeTab = openTabs.find(t => t.id === activeTabId)

  const getCanvasState = (tabId: string) => {
    if (!tabCanvasStates[tabId]) return { nodes: [], edges: [] }
    return tabCanvasStates[tabId]
  }

  const setCanvasNodes = useCallback((tabId: string | null, nodes: CanvasNode[]) => {
    if (!tabId) { setGlobalNodes(nodes); return }
    setTabCanvasStates(prev => ({ ...prev, [tabId]: { ...(prev[tabId] || { nodes: [], edges: [] }), nodes } }))
  }, [])

  const setCanvasEdges = useCallback((tabId: string | null, edges: CanvasEdge[]) => {
    if (!tabId) { setGlobalEdges(edges); return }
    setTabCanvasStates(prev => ({ ...prev, [tabId]: { ...(prev[tabId] || { nodes: [], edges: [] }), edges } }))
  }, [])

  const currentNodes = activeTab ? getCanvasState(activeTab.id).nodes : globalNodes
  const currentEdges = activeTab ? getCanvasState(activeTab.id).edges : globalEdges
  const currentTabId = activeTab?.id || null

  // 判断当前 Tab 是否应该显示编辑器（而不是画布）
  const showEditor = activeTab && EDITOR_TAB_TYPES.has(activeTab.type)

  // 渲染对应类型的编辑器
  const renderEditor = (tab: WorkTab) => {
    switch (tab.type) {
      case 'script':
        return <ScriptEditor entityId={tab.entityId} />
      case 'episode':
        return <EpisodeEditor entityId={tab.entityId} />
      case 'character':
        return <CharacterEditor entityId={tab.entityId} />
      case 'environment':
        return <EnvironmentEditor entityId={tab.entityId} />
      default:
        return null
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] overflow-hidden">
      {/* Tab 导航栏 */}
      {openTabs.length > 0 && (
        <div className="h-10 bg-[#111] border-b border-white/5 flex items-center overflow-x-auto scrollbar-hide">
          {openTabs.map(tab => {
            const meta = TAB_META[tab.type]
            const TabIcon = meta?.icon
            const isActive = tab.id === activeTabId
            return (
              <div key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center gap-2 px-4 h-full border-r border-white/5 cursor-pointer transition-colors flex-shrink-0 ${
                  isActive ? 'bg-[#0a0a0a] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}>
                {TabIcon && (
                  <TabIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isActive ? meta.color : undefined }} />
                )}
                <span className="text-sm truncate max-w-[160px]">
                  {tab.isDirty && <span className="text-amber-400 mr-1">●</span>}
                  {tab.title}
                </span>
                <button onClick={e => { e.stopPropagation(); closeTab(tab.id) }}
                  className="p-0.5 rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )
          })}
          <button className="p-2 text-gray-600 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 内容区：根据 Tab 类型显示编辑器或画布 */}
      <div className="flex-1 overflow-hidden">
        {showEditor && activeTab ? (
          renderEditor(activeTab)
        ) : (
          <NodeCanvas
            nodes={currentNodes}
            edges={currentEdges}
            onNodesChange={nodes => setCanvasNodes(currentTabId, nodes)}
            onEdgesChange={edges => setCanvasEdges(currentTabId, edges)}
          />
        )}
      </div>
    </div>
  )
}
