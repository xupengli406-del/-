import { useState } from 'react'
import { 
  Sparkles, 
  Sliders, 
  Wand2, 
  Image, 
  Video, 
  RefreshCw,
  ChevronDown,
  Copy,
  Maximize2,
  Paintbrush
} from 'lucide-react'

interface AIInspectorProps {
  collapsed: boolean
  onToggle: () => void
}

export default function AIInspector({ collapsed }: AIInspectorProps) {
  const [activeSection, setActiveSection] = useState<'prompt' | 'params' | 'tools'>('prompt')
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [params, setParams] = useState({
    model: 'SDXL Lightning',
    width: 1024,
    height: 1024,
    steps: 8,
    cfgScale: 2,
    sampler: 'DPM++ SDE',
    seed: -1,
  })

  if (collapsed) {
    return (
      <div className="w-12 bg-[#111] border-l border-white/5 flex flex-col items-center py-3 gap-2">
        <button className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors" title="AI助手">
          <Sparkles className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors" title="参数">
          <Sliders className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors" title="工具">
          <Wand2 className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="w-80 bg-[#111] border-l border-white/5 flex flex-col overflow-hidden flex-shrink-0">
      {/* 顶部标签 */}
      <div className="flex border-b border-white/5">
        {[
          { key: 'prompt', label: 'Prompt', icon: Sparkles },
          { key: 'params', label: '参数', icon: Sliders },
          { key: 'tools', label: '工具', icon: Wand2 },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key as typeof activeSection)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm transition-colors ${
              activeSection === key
                ? 'text-white border-b-2 border-violet-500'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeSection === 'prompt' && (
          <div className="space-y-4">
            {/* 正向提示词 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-400">正向提示词</label>
                <button className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="描述你想生成的画面..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500/50 transition-colors resize-none"
              />
              <div className="flex items-center gap-2 mt-2">
                <button className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                  <Copy className="w-3 h-3" />
                  复制
                </button>
                <button className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                  <RefreshCw className="w-3 h-3" />
                  AI优化
                </button>
              </div>
            </div>

            {/* 负向提示词 */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">负向提示词</label>
              <textarea
                value={negativePrompt}
                onChange={e => setNegativePrompt(e.target.value)}
                placeholder="不想出现的元素..."
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500/50 transition-colors resize-none"
              />
            </div>

            {/* 快捷角色/场景插入 */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">快捷插入</label>
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1.5 rounded-full bg-violet-500/20 text-violet-400 text-xs hover:bg-violet-500/30 transition-colors">
                  + 秦羽
                </button>
                <button className="px-3 py-1.5 rounded-full bg-violet-500/20 text-violet-400 text-xs hover:bg-violet-500/30 transition-colors">
                  + 凌雪
                </button>
                <button className="px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs hover:bg-cyan-500/30 transition-colors">
                  + 青云山
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'params' && (
          <div className="space-y-4">
            {/* 模型选择 */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">生成模型</label>
              <button className="w-full flex items-center justify-between px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:border-violet-500/50 transition-colors">
                <span>{params.model}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* 尺寸 */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">输出尺寸</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-gray-500">宽度</span>
                  <input
                    type="number"
                    value={params.width}
                    onChange={e => setParams(p => ({ ...p, width: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50 transition-colors"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray-500">高度</span>
                  <input
                    type="number"
                    value={params.height}
                    onChange={e => setParams(p => ({ ...p, height: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 采样步数 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-400">采样步数</label>
                <span className="text-xs text-gray-500">{params.steps}</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                value={params.steps}
                onChange={e => setParams(p => ({ ...p, steps: parseInt(e.target.value) }))}
                className="w-full accent-violet-500"
              />
            </div>

            {/* CFG Scale */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-400">CFG Scale</label>
                <span className="text-xs text-gray-500">{params.cfgScale}</span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                step={0.5}
                value={params.cfgScale}
                onChange={e => setParams(p => ({ ...p, cfgScale: parseFloat(e.target.value) }))}
                className="w-full accent-violet-500"
              />
            </div>

            {/* Seed */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">随机种子</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={params.seed}
                  onChange={e => setParams(p => ({ ...p, seed: parseInt(e.target.value) }))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50 transition-colors"
                />
                <button
                  onClick={() => setParams(p => ({ ...p, seed: Math.floor(Math.random() * 999999999) }))}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'tools' && (
          <div className="space-y-3">
            <ToolButton icon={Image} label="生成图片" description="根据提示词生成新图片" />
            <ToolButton icon={Video} label="生成视频" description="将静态图转为动态视频" />
            <ToolButton icon={Paintbrush} label="局部重绘" description="选择区域进行重新绘制" />
            <ToolButton icon={Maximize2} label="图片扩展" description="扩展画面边缘内容" />
            <ToolButton icon={Wand2} label="超分辨率" description="提升图片分辨率和细节" />
          </div>
        )}
      </div>

      {/* 生成按钮 */}
      <div className="p-4 border-t border-white/5">
        <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium transition-all shadow-lg shadow-violet-500/25">
          <Sparkles className="w-4 h-4" />
          生成
        </button>
      </div>
    </div>
  )
}

function ToolButton({ icon: Icon, label, description }: { icon: React.ElementType; label: string; description: string }) {
  return (
    <button className="w-full flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-violet-500/30 transition-all text-left group">
      <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/30 transition-colors">
        <Icon className="w-5 h-5 text-violet-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </button>
  )
}
