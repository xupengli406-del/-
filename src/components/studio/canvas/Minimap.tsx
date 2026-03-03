import { memo, useCallback, useRef } from 'react'
import type { CanvasNode } from '../../../store/types'
import { NODE_DEFAULTS } from './constants'

interface MinimapProps {
  nodes: CanvasNode[]
  transform: { x: number; y: number; scale: number }
  containerWidth: number
  containerHeight: number
  onNavigate: (x: number, y: number) => void
}

const MINIMAP_W = 180
const MINIMAP_H = 120
const MINIMAP_PADDING = 20

function MinimapInner({ nodes, transform, containerWidth, containerHeight, onNavigate }: MinimapProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  // 计算所有节点的边界
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const node of nodes) {
    minX = Math.min(minX, node.x)
    minY = Math.min(minY, node.y)
    maxX = Math.max(maxX, node.x + node.width)
    maxY = Math.max(maxY, node.y + node.height)
  }

  // 加 padding
  const padding = 100
  minX -= padding; minY -= padding; maxX += padding; maxY += padding

  const contentW = maxX - minX || 1
  const contentH = maxY - minY || 1
  const scaleX = (MINIMAP_W - MINIMAP_PADDING * 2) / contentW
  const scaleY = (MINIMAP_H - MINIMAP_PADDING * 2) / contentH
  const mapScale = Math.min(scaleX, scaleY)

  const offsetX = (MINIMAP_W - contentW * mapScale) / 2
  const offsetY = (MINIMAP_H - contentH * mapScale) / 2

  // 视口在画布坐标系中的位置
  const vpX = -transform.x / transform.scale
  const vpY = -transform.y / transform.scale
  const vpW = containerWidth / transform.scale
  const vpH = containerHeight / transform.scale

  // 映射到小地图
  const vpMapX = (vpX - minX) * mapScale + offsetX
  const vpMapY = (vpY - minY) * mapScale + offsetY
  const vpMapW = vpW * mapScale
  const vpMapH = vpH * mapScale

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!mapRef.current) return
    const rect = mapRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    // 反映射到画布坐标
    const canvasX = (mx - offsetX) / mapScale + minX
    const canvasY = (my - offsetY) / mapScale + minY
    // 居中视口
    onNavigate(
      -(canvasX - containerWidth / transform.scale / 2) * transform.scale,
      -(canvasY - containerHeight / transform.scale / 2) * transform.scale,
    )
  }, [mapScale, offsetX, offsetY, minX, minY, containerWidth, containerHeight, transform.scale, onNavigate])

  if (nodes.length === 0) return null

  return (
    <div
      ref={mapRef}
      className="absolute bottom-16 right-4 rounded-xl overflow-hidden border border-white/10 bg-[#111114]/90 backdrop-blur-sm shadow-xl cursor-pointer z-30"
      style={{ width: MINIMAP_W, height: MINIMAP_H }}
      onClick={handleClick}
    >
      {/* 节点缩略 */}
      {nodes.map(node => {
        const config = NODE_DEFAULTS[node.type]
        const nx = (node.x - minX) * mapScale + offsetX
        const ny = (node.y - minY) * mapScale + offsetY
        const nw = node.width * mapScale
        const nh = node.height * mapScale
        return (
          <div
            key={node.id}
            className="absolute rounded-sm"
            style={{
              left: nx, top: ny, width: Math.max(nw, 3), height: Math.max(nh, 2),
              backgroundColor: `${config.color}60`,
            }}
          />
        )
      })}

      {/* 视口指示器 */}
      <div
        className="absolute border rounded-sm pointer-events-none"
        style={{
          left: vpMapX, top: vpMapY,
          width: Math.max(vpMapW, 4), height: Math.max(vpMapH, 3),
          borderColor: 'rgba(255,255,255,0.4)',
          backgroundColor: 'rgba(255,255,255,0.05)',
        }}
      />
    </div>
  )
}

export default memo(MinimapInner)
