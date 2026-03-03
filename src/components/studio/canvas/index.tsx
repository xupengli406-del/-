import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import {
  Plus, ZoomIn, ZoomOut, Maximize2, Hand, MousePointer2,
  Grid3X3, Sparkles, Undo2, Redo2
} from 'lucide-react'
import type { CanvasNode, CanvasEdge, CanvasNodeType, CanvasNodeData } from '../../../store/types'
import { useProjectStore } from '../../../store'
import { NODE_DEFAULTS, IMAGE_MODELS, VIDEO_MODELS, getPortPos, distance, PORT_HIT_RADIUS, ADD_NODE_ITEMS } from './constants'
import { useCanvasHistory } from './useCanvasHistory'
import CanvasNodeView from './CanvasNode'
import ConnectionLayer from './ConnectionLayer'
import CanvasContextMenu from './CanvasContextMenu'
import Minimap from './Minimap'
import NodeSettingsPanel from './NodeSettingsPanel'

interface NodeCanvasProps {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  onNodesChange: (nodes: CanvasNode[]) => void
  onEdgesChange: (edges: CanvasEdge[]) => void
}

export default function NodeCanvas({ nodes, edges, onNodesChange, onEdgesChange }: NodeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // ========== 画布变换 ==========
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const [tool, setTool] = useState<'select' | 'hand'>('select')
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 })

  // ========== 选择状态 ==========
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set())
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null)

  // ========== 节点拖拽 ==========
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const dragNodeStartPositions = useRef<Map<string, { x: number; y: number }>>(new Map())

  // ========== 对齐辅助线 ==========
  const SNAP_THRESHOLD = 6
  const [alignLines, setAlignLines] = useState<{ x?: number; y?: number }[]>([])

  // ========== 节点缩放 ==========
  const [resizingNodeId, setResizingNodeId] = useState<string | null>(null)
  const resizeStart = useRef({ mouseX: 0, mouseY: 0, w: 0, h: 0 })

  // ========== 端口连线拖拽 ==========
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [tempConnectionEnd, setTempConnectionEnd] = useState<{ x: number; y: number } | null>(null)

  // ========== 框选 ==========
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null)
  const selectionStart = useRef<{ clientX: number; clientY: number; canvasX: number; canvasY: number } | null>(null)

  // ========== 右键菜单 ==========
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number; canvasX: number; canvasY: number
    context: 'canvas' | 'node' | 'edge'
    targetId?: string
  } | null>(null)

  // ========== 小地图 ==========
  const [showMinimap, setShowMinimap] = useState(true)
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 })

  // ========== 历史 ==========
  const { pushSnapshot, undo, redo } = useCanvasHistory(nodes, edges, onNodesChange, onEdgesChange)

  // ========== 监听画布导入队列 ==========
  const { canvasImportQueue, consumeCanvasImport, scripts, characters, environments, addScript } = useProjectStore()

  useEffect(() => {
    if (canvasImportQueue.length === 0) return
    const item = consumeCanvasImport()
    if (!item) return

    const cx = (-transform.x + containerSize.w / 2) / transform.scale
    const cy = (-transform.y + containerSize.h / 2) / transform.scale

    if (item.sourceType === 'script') {
      const script = scripts.find(s => s.id === item.sourceId)
      if (!script) return
      // Excel 剧本 → table 节点
      if (script.excelSheets && script.excelSheets.length > 0) {
        const sheet = script.excelSheets[0]
        const headers = sheet.data[0]?.map(h => String(h ?? '')) || []
        const rows = sheet.data.slice(1)
        pushSnapshot()
        const defaults = NODE_DEFAULTS['table']
        const id = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        const newNode: CanvasNode = {
          id, type: 'table',
          x: cx - defaults.w / 2, y: cy - defaults.h / 2,
          width: defaults.w, height: defaults.h,
          data: {
            label: item.sourceName,
            tableHeaders: headers,
            tableRows: rows,
            sheetName: sheet.name,
            selectedRowIndices: [],
            sourceAssetId: item.sourceId,
            sourceAssetType: 'script',
            status: 'idle',
          },
        }
        onNodesChange([...nodes, newNode])
        setSelectedNodeIds(new Set([id]))
      } else {
        // Word/Text 剧本 → document 节点
        pushSnapshot()
        const defaults = NODE_DEFAULTS['document']
        const id = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        const newNode: CanvasNode = {
          id, type: 'document',
          x: cx - defaults.w / 2, y: cy - defaults.h / 2,
          width: defaults.w, height: defaults.h,
          data: {
            label: item.sourceName,
            documentContent: script.content,
            documentFormat: script.fileName?.endsWith('.md') ? 'markdown' : script.fileName?.endsWith('.docx') ? 'word' : 'text',
            sourceAssetId: item.sourceId,
            sourceAssetType: 'script',
            status: 'idle',
          },
        }
        onNodesChange([...nodes, newNode])
        setSelectedNodeIds(new Set([id]))
      }
    } else if (item.sourceType === 'character') {
      const char = characters.find(c => c.id === item.sourceId)
      if (!char) return
      pushSnapshot()
      const defaults = NODE_DEFAULTS['text']
      const id = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const newNode: CanvasNode = {
        id, type: 'text',
        x: cx - defaults.w / 2, y: cy - defaults.h / 2,
        width: defaults.w, height: defaults.h,
        data: {
          label: `角色: ${char.name}`,
          text: `角色名: ${char.name}\n描述: ${char.description}\n提示词: ${char.prompt}\n标签: ${char.tags.join(', ')}`,
          sourceAssetId: item.sourceId,
          sourceAssetType: 'character',
          status: 'idle',
        },
      }
      onNodesChange([...nodes, newNode])
      setSelectedNodeIds(new Set([id]))
    } else if (item.sourceType === 'environment') {
      const env = environments.find(e => e.id === item.sourceId)
      if (!env) return
      pushSnapshot()
      const defaults = NODE_DEFAULTS['text']
      const id = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const newNode: CanvasNode = {
        id, type: 'text',
        x: cx - defaults.w / 2, y: cy - defaults.h / 2,
        width: defaults.w, height: defaults.h,
        data: {
          label: `场景: ${env.name}`,
          text: `场景名: ${env.name}\n描述: ${env.description}\n提示词: ${env.prompt}\n标签: ${env.tags.join(', ')}`,
          sourceAssetId: item.sourceId,
          sourceAssetType: 'environment',
          status: 'idle',
        },
      }
      onNodesChange([...nodes, newNode])
      setSelectedNodeIds(new Set([id]))
    }
  }, [canvasImportQueue])

  // ========== 保存节点为素材 ==========
  const saveNodeAsAsset = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    if (node.type === 'table') {
      // 表格节点 → 保存为脚本（带 Excel 数据）
      const headers = node.data.tableHeaders || []
      const rows = node.data.selectedRowIndices && node.data.selectedRowIndices.length > 0
        ? node.data.selectedRowIndices.map(i => (node.data.tableRows || [])[i]).filter(Boolean)
        : node.data.tableRows || []
      const allRows = [headers, ...rows]
      const content = allRows.map(r => r.map(c => String(c ?? '')).join('\t')).join('\n')
      const name = `${node.data.label || '表格'}_导出`
      addScript({
        name,
        fileName: `${name}.xlsx`,
        content,
        excelSheets: [{ name: node.data.sheetName || 'Sheet1', data: allRows }],
      })
    } else if (node.type === 'document' || node.type === 'text') {
      const content = node.type === 'document' ? (node.data.documentContent || '') : (node.data.text || '')
      const name = `${node.data.label || '文档'}_导出`
      addScript({ name, fileName: `${name}.txt`, content })
    }
  }, [nodes, addScript])

  // 监听容器尺寸
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setContainerSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 获取第一个选中的节点（用于设置面板）
  const primarySelectedNode = useMemo(() => {
    if (selectedNodeIds.size !== 1) return null
    const id = Array.from(selectedNodeIds)[0]
    return nodes.find(n => n.id === id) || null
  }, [selectedNodeIds, nodes])

  // ========== 坐标转换 ==========
  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: (clientX - rect.left - transform.x) / transform.scale,
      y: (clientY - rect.top - transform.y) / transform.scale,
    }
  }, [transform])

  // ========== 缩放 ==========
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    if (e.ctrlKey || e.metaKey) {
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const delta = e.deltaY > 0 ? 0.92 : 1.08
      setTransform(prev => {
        const ns = Math.max(0.05, Math.min(4, prev.scale * delta))
        const r = ns / prev.scale
        return { scale: ns, x: mx - (mx - prev.x) * r, y: my - (my - prev.y) * r }
      })
    } else {
      setTransform(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }))
    }
  }, [])

  // ========== 画布 MouseDown ==========
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // 关闭右键菜单
    if (contextMenu) { setContextMenu(null); return }

    const target = e.target as HTMLElement
    const isOnNode = !!target.closest('[data-node]')

    // 中键拖拽 或 手型工具 或 Shift 拖拽 → 平移
    if (e.button === 1 || (e.button === 0 && (tool === 'hand' || e.shiftKey))) {
      e.preventDefault()
      setIsPanning(true)
      panStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y }
      return
    }

    // 左键点击空白 → 取消选中 + 开始框选
    if (e.button === 0 && !isOnNode && !connectingFrom) {
      if (!e.ctrlKey && !e.metaKey) {
        setSelectedNodeIds(new Set())
        setSelectedEdgeId(null)
      }
      // 开始框选
      const canvas = screenToCanvas(e.clientX, e.clientY)
      selectionStart.current = { clientX: e.clientX, clientY: e.clientY, canvasX: canvas.x, canvasY: canvas.y }
    }
  }, [contextMenu, tool, transform, screenToCanvas, connectingFrom])

  // ========== 画布 MouseMove ==========
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    // 平移
    if (isPanning) {
      setTransform(prev => ({
        ...prev,
        x: panStart.current.tx + e.clientX - panStart.current.x,
        y: panStart.current.ty + e.clientY - panStart.current.y,
      }))
      return
    }

    // 节点缩放
    if (resizingNodeId) {
      const dx = (e.clientX - resizeStart.current.mouseX) / transform.scale
      const dy = (e.clientY - resizeStart.current.mouseY) / transform.scale
      const newW = Math.max(120, resizeStart.current.w + dx)
      const newH = Math.max(80, resizeStart.current.h + dy)
      onNodesChange(nodes.map(n => n.id === resizingNodeId ? { ...n, width: newW, height: newH } : n))
      return
    }

    // 端口连线拖拽
    if (connectingFrom) {
      const canvas = screenToCanvas(e.clientX, e.clientY)
      setTempConnectionEnd(canvas)
      return
    }

    // 节点拖拽（带对齐磁吸）
    if (draggingNodeId) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      let cx = (e.clientX - rect.left - transform.x) / transform.scale - dragOffset.current.x
      let cy = (e.clientY - rect.top - transform.y) / transform.scale - dragOffset.current.y

      // 对齐磁吸：单节点拖拽时检测与其他节点的对齐
      const newAlignLines: { x?: number; y?: number }[] = []
      if (!(selectedNodeIds.has(draggingNodeId) && selectedNodeIds.size > 1)) {
        const dragNode = nodes.find(n => n.id === draggingNodeId)
        if (dragNode) {
          const dw = dragNode.width, dh = dragNode.height
          const dCenterX = cx + dw / 2, dCenterY = cy + dh / 2
          const dRight = cx + dw, dBottom = cy + dh

          for (const other of nodes) {
            if (other.id === draggingNodeId) continue
            const oCenterX = other.x + other.width / 2, oCenterY = other.y + other.height / 2
            const oRight = other.x + other.width, oBottom = other.y + other.height

            // X 轴对齐（左-左、右-右、中-中、左-右、右-左）
            const xChecks = [
              { val: other.x, ref: cx },         // 左-左
              { val: oRight, ref: dRight },       // 右-右
              { val: oCenterX, ref: dCenterX },   // 中-中
              { val: oRight, ref: cx },            // 右-左
              { val: other.x, ref: dRight },       // 左-右
            ]
            for (const { val, ref } of xChecks) {
              if (Math.abs(val - ref) < SNAP_THRESHOLD) {
                cx += val - ref
                newAlignLines.push({ x: val })
                break
              }
            }

            // Y 轴对齐（上-上、下-下、中-中、上-下、下-上）
            const yChecks = [
              { val: other.y, ref: cy },           // 上-上
              { val: oBottom, ref: dBottom },       // 下-下
              { val: oCenterY, ref: dCenterY },     // 中-中
              { val: oBottom, ref: cy },             // 下-上
              { val: other.y, ref: dBottom },        // 上-下
            ]
            for (const { val, ref } of yChecks) {
              if (Math.abs(val - ref) < SNAP_THRESHOLD) {
                cy += val - ref
                newAlignLines.push({ y: val })
                break
              }
            }
          }
        }
      }
      setAlignLines(newAlignLines)

      // 如果拖的节点在多选中，移动所有选中的节点
      if (selectedNodeIds.has(draggingNodeId) && selectedNodeIds.size > 1) {
        const startPos = dragNodeStartPositions.current.get(draggingNodeId)
        if (startPos) {
          const dx = cx - startPos.x
          const dy = cy - startPos.y
          onNodesChange(nodes.map(n => {
            if (selectedNodeIds.has(n.id)) {
              const sp = dragNodeStartPositions.current.get(n.id)
              if (sp) return { ...n, x: sp.x + dx, y: sp.y + dy }
            }
            return n
          }))
        }
      } else {
        onNodesChange(nodes.map(n => n.id === draggingNodeId ? { ...n, x: cx, y: cy } : n))
      }
      return
    }

    // 框选
    if (selectionStart.current) {
      const dx = Math.abs(e.clientX - selectionStart.current.clientX)
      const dy = Math.abs(e.clientY - selectionStart.current.clientY)
      if (dx > 5 || dy > 5) {
        const canvas = screenToCanvas(e.clientX, e.clientY)
        setSelectionBox({
          startX: selectionStart.current.canvasX,
          startY: selectionStart.current.canvasY,
          endX: canvas.x,
          endY: canvas.y,
        })
      }
    }
  }, [isPanning, connectingFrom, draggingNodeId, selectedNodeIds, nodes, transform, screenToCanvas, onNodesChange])

  // ========== 画布 MouseUp ==========
  const handleCanvasMouseUp = useCallback((e: React.MouseEvent) => {
    // 平移结束
    if (isPanning) {
      setIsPanning(false)
    }

    // 端口连线完成 → 检查是否在某个 input port 上释放
    if (connectingFrom) {
      const canvas = screenToCanvas(e.clientX, e.clientY)
      let targetNodeId: string | null = null

      for (const node of nodes) {
        const inputConfig = NODE_DEFAULTS[node.type]
        if (!inputConfig.hasInput) continue
        if (node.id === connectingFrom) continue

        const portPos = getPortPos(node, 'input')
        if (distance(canvas.x, canvas.y, portPos.x, portPos.y) < PORT_HIT_RADIUS / transform.scale + 10) {
          // 检查是否已有连线
          const exists = edges.some(e => e.sourceNodeId === connectingFrom && e.targetNodeId === node.id)
          if (!exists) {
            targetNodeId = node.id
            break
          }
        }
      }

      if (targetNodeId) {
        pushSnapshot()
        const newEdge: CanvasEdge = {
          id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sourceNodeId: connectingFrom,
          targetNodeId,
        }
        onEdgesChange([...edges, newEdge])
      }

      setConnectingFrom(null)
      setTempConnectionEnd(null)
    }

    // 框选完成
    if (selectionBox) {
      const minX = Math.min(selectionBox.startX, selectionBox.endX)
      const maxX = Math.max(selectionBox.startX, selectionBox.endX)
      const minY = Math.min(selectionBox.startY, selectionBox.endY)
      const maxY = Math.max(selectionBox.startY, selectionBox.endY)

      const selected = new Set<string>()
      for (const node of nodes) {
        const nx = node.x, ny = node.y
        const nx2 = node.x + node.width, ny2 = node.y + node.height
        if (nx2 >= minX && nx <= maxX && ny2 >= minY && ny <= maxY) {
          selected.add(node.id)
        }
      }
      if (e.ctrlKey || e.metaKey) {
        setSelectedNodeIds(prev => {
          const next = new Set(prev)
          selected.forEach(id => next.has(id) ? next.delete(id) : next.add(id))
          return next
        })
      } else {
        setSelectedNodeIds(selected)
      }
      setSelectionBox(null)
    }

    selectionStart.current = null
    setDraggingNodeId(null)
    setResizingNodeId(null)
    setAlignLines([])
  }, [isPanning, resizingNodeId, connectingFrom, selectionBox, nodes, edges, transform, screenToCanvas, pushSnapshot, onEdgesChange])

  // ========== 双击画布 → 快速添加 ==========
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-node]')) return
    const canvas = screenToCanvas(e.clientX, e.clientY)
    setContextMenu({
      x: e.clientX, y: e.clientY, canvasX: canvas.x, canvasY: canvas.y,
      context: 'canvas',
    })
  }, [screenToCanvas])

  // ========== 右键菜单 ==========
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const target = e.target as HTMLElement
    const nodeEl = target.closest('[data-node]')
    const canvas = screenToCanvas(e.clientX, e.clientY)

    if (nodeEl) {
      const nodeId = nodeEl.getAttribute('data-node-id')
      if (nodeId) {
        if (!selectedNodeIds.has(nodeId)) {
          setSelectedNodeIds(new Set([nodeId]))
        }
        setContextMenu({ x: e.clientX, y: e.clientY, canvasX: canvas.x, canvasY: canvas.y, context: 'node', targetId: nodeId })
        return
      }
    }

    if (selectedEdgeId) {
      setContextMenu({ x: e.clientX, y: e.clientY, canvasX: canvas.x, canvasY: canvas.y, context: 'edge', targetId: selectedEdgeId })
      return
    }

    setContextMenu({ x: e.clientX, y: e.clientY, canvasX: canvas.x, canvasY: canvas.y, context: 'canvas' })
  }, [screenToCanvas, selectedNodeIds, selectedEdgeId])

  // ========== 添加节点 ==========
  const addNode = useCallback((type: CanvasNodeType, x: number, y: number, fromNodeId?: string) => {
    pushSnapshot()
    const defaults = NODE_DEFAULTS[type]
    const id = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const newNode: CanvasNode = {
      id, type,
      x: x - defaults.w / 2, y: y - defaults.h / 2,
      width: defaults.w, height: defaults.h,
      data: {
        label: type === 'text' ? '文本' : type === 'image' ? '图片生成' : type === 'video' ? '视频生成' : type === 'audio' ? '音频' : '素材上传',
        text: type === 'text' ? '' : undefined,
        model: type === 'image' ? IMAGE_MODELS[0].id : type === 'video' ? VIDEO_MODELS[0].id : undefined,
        status: 'idle',
        aspectRatio: '自适应',
        videoDuration: type === 'video' ? 8 : undefined,
      },
    }
    const newNodes = [...nodes, newNode]
    const newEdges = fromNodeId
      ? [...edges, { id: `edge-${Date.now()}`, sourceNodeId: fromNodeId, targetNodeId: id }]
      : edges
    onNodesChange(newNodes)
    onEdgesChange(newEdges)
    setSelectedNodeIds(new Set([id]))
    setContextMenu(null)
  }, [nodes, edges, onNodesChange, onEdgesChange, pushSnapshot])

  // ========== 删除节点 ==========
  const deleteNodes = useCallback((nodeIds: Set<string>) => {
    if (nodeIds.size === 0) return
    pushSnapshot()
    onNodesChange(nodes.filter(n => !nodeIds.has(n.id)))
    onEdgesChange(edges.filter(e => !nodeIds.has(e.sourceNodeId) && !nodeIds.has(e.targetNodeId)))
    setSelectedNodeIds(new Set())
  }, [nodes, edges, pushSnapshot, onNodesChange, onEdgesChange])

  // ========== 删除连线 ==========
  const deleteEdge = useCallback((edgeId: string) => {
    pushSnapshot()
    onEdgesChange(edges.filter(e => e.id !== edgeId))
    setSelectedEdgeId(null)
  }, [edges, pushSnapshot, onEdgesChange])

  // ========== 复制节点 ==========
  const duplicateNodes = useCallback((nodeIds: Set<string>) => {
    if (nodeIds.size === 0) return
    pushSnapshot()
    const offset = 40
    const idMap = new Map<string, string>()
    const newNodes: CanvasNode[] = []
    for (const id of nodeIds) {
      const node = nodes.find(n => n.id === id)
      if (!node) continue
      const newId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      idMap.set(id, newId)
      newNodes.push({ ...node, id: newId, x: node.x + offset, y: node.y + offset, data: { ...node.data } })
    }
    // 复制选中节点之间的连线
    const newEdges: CanvasEdge[] = []
    for (const edge of edges) {
      if (nodeIds.has(edge.sourceNodeId) && nodeIds.has(edge.targetNodeId)) {
        const newSrc = idMap.get(edge.sourceNodeId)
        const newTgt = idMap.get(edge.targetNodeId)
        if (newSrc && newTgt) {
          newEdges.push({ id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, sourceNodeId: newSrc, targetNodeId: newTgt })
        }
      }
    }
    onNodesChange([...nodes, ...newNodes])
    onEdgesChange([...edges, ...newEdges])
    setSelectedNodeIds(new Set(idMap.values()))
  }, [nodes, edges, pushSnapshot, onNodesChange, onEdgesChange])

  // ========== 断开节点所有连线 ==========
  const disconnectNode = useCallback((nodeId: string) => {
    pushSnapshot()
    onEdgesChange(edges.filter(e => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId))
  }, [edges, pushSnapshot, onEdgesChange])

  // ========== 节点缩放开始 ==========
  const handleResizeStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return
    setResizingNodeId(nodeId)
    resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, w: node.width, h: node.height }
    pushSnapshot()
  }, [nodes, pushSnapshot])

  // ========== 更新节点数据 ==========
  const updateNodeData = useCallback((nodeId: string, data: Partial<CanvasNodeData>) => {
    onNodesChange(nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n))
  }, [nodes, onNodesChange])

  // ========== 节点 MouseDown（拖拽） ==========
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    if (contextMenu) { setContextMenu(null); return }

    // 选择逻辑
    if (e.ctrlKey || e.metaKey) {
      setSelectedNodeIds(prev => {
        const next = new Set(prev)
        next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId)
        return next
      })
    } else if (!selectedNodeIds.has(nodeId)) {
      setSelectedNodeIds(new Set([nodeId]))
    }

    setSelectedEdgeId(null)

    // 开始拖拽
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    dragOffset.current = {
      x: (e.clientX - rect.left - transform.x) / transform.scale - node.x,
      y: (e.clientY - rect.top - transform.y) / transform.scale - node.y,
    }
    // 记录所有选中节点的起始位置
    dragNodeStartPositions.current.clear()
    const relevantIds = selectedNodeIds.has(nodeId) ? selectedNodeIds : new Set([nodeId])
    for (const id of relevantIds) {
      const n = nodes.find(nd => nd.id === id)
      if (n) dragNodeStartPositions.current.set(id, { x: n.x, y: n.y })
    }
    setDraggingNodeId(nodeId)
    pushSnapshot()
  }, [nodes, selectedNodeIds, transform, contextMenu, pushSnapshot])

  // ========== 端口快捷添加节点 ==========
  const handleQuickAdd = useCallback((fromNodeId: string, type: CanvasNodeType) => {
    const fromNode = nodes.find(n => n.id === fromNodeId)
    if (!fromNode) return
    // 在源节点右侧 200px 处创建新节点
    const x = fromNode.x + fromNode.width + 200
    const y = fromNode.y + fromNode.height / 2
    addNode(type, x, y, fromNodeId)
  }, [nodes, addNode])

  // ========== 端口 MouseDown（开始连线） ==========
  const handlePortMouseDown = useCallback((nodeId: string) => {
    setConnectingFrom(nodeId)
  }, [])

  // ========== 端口 MouseUp（完成连线） ==========
  const handlePortMouseUp = useCallback((nodeId: string) => {
    if (!connectingFrom || connectingFrom === nodeId) return
    const exists = edges.some(e => e.sourceNodeId === connectingFrom && e.targetNodeId === nodeId)
    if (exists) return
    pushSnapshot()
    const newEdge: CanvasEdge = {
      id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sourceNodeId: connectingFrom,
      targetNodeId: nodeId,
    }
    onEdgesChange([...edges, newEdge])
    setConnectingFrom(null)
    setTempConnectionEnd(null)
  }, [connectingFrom, edges, pushSnapshot, onEdgesChange])

  // ========== 连线点击 ==========
  const handleEdgeClick = useCallback((edgeId: string) => {
    setSelectedEdgeId(edgeId)
    setSelectedNodeIds(new Set())
  }, [])

  // ========== 适应视图 ==========
  const fitView = useCallback(() => {
    if (nodes.length === 0) {
      setTransform({ x: 0, y: 0, scale: 1 })
      return
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const n of nodes) {
      minX = Math.min(minX, n.x)
      minY = Math.min(minY, n.y)
      maxX = Math.max(maxX, n.x + n.width)
      maxY = Math.max(maxY, n.y + n.height)
    }
    const padding = 80
    const contentW = maxX - minX + padding * 2
    const contentH = maxY - minY + padding * 2
    const scaleX = containerSize.w / contentW
    const scaleY = containerSize.h / contentH
    const scale = Math.min(scaleX, scaleY, 1.5)
    const x = (containerSize.w - contentW * scale) / 2 - (minX - padding) * scale
    const y = (containerSize.h - contentH * scale) / 2 - (minY - padding) * scale
    setTransform({ x, y, scale })
  }, [nodes, containerSize])

  // ========== 缩放控制 ==========
  const zoomIn = () => setTransform(p => {
    const ns = Math.min(4, p.scale * 1.25)
    const r = ns / p.scale
    return { scale: ns, x: containerSize.w / 2 - (containerSize.w / 2 - p.x) * r, y: containerSize.h / 2 - (containerSize.h / 2 - p.y) * r }
  })
  const zoomOut = () => setTransform(p => {
    const ns = Math.max(0.05, p.scale * 0.8)
    const r = ns / p.scale
    return { scale: ns, x: containerSize.w / 2 - (containerSize.w / 2 - p.x) * r, y: containerSize.h / 2 - (containerSize.h / 2 - p.y) * r }
  })

  // ========== 小地图导航 ==========
  const handleMinimapNavigate = useCallback((x: number, y: number) => {
    setTransform(prev => ({ ...prev, x, y }))
  }, [])

  // ========== 全选 ==========
  const selectAll = useCallback(() => {
    setSelectedNodeIds(new Set(nodes.map(n => n.id)))
  }, [nodes])

  // ========== 键盘快捷键 ==========
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果焦点在 input/textarea 中，忽略大部分快捷键
      const tag = (e.target as HTMLElement)?.tagName
      const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable

      if (e.key === ' ' && !e.repeat && !isEditing) {
        e.preventDefault()
        setTool('hand')
      }

      if (e.key === 'Escape') {
        setContextMenu(null)
        setConnectingFrom(null)
        setTempConnectionEnd(null)
        setSelectionBox(null)
        selectionStart.current = null
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditing) {
        if (selectedNodeIds.size > 0) {
          deleteNodes(selectedNodeIds)
        } else if (selectedEdgeId) {
          deleteEdge(selectedEdgeId)
        }
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z' && !isEditing) {
        e.preventDefault()
        undo()
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z' && !isEditing) {
        e.preventDefault()
        redo()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !isEditing) {
        e.preventDefault()
        selectAll()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && !isEditing) {
        e.preventDefault()
        duplicateNodes(selectedNodeIds)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0' && !isEditing) {
        e.preventDefault()
        fitView()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') setTool('select')
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [selectedNodeIds, selectedEdgeId, deleteNodes, deleteEdge, undo, redo, selectAll, duplicateNodes, fitView])

  // ========== 判断节点是否为当前连线的有效目标 ==========
  const isValidTarget = useCallback((nodeId: string): boolean => {
    if (!connectingFrom) return false
    if (nodeId === connectingFrom) return false
    const cfg = NODE_DEFAULTS[nodes.find(n => n.id === nodeId)?.type || 'text']
    if (!cfg.hasInput) return false
    return !edges.some(e => e.sourceNodeId === connectingFrom && e.targetNodeId === nodeId)
  }, [connectingFrom, nodes, edges])

  // ========== 缩放百分比 ==========
  const zoomPercent = Math.round(transform.scale * 100)

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#09090b]">
      {/* ====== 画布主体 ====== */}
      <div
        ref={containerRef}
        className={`w-full h-full ${
          isPanning ? 'cursor-grabbing' :
          connectingFrom ? 'cursor-crosshair' :
          tool === 'hand' ? 'cursor-grab' : 'cursor-default'
        }`}
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        {/* 网格背景 */}
        <div
          className="absolute inset-0 pointer-events-none"
          data-canvas="true"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)`,
            backgroundSize: `${24 * transform.scale}px ${24 * transform.scale}px`,
            backgroundPosition: `${transform.x}px ${transform.y}px`,
          }}
        />
        {/* 十字原点线（微弱） */}
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: Math.min(0.15, transform.scale * 0.1) }}>
          <div className="absolute h-px w-full" style={{ top: transform.y, backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <div className="absolute w-px h-full" style={{ left: transform.x, backgroundColor: 'rgba(255,255,255,0.2)' }} />
        </div>

        {/* 内容层 */}
        <div
          ref={contentRef}
          className="absolute origin-top-left"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            willChange: 'transform',
          }}
        >
          {/* 连线层 */}
          <ConnectionLayer
            nodes={nodes}
            edges={edges}
            selectedEdgeId={selectedEdgeId}
            hoveredEdgeId={hoveredEdgeId}
            onEdgeClick={handleEdgeClick}
            onEdgeHover={setHoveredEdgeId}
            onEdgeDelete={deleteEdge}
            tempConnection={connectingFrom && tempConnectionEnd ? { sourceNodeId: connectingFrom, mouseX: tempConnectionEnd.x, mouseY: tempConnectionEnd.y } : null}
          />

          {/* 对齐辅助线 */}
          {alignLines.map((line, i) => (
            line.x !== undefined ? (
              <div key={`ax-${i}`} className="absolute pointer-events-none" style={{ left: line.x, top: -9999, width: 1, height: 99999, backgroundColor: 'rgba(99,102,241,0.5)' }} />
            ) : line.y !== undefined ? (
              <div key={`ay-${i}`} className="absolute pointer-events-none" style={{ top: line.y, left: -9999, height: 1, width: 99999, backgroundColor: 'rgba(99,102,241,0.5)' }} />
            ) : null
          ))}

          {/* 节点层 */}
          {nodes.map(node => (
            <CanvasNodeView
              key={node.id}
              node={node}
              selected={selectedNodeIds.size === 1 && selectedNodeIds.has(node.id)}
              multiSelected={selectedNodeIds.size > 1 && selectedNodeIds.has(node.id)}
              onMouseDown={e => handleNodeMouseDown(e, node.id)}
              onDelete={() => deleteNodes(new Set([node.id]))}
              onDuplicate={() => duplicateNodes(new Set([node.id]))}
              onDataChange={data => updateNodeData(node.id, data)}
              onPortMouseDown={handlePortMouseDown}
              onPortMouseUp={handlePortMouseUp}
              connectingFrom={connectingFrom}
              isValidTarget={isValidTarget(node.id)}
              onQuickAdd={handleQuickAdd}
              onResizeStart={handleResizeStart}
            />
          ))}
        </div>

        {/* 框选矩形 */}
        {selectionBox && (
          <div
            className="absolute pointer-events-none border border-violet-400/50 rounded-sm"
            style={{
              left: Math.min(selectionBox.startX, selectionBox.endX) * transform.scale + transform.x,
              top: Math.min(selectionBox.startY, selectionBox.endY) * transform.scale + transform.y,
              width: Math.abs(selectionBox.endX - selectionBox.startX) * transform.scale,
              height: Math.abs(selectionBox.endY - selectionBox.startY) * transform.scale,
              backgroundColor: 'rgba(139,92,246,0.08)',
            }}
          />
        )}
      </div>

      {/* ====== 空状态引导 ====== */}
      {nodes.length === 0 && !contextMenu && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 bg-[#1a1a1e] border border-white/10 rounded-full px-5 py-2.5 mb-5 pointer-events-auto shadow-xl">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-gray-300">双击</span>
            <span className="text-sm text-gray-500">或</span>
            <span className="text-sm text-gray-300">右键</span>
            <span className="text-sm text-gray-500">画布添加节点</span>
          </div>
          <div className="flex gap-2 pointer-events-auto">
            {['文字生视频', '图片换背景', '首帧生成视频', '音频生视频', '工作流模板'].map(label => (
              <button
                key={label}
                className="px-3.5 py-1.5 rounded-full bg-[#1a1a1e] border border-white/8 text-xs text-gray-500 hover:text-white hover:border-white/20 transition-all"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ====== 左侧快捷工具栏 ====== */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 bg-[#141416] border border-white/8 rounded-2xl p-1.5 shadow-xl z-20">
        {ADD_NODE_ITEMS.slice(0, 5).map(item => (
          <button
            key={item.type}
            onClick={() => {
              const cx = (-transform.x + containerSize.w / 2) / transform.scale
              const cy = (-transform.y + containerSize.h / 2) / transform.scale
              addNode(item.type, cx, cy)
            }}
            className="p-2.5 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-colors group/btn relative"
            title={item.label}
          >
            <item.icon className="w-5 h-5" />
            {/* Hover tooltip */}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#1a1a1e] border border-white/10 text-xs text-gray-300 whitespace-nowrap opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-opacity shadow-lg">
              {item.label}
              {item.shortcut && <span className="ml-2 text-gray-600">{item.shortcut}</span>}
            </div>
          </button>
        ))}
      </div>

      {/* ====== 底部控制栏 ====== */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[#141416] border border-white/8 rounded-2xl px-2.5 py-1.5 shadow-xl z-20">
        {/* 选择/手型 */}
        <button onClick={() => setTool('select')} title="选择 (V)"
          className={`p-1.5 rounded-lg transition-colors ${tool === 'select' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
          <MousePointer2 className="w-4 h-4" />
        </button>
        <button onClick={() => setTool('hand')} title="抓手 (空格)"
          className={`p-1.5 rounded-lg transition-colors ${tool === 'hand' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
          <Hand className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/8 mx-0.5" />

        {/* 撤销/重做 */}
        <button onClick={undo} title="撤销 (Ctrl+Z)" className="p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors">
          <Undo2 className="w-4 h-4" />
        </button>
        <button onClick={redo} title="重做 (Ctrl+Shift+Z)" className="p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors">
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/8 mx-0.5" />

        {/* 缩放 */}
        <button onClick={zoomOut} title="缩小" className="p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={fitView} title={`${zoomPercent}% (点击适应视图)`}
          className="px-2 py-1 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors min-w-[48px] text-center font-mono">
          {zoomPercent}%
        </button>
        <button onClick={zoomIn} title="放大" className="p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors">
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/8 mx-0.5" />

        {/* 小地图/适应 */}
        <button onClick={() => setShowMinimap(!showMinimap)} title="小地图"
          className={`p-1.5 rounded-lg transition-colors ${showMinimap ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
          <Grid3X3 className="w-4 h-4" />
        </button>
        <button onClick={fitView} title="适应视图 (Ctrl+0)" className="p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors">
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* ====== 右下角全局添加按钮 ====== */}
      <button
        onClick={() => {
          const cx = (-transform.x + containerSize.w / 2) / transform.scale
          const cy = (-transform.y + containerSize.h / 2) / transform.scale
          setContextMenu({ x: containerSize.w - 200, y: containerSize.h - 200, canvasX: cx, canvasY: cy, context: 'canvas' })
        }}
        className="absolute bottom-4 right-4 w-11 h-11 rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-xl shadow-violet-500/25 flex items-center justify-center transition-all hover:scale-105 z-20"
        title="添加节点"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* ====== 小地图 ====== */}
      {showMinimap && (
        <Minimap
          nodes={nodes}
          transform={transform}
          containerWidth={containerSize.w}
          containerHeight={containerSize.h}
          onNavigate={handleMinimapNavigate}
        />
      )}

      {/* ====== 右键菜单 ====== */}
      {contextMenu && (
        <CanvasContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          context={contextMenu.context}
          onClose={() => setContextMenu(null)}
          onAddNode={type => addNode(type, contextMenu.canvasX, contextMenu.canvasY)}
          onFitView={fitView}
          onUndo={undo}
          onRedo={redo}
          onSelectAll={selectAll}
          onDeleteNode={() => {
            if (contextMenu.targetId) deleteNodes(selectedNodeIds.size > 0 ? selectedNodeIds : new Set([contextMenu.targetId]))
          }}
          onDuplicateNode={() => {
            if (contextMenu.targetId) duplicateNodes(selectedNodeIds.size > 0 ? selectedNodeIds : new Set([contextMenu.targetId]))
          }}
          onDisconnectNode={() => {
            if (contextMenu.targetId) disconnectNode(contextMenu.targetId)
          }}
          onSaveAsAsset={() => {
            if (contextMenu.targetId) saveNodeAsAsset(contextMenu.targetId)
          }}
          onDeleteEdge={() => {
            if (contextMenu.targetId) deleteEdge(contextMenu.targetId)
          }}
        />
      )}

      {/* ====== 节点设置面板 ====== */}
      {primarySelectedNode && (
        <NodeSettingsPanel
          node={primarySelectedNode}
          onDataChange={data => updateNodeData(primarySelectedNode.id, data)}
          onClose={() => setSelectedNodeIds(new Set())}
        />
      )}

      {/* ====== 选中节点数量提示 ====== */}
      {selectedNodeIds.size > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#141416] border border-white/8 rounded-xl shadow-xl text-sm text-gray-300 z-20">
          已选中 <span className="text-violet-400 font-medium">{selectedNodeIds.size}</span> 个节点
          <span className="text-gray-600 ml-2">按 Delete 删除 · Ctrl+D 复制</span>
        </div>
      )}
    </div>
  )
}
