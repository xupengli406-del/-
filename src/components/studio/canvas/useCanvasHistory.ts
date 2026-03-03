import { useCallback, useRef } from 'react'
import type { CanvasNode, CanvasEdge } from '../../../store/types'

interface Snapshot {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

const MAX_HISTORY = 50

export function useCanvasHistory(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  onNodesChange: (nodes: CanvasNode[]) => void,
  onEdgesChange: (edges: CanvasEdge[]) => void,
) {
  const undoStack = useRef<Snapshot[]>([])
  const redoStack = useRef<Snapshot[]>([])

  const pushSnapshot = useCallback(() => {
    undoStack.current.push({ nodes: structuredClone(nodes), edges: structuredClone(edges) })
    if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift()
    redoStack.current = []
  }, [nodes, edges])

  const undo = useCallback(() => {
    const prev = undoStack.current.pop()
    if (!prev) return
    redoStack.current.push({ nodes: structuredClone(nodes), edges: structuredClone(edges) })
    onNodesChange(prev.nodes)
    onEdgesChange(prev.edges)
  }, [nodes, edges, onNodesChange, onEdgesChange])

  const redo = useCallback(() => {
    const next = redoStack.current.pop()
    if (!next) return
    undoStack.current.push({ nodes: structuredClone(nodes), edges: structuredClone(edges) })
    onNodesChange(next.nodes)
    onEdgesChange(next.edges)
  }, [nodes, edges, onNodesChange, onEdgesChange])

  return { pushSnapshot, undo, redo, canUndo: undoStack.current.length > 0, canRedo: redoStack.current.length > 0 }
}
