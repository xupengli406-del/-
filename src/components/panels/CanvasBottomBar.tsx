import { useCallback, useState } from 'react'
import { MiniMap, useReactFlow } from '@xyflow/react'
import {
  MapPin,
  LayoutGrid,
  Maximize,
  HelpCircle,
} from 'lucide-react'

export default function CanvasBottomBar() {
  const reactFlow = useReactFlow()
  const [showMinimap, setShowMinimap] = useState(false)
  const [zoom, setZoom] = useState(1)

  // 监听缩放变化
  const handleViewportChange = useCallback(() => {
    const vp = reactFlow.getViewport()
    setZoom(vp.zoom)
  }, [reactFlow])

  // 定期同步缩放值
  useState(() => {
    const interval = setInterval(() => {
      try {
        const vp = reactFlow.getViewport()
        setZoom(vp.zoom)
      } catch {}
    }, 500)
    return () => clearInterval(interval)
  })

  const handleFitView = useCallback(() => {
    reactFlow.fitView({ padding: 0.3, duration: 300 })
  }, [reactFlow])

  const handleReset = useCallback(() => {
    reactFlow.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 })
  }, [reactFlow])

  const handleZoomChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newZoom = parseFloat(e.target.value)
      reactFlow.zoomTo(newZoom, { duration: 100 })
      setZoom(newZoom)
    },
    [reactFlow]
  )

  const toggleMinimap = useCallback(() => {
    setShowMinimap((prev) => !prev)
  }, [])

  return (
    <>
      {/* 小地图 */}
      {showMinimap && (
        <div className="absolute bottom-16 right-4 z-10">
          <div className="relative">
            <MiniMap
              nodeColor={(node) => {
                if (node.type === 'textNode') return '#2B5AE8'
                if (node.type === 'imageNode') return '#2B5AE8'
                if (node.type === 'videoNode') return '#2B5AE8'
                if (node.type === 'audioNode') return '#2B5AE8'
                return '#86868b'
              }}
              maskColor="rgba(245, 245, 247, 0.7)"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e8e8ed',
                borderRadius: '12px',
                width: 200,
                height: 140,
                position: 'relative',
              }}
              pannable
              zoomable
            />
            <button
              onClick={toggleMinimap}
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-1 bg-white border border-apple-border-light rounded-full text-[10px] text-apple-text-tertiary hover:text-apple-text transition-colors whitespace-nowrap shadow-sm"
            >
              关闭小地图
            </button>
          </div>
        </div>
      )}

      {/* 底部工具栏 */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-apple-border-light rounded-full px-2 py-1.5 shadow-capsule">
        {/* 小地图切换 */}
        <button
          onClick={toggleMinimap}
          className={`p-1.5 rounded-full transition-colors ${
            showMinimap ? 'bg-brand-50 text-brand' : 'text-apple-text-tertiary hover:text-apple-text hover:bg-apple-bg-secondary'
          }`}
          title="小地图"
        >
          <MapPin size={16} />
        </button>

        {/* 网格 */}
        <button
          className="p-1.5 rounded-full text-apple-text-tertiary hover:text-apple-text hover:bg-apple-bg-secondary transition-colors"
          title="网格"
        >
          <LayoutGrid size={16} />
        </button>

        {/* 适应画布 */}
        <button
          onClick={handleFitView}
          className="p-1.5 rounded-full text-apple-text-tertiary hover:text-apple-text hover:bg-apple-bg-secondary transition-colors"
          title="适应画布"
        >
          <Maximize size={16} />
        </button>

        {/* 缩放滑块 */}
        <div className="flex items-center gap-1.5 px-1">
          <input
            type="range"
            min="0.1"
            max="4"
            step="0.1"
            value={zoom}
            onChange={handleZoomChange}
            className="w-20 h-1 appearance-none bg-apple-border-light rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>

        {/* 重置按钮 */}
        <button
          onClick={handleReset}
          className="px-2.5 py-1 rounded-full text-xs text-apple-text-tertiary hover:text-apple-text hover:bg-apple-bg-secondary transition-colors"
          title="重置画布视图"
        >
          重置
        </button>

        {/* 帮助 */}
        <button
          className="p-1.5 rounded-full text-apple-text-tertiary hover:text-apple-text hover:bg-apple-bg-secondary transition-colors"
          title="帮助"
        >
          <HelpCircle size={16} />
        </button>
      </div>
    </>
  )
}
