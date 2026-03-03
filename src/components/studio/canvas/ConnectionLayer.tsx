import { memo, useCallback } from 'react'
import type { CanvasNode, CanvasEdge } from '../../../store/types'
import { NODE_DEFAULTS, getPortPos, bezierPath } from './constants'

interface ConnectionLayerProps {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  selectedEdgeId: string | null
  hoveredEdgeId: string | null
  onEdgeClick: (edgeId: string) => void
  onEdgeHover: (edgeId: string | null) => void
  onEdgeDelete?: (edgeId: string) => void
  // 拖拽连线中的临时线
  tempConnection: { sourceNodeId: string; mouseX: number; mouseY: number } | null
}

function ConnectionLayerInner({
  nodes, edges, selectedEdgeId, hoveredEdgeId,
  onEdgeClick, onEdgeHover, onEdgeDelete, tempConnection,
}: ConnectionLayerProps) {
  const findNode = useCallback((id: string) => nodes.find(n => n.id === id), [nodes])

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
      <defs>
        {/* 流动动画渐变 */}
        <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(139,92,246,0.3)" />
          <stop offset="50%" stopColor="rgba(139,92,246,0.7)" />
          <stop offset="100%" stopColor="rgba(139,92,246,0.3)" />
        </linearGradient>
        <linearGradient id="edge-gradient-selected" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(167,139,250,0.5)" />
          <stop offset="50%" stopColor="rgba(167,139,250,1)" />
          <stop offset="100%" stopColor="rgba(167,139,250,0.5)" />
        </linearGradient>
        <linearGradient id="edge-gradient-hover" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(244,114,182,0.4)" />
          <stop offset="50%" stopColor="rgba(244,114,182,0.9)" />
          <stop offset="100%" stopColor="rgba(244,114,182,0.4)" />
        </linearGradient>
        {/* 临时连线渐变 */}
        <linearGradient id="temp-edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(139,92,246,0.6)" />
          <stop offset="100%" stopColor="rgba(139,92,246,0.2)" />
        </linearGradient>
        {/* 箭头标记 */}
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(139,92,246,0.5)" />
        </marker>
        <marker id="arrow-hover" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(244,114,182,0.7)" />
        </marker>
        <marker id="arrow-selected" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(167,139,250,0.8)" />
        </marker>
      </defs>

      {/* 已有连线 */}
      {edges.map(edge => {
        const src = findNode(edge.sourceNodeId)
        const tgt = findNode(edge.targetNodeId)
        if (!src || !tgt) return null

        const p1 = getPortPos(src, 'output')
        const p2 = getPortPos(tgt, 'input')
        const d = bezierPath(p1.x, p1.y, p2.x, p2.y)
        const isSelected = edge.id === selectedEdgeId
        const isHovered = edge.id === hoveredEdgeId

        const gradientId = isSelected ? 'edge-gradient-selected' : isHovered ? 'edge-gradient-hover' : 'edge-gradient'
        const strokeWidth = isSelected ? 2.5 : isHovered ? 2.2 : 1.8
        const arrowId = isSelected ? 'arrow-selected' : isHovered ? 'arrow-hover' : 'arrow'

        // 连线中点（用于删除按钮定位）
        const midX = (p1.x + p2.x) / 2
        const midY = (p1.y + p2.y) / 2

        return (
          <g key={edge.id}>
            {/* 隐形宽击中区域 */}
            <path
              d={d}
              stroke="transparent"
              strokeWidth={16}
              fill="none"
              className="pointer-events-auto cursor-pointer"
              onClick={() => onEdgeClick(edge.id)}
              onMouseEnter={() => onEdgeHover(edge.id)}
              onMouseLeave={() => onEdgeHover(null)}
            />
            {/* 底层发光 */}
            {(isSelected || isHovered) && (
              <path d={d} stroke={isSelected ? 'rgba(167,139,250,0.15)' : 'rgba(244,114,182,0.1)'}
                strokeWidth={8} fill="none" strokeLinecap="round" />
            )}
            {/* 主线（带箭头） */}
            <path
              d={d}
              stroke={`url(#${gradientId})`}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              markerMid={`url(#${arrowId})`}
            />
            {/* 流动虚线动画 */}
            <path
              d={d}
              stroke={isSelected ? 'rgba(167,139,250,0.5)' : 'rgba(139,92,246,0.25)'}
              strokeWidth={1}
              fill="none"
              strokeDasharray="6 4"
              strokeLinecap="round"
            >
              <animate attributeName="stroke-dashoffset" from="10" to="0" dur="0.6s" repeatCount="indefinite" />
            </path>
            {/* 中点方向箭头 */}
            <polygon
              points="-4,-3 4,0 -4,3"
              fill={isSelected ? 'rgba(167,139,250,0.7)' : isHovered ? 'rgba(244,114,182,0.6)' : 'rgba(139,92,246,0.4)'}
              transform={`translate(${midX},${midY}) rotate(${Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI})`}
            />
            {/* 端点圆 */}
            <circle cx={p1.x} cy={p1.y} r={3} fill={isSelected ? '#a78bfa' : '#8b5cf6'} opacity={0.6} />
            <circle cx={p2.x} cy={p2.y} r={3} fill={isSelected ? '#a78bfa' : '#8b5cf6'} opacity={0.6} />
            {/* hover/选中时：中点删除按钮 */}
            {(isHovered || isSelected) && onEdgeDelete && (
              <g
                className="pointer-events-auto cursor-pointer"
                onClick={e => { e.stopPropagation(); onEdgeDelete(edge.id) }}
                transform={`translate(${midX},${midY - 16})`}
              >
                <circle r={10} fill="#1c1c20" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
                <line x1={-3.5} y1={-3.5} x2={3.5} y2={3.5} stroke="rgba(239,68,68,0.8)" strokeWidth={1.5} strokeLinecap="round" />
                <line x1={3.5} y1={-3.5} x2={-3.5} y2={3.5} stroke="rgba(239,68,68,0.8)" strokeWidth={1.5} strokeLinecap="round" />
              </g>
            )}
          </g>
        )
      })}

      {/* 拖拽中的临时连线 */}
      {tempConnection && (() => {
        const src = findNode(tempConnection.sourceNodeId)
        if (!src) return null
        const p1 = getPortPos(src, 'output')
        const d = bezierPath(p1.x, p1.y, tempConnection.mouseX, tempConnection.mouseY)
        return (
          <g>
            <path d={d} stroke="url(#temp-edge-gradient)" strokeWidth={2} fill="none"
              strokeLinecap="round" strokeDasharray="8 4">
              <animate attributeName="stroke-dashoffset" from="12" to="0" dur="0.4s" repeatCount="indefinite" />
            </path>
            {/* 鼠标跟随圆点 */}
            <circle cx={tempConnection.mouseX} cy={tempConnection.mouseY} r={5}
              fill="rgba(139,92,246,0.4)" stroke="rgba(139,92,246,0.8)" strokeWidth={1.5} />
          </g>
        )
      })()}
    </svg>
  )
}

export default memo(ConnectionLayerInner)
