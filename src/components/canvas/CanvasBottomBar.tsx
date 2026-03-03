import { Settings, Grid3X3, Maximize2, HelpCircle, Minus, Plus } from 'lucide-react'

interface Props {
  zoom: number
  onZoomChange: (zoom: number) => void
}

export default function CanvasBottomBar({ zoom, onZoomChange }: Props) {
  const handleZoomIn = () => onZoomChange(Math.min(200, zoom + 10))
  const handleZoomOut = () => onZoomChange(Math.max(25, zoom - 10))
  const handleFit = () => onZoomChange(100)

  return (
    <div className="h-10 bg-[#0d0d0d] border-t border-white/5 flex items-center justify-between px-4 flex-shrink-0 z-30">
      {/* 左侧工具 */}
      <div className="flex items-center gap-1">
        <button className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center transition-colors" title="设置">
          <Settings className="w-3.5 h-3.5 text-gray-500" />
        </button>
        <button className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center transition-colors" title="网格">
          <Grid3X3 className="w-3.5 h-3.5 text-gray-500" />
        </button>
        <button
          onClick={handleFit}
          className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center transition-colors"
          title="适配画布"
        >
          <Maximize2 className="w-3.5 h-3.5 text-gray-500" />
        </button>

        {/* 缩放滑块 */}
        <div className="flex items-center gap-1.5 ml-2 bg-white/5 rounded-full px-2 py-1">
          <button onClick={handleZoomOut} className="hover:text-white transition-colors">
            <Minus className="w-3 h-3 text-gray-500" />
          </button>
          <input
            type="range"
            min={25}
            max={200}
            value={zoom}
            onChange={e => onZoomChange(Number(e.target.value))}
            className="w-20 h-1 appearance-none bg-gray-700 rounded-full cursor-pointer accent-blue-500
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-blue-500
              [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <button onClick={handleZoomIn} className="hover:text-white transition-colors">
            <Plus className="w-3 h-3 text-gray-500" />
          </button>
          <span className="text-[10px] text-gray-500 ml-1 w-8 text-center">{zoom}%</span>
        </div>
      </div>

      {/* 右侧帮助 */}
      <button className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center transition-colors" title="帮助">
        <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
      </button>
    </div>
  )
}
