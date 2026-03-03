import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react'
import {
  ZoomIn, ZoomOut, Maximize2, Hand, MousePointer2,
  Plus, Layers, MessageSquare, Image, Type, Sparkles
} from 'lucide-react'

interface InfiniteCanvasProps {
  children: ReactNode
  toolbarItems?: ToolbarItem[]
  onDoubleClick?: (canvasX: number, canvasY: number) => void
  className?: string
  emptyMessage?: string
  emptySubMessage?: string
}

export interface ToolbarItem {
  icon: React.ElementType
  label: string
  onClick: () => void
  active?: boolean
}

interface Transform {
  x: number
  y: number
  scale: number
}

export default function InfiniteCanvas({
  children,
  toolbarItems,
  onDoubleClick,
  className = '',
  emptyMessage = '双击画布开始创作',
  emptySubMessage,
}: InfiniteCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const [tool, setTool] = useState<'select' | 'hand'>('select')
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 })

  // 滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    if (e.ctrlKey || e.metaKey) {
      // 缩放
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setTransform(prev => {
        const newScale = Math.max(0.1, Math.min(3, prev.scale * delta))
        const ratio = newScale / prev.scale
        return {
          scale: newScale,
          x: mouseX - (mouseX - prev.x) * ratio,
          y: mouseY - (mouseY - prev.y) * ratio,
        }
      })
    } else {
      // 平移
      setTransform(prev => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }))
    }
  }, [])

  // 鼠标拖拽平移
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && (tool === 'hand' || e.shiftKey))) {
      e.preventDefault()
      setIsPanning(true)
      panStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y }
    }
  }, [tool, transform.x, transform.y])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return
    const dx = e.clientX - panStart.current.x
    const dy = e.clientY - panStart.current.y
    setTransform(prev => ({
      ...prev,
      x: panStart.current.tx + dx,
      y: panStart.current.ty + dy,
    }))
  }, [isPanning])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  // 双击画布
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!onDoubleClick) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const canvasX = (e.clientX - rect.left - transform.x) / transform.scale
    const canvasY = (e.clientY - rect.top - transform.y) / transform.scale
    onDoubleClick(canvasX, canvasY)
  }, [onDoubleClick, transform])

  // 缩放控制
  const zoomIn = () => setTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale * 1.25) }))
  const zoomOut = () => setTransform(prev => ({ ...prev, scale: Math.max(0.1, prev.scale * 0.8) }))
  const zoomReset = () => setTransform({ x: 0, y: 0, scale: 1 })
  const zoomPercent = Math.round(transform.scale * 100)

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault()
        setTool('hand')
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setTool('select')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return (
    <div className={`relative w-full h-full overflow-hidden bg-[#0a0a0a] ${className}`}>
      {/* 画布主体 */}
      <div
        ref={containerRef}
        className={`w-full h-full ${isPanning ? 'cursor-grabbing' : tool === 'hand' ? 'cursor-grab' : 'cursor-default'}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        {/* 网格背景 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: `${24 * transform.scale}px ${24 * transform.scale}px`,
            backgroundPosition: `${transform.x}px ${transform.y}px`,
          }}
        />

        {/* 内容层 */}
        <div
          className="absolute origin-top-left"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            willChange: 'transform',
          }}
        >
          {children}
        </div>
      </div>

      {/* 左侧工具栏 */}
      {toolbarItems && toolbarItems.length > 0 && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 bg-[#1a1a1a] border border-white/10 rounded-2xl p-1.5 shadow-xl">
          {toolbarItems.map((item, i) => (
            <button
              key={i}
              onClick={item.onClick}
              title={item.label}
              className={`p-2.5 rounded-xl transition-colors ${
                item.active
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      )}

      {/* 底部工具栏 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#1a1a1a] border border-white/10 rounded-2xl px-3 py-2 shadow-xl">
        <button
          onClick={() => setTool('select')}
          title="选择 (V)"
          className={`p-1.5 rounded-lg transition-colors ${
            tool === 'select' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'
          }`}
        >
          <MousePointer2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTool('hand')}
          title="抓手 (空格)"
          className={`p-1.5 rounded-lg transition-colors ${
            tool === 'hand' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'
          }`}
        >
          <Hand className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <button
          onClick={zoomOut}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors"
          title="缩小"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={zoomReset}
          className="px-2 py-1 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors min-w-[48px] text-center"
          title="重置缩放"
        >
          {zoomPercent}%
        </button>

        <button
          onClick={zoomIn}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors"
          title="放大"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={zoomReset}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors"
          title="适应视图"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
