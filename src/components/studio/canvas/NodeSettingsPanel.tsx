import { useState, useEffect, memo } from 'react'
import {
  Settings2, ChevronRight, ChevronDown, AtSign, Loader2, Sparkles,
  Image as ImageIcon, Video as VideoIcon, Monitor, Smartphone, Square,
  Volume2, X, Check
} from 'lucide-react'
import type { CanvasNode, CanvasNodeData } from '../../../store/types'
import { IMAGE_MODELS, VIDEO_MODELS, ASPECT_RATIOS, VIDEO_DURATIONS, NODE_DEFAULTS } from './constants'

const RESOLUTIONS = ['自适应', '1K', '2K', '4K']
const VIDEO_DURATION_VALUES = [7, 8, 9, 10, 11, 12, 13, 14, 15]

interface NodeSettingsPanelProps {
  node: CanvasNode
  onDataChange: (data: Partial<CanvasNodeData>) => void
  onClose: () => void
}

function NodeSettingsPanelInner({ node, onDataChange, onClose }: NodeSettingsPanelProps) {
  const config = NODE_DEFAULTS[node.type]
  const models = node.type === 'image' ? IMAGE_MODELS : node.type === 'video' ? VIDEO_MODELS : []
  const currentModel = models.find(m => m.id === node.data.model) || models[0]
  const isVideo = node.type === 'video'
  const [prompt, setPrompt] = useState(node.data.imagePrompt || node.data.videoPrompt || '')
  const [showModels, setShowModels] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [genMode, setGenMode] = useState<string>(isVideo ? '文生视频' : '文生图')

  if (node.type === 'text' || node.type === 'upload' || node.type === 'table' || node.type === 'document') return null

  const handleGenerate = () => {
    onDataChange({
      status: 'generating',
      ...(isVideo ? { videoPrompt: prompt } : { imagePrompt: prompt }),
    })
    setTimeout(() => onDataChange({ status: 'completed' }), 3000)
  }

  const aspectRatio = node.data.aspectRatio || '16:9'
  const resolution = node.data.resolution || '自适应'
  const duration = node.data.videoDuration || 15

  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[520px] bg-[#1c1c20] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-visible z-40">
      {/* ====== 输入区 ====== */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-2 bg-white/5 rounded-xl p-3 border border-white/5 focus-within:border-white/15 transition-colors">
          <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
            <button className="p-1 rounded-lg text-gray-500 hover:text-violet-400 transition-colors">
              <ImageIcon className="w-4 h-4" />
            </button>
            <button className="p-1 rounded-lg text-gray-500 hover:text-violet-400 transition-colors">
              <AtSign className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="描述任何你想要生成的内容，按 @ 引用素材，/ 呼出指令"
            rows={2}
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none resize-none leading-relaxed"
            onMouseDown={e => e.stopPropagation()}
          />
        </div>
      </div>

      {/* ====== 设置面板（展开时） ====== */}
      {showSettings && (
        <div className="px-4 pb-3 space-y-4" onMouseDown={e => e.stopPropagation()}>
          {/* 比例选择 */}
          <div>
            <div className="text-xs text-gray-500 mb-2">比例</div>
            <div className="flex items-center gap-1.5">
              {ASPECT_RATIOS.map(r => (
                <button
                  key={r}
                  onClick={() => onDataChange({ aspectRatio: r })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    aspectRatio === r
                      ? 'bg-white/10 text-white ring-1 ring-white/20'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {r === '16:9' && <Monitor className="w-3 h-3" />}
                  {r === '9:16' && <Smartphone className="w-3 h-3" />}
                  {r === '1:1' && <Square className="w-3 h-3" />}
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* 清晰度 */}
          <div>
            <div className="text-xs text-gray-500 mb-2">清晰度</div>
            <div className="flex items-center gap-1.5">
              {RESOLUTIONS.map(r => (
                <button
                  key={r}
                  onClick={() => onDataChange({ resolution: r })}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    resolution === r
                      ? 'bg-white/10 text-white ring-1 ring-white/20'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* 视频时长 */}
          {isVideo && (
            <div>
              <div className="text-xs text-gray-500 mb-2">生成时长</div>
              <div className="flex items-center gap-1">
                {VIDEO_DURATION_VALUES.map(d => (
                  <button
                    key={d}
                    onClick={() => onDataChange({ videoDuration: d })}
                    className={`px-2 py-1 rounded-md text-xs transition-colors ${
                      duration === d
                        ? 'bg-white/10 text-white ring-1 ring-white/20'
                        : 'text-gray-600 hover:text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 生成音频（视频节点） */}
          {isVideo && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Volume2 className="w-3.5 h-3.5" />
                生成音频
              </div>
              <button className="w-8 h-4.5 rounded-full bg-white/10 relative transition-colors">
                <div className="w-3.5 h-3.5 rounded-full bg-gray-500 absolute left-0.5 top-0.5 transition-all" />
              </button>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setShowSettings(false)}
              className="flex-1 px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              关闭
            </button>
            <button
              onClick={() => setShowSettings(false)}
              className="flex-1 px-4 py-2 rounded-xl text-sm text-white transition-colors"
              style={{ backgroundColor: config.color }}
            >
              开启
            </button>
          </div>
        </div>
      )}

      {/* ====== 底部操作栏 ====== */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/5 bg-[#18181c] rounded-b-2xl">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {/* 模型选择 */}
          <div className="relative">
            <button
              onClick={() => { setShowModels(!showModels) }}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: config.color }} />
              <span>{currentModel?.name || '选择模型'}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showModels ? 'rotate-180' : ''}`} />
            </button>
            {/* 模型下拉列表 */}
            {showModels && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#1c1c20] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 py-2 z-50 max-h-80 overflow-y-auto">
                {models.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { onDataChange({ model: m.id }); setShowModels(false) }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/5 transition-colors ${
                      m.id === node.data.model ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: m.id === node.data.model ? config.color : undefined }} />
                      <div>
                        <div className="text-sm font-medium">{m.name}</div>
                        <div className="text-[10px] text-gray-600">{m.desc}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-600">2 min</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-gray-600">·</span>

          {/* 比例 */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="hover:text-white transition-colors"
          >
            {aspectRatio}
          </button>

          <span className="text-gray-600">·</span>

          {/* 清晰度 */}
          <span>{resolution}</span>

          {isVideo && (
            <>
              <span className="text-gray-600">·</span>
              <span>{duration}s</span>
            </>
          )}

          {/* 设置按钮 */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-600">1x</span>
          <button
            onClick={handleGenerate}
            disabled={node.data.status === 'generating'}
            className="flex items-center gap-1.5 px-5 py-1.5 rounded-full text-white text-sm font-medium transition-all shadow-lg disabled:opacity-50"
            style={{
              backgroundColor: config.color,
              boxShadow: `0 4px 16px ${config.color}30`,
            }}
          >
            {node.data.status === 'generating' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>生成中</span>
              </>
            ) : (
              <>
                <span>生成</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(NodeSettingsPanelInner)
