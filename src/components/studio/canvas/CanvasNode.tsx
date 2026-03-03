import { memo, useState, useCallback } from 'react'
import {
  X, Plus, Play, Loader2, Upload, Music, Image, Video, Type, Copy,
  Table2, FileText, Check, Paintbrush, Wand2, Maximize, Layers,
  RefreshCw, Scissors, Settings2, Sparkles, AtSign
} from 'lucide-react'
import type { CanvasNode, CanvasNodeData, CanvasNodeType } from '../../../store/types'
import { NODE_DEFAULTS, PORT_RADIUS, NODE_ICONS, IMAGE_MODELS, VIDEO_MODELS, ASPECT_RATIOS } from './constants'

// 端口快捷添加菜单项
const PORT_ADD_ITEMS: { type: CanvasNodeType; icon: React.ElementType; label: string; desc: string }[] = [
  { type: 'text',  icon: Type,  label: '文本生成', desc: '脚本、广告词、品牌文案' },
  { type: 'image', icon: Image, label: '图片生成', desc: 'AI 文生图 / 图生图' },
  { type: 'video', icon: Video, label: '视频生成', desc: 'AI 图生视频 / 文生视频' },
  { type: 'image', icon: Paintbrush, label: '图片编辑器', desc: '重绘、扩图、局部修改' },
]

// 选中图片/视频节点时的快捷操作
const IMAGE_ACTIONS = [
  { icon: Paintbrush, label: '重绘' },
  { icon: RefreshCw, label: '微调' },
  { icon: Wand2, label: '增强' },
  { icon: Maximize, label: '扩图' },
  { icon: Layers, label: '多角度' },
  { icon: Scissors, label: '抠图' },
]

// 边缘检测距离（px）
const EDGE_HIT_ZONE = 32

interface CanvasNodeViewProps {
  node: CanvasNode
  selected: boolean
  multiSelected: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onDelete: () => void
  onDuplicate: () => void
  onDataChange: (data: Partial<CanvasNodeData>) => void
  // 端口交互（保留用于连线层）
  onPortMouseDown: (nodeId: string, direction: 'output') => void
  onPortMouseUp: (nodeId: string, direction: 'input') => void
  connectingFrom: string | null
  isValidTarget: boolean
  // 端口快捷添加
  onQuickAdd?: (fromNodeId: string, type: CanvasNodeType) => void
  // 缩放
  onResizeStart?: (nodeId: string, e: React.MouseEvent) => void
}

function CanvasNodeViewInner({
  node, selected, multiSelected, onMouseDown, onDelete, onDuplicate,
  onDataChange, onPortMouseDown, onPortMouseUp, connectingFrom, isValidTarget,
  onQuickAdd, onResizeStart,
}: CanvasNodeViewProps) {
  const config = NODE_DEFAULTS[node.type]
  const Icon = NODE_ICONS[node.type]

  // 快捷菜单状态：点击+号后打开，点击空白关闭
  const [portMenu, setPortMenu] = useState<'left' | 'right' | null>(null)

  const handleMenuItemClick = useCallback((e: React.MouseEvent, type: CanvasNodeType) => {
    e.stopPropagation()
    setPortMenu(null)
    onQuickAdd?.(node.id, type)
  }, [node.id, onQuickAdd])

  const borderColor = selected
    ? config.color
    : multiSelected
      ? `${config.color}88`
      : isValidTarget && connectingFrom
        ? `${config.portColor}cc`
        : 'rgba(255,255,255,0.08)'

  // 计算节点实际高度（用于定位 + 号在垂直中点）
  const nodeHeight = node.height

  return (
    <div
      data-node="true"
      data-node-id={node.id}
      className={`absolute group ${selected || multiSelected ? 'z-20' : 'z-10'}`}
      style={{ left: node.x, top: node.y, width: node.width }}
      onMouseDown={onMouseDown}
    >
      {/* 选中/多选光晕 */}
      {(selected || (isValidTarget && connectingFrom)) && (
        <div className="absolute -inset-1 rounded-2xl opacity-30 pointer-events-none"
          style={{ boxShadow: `0 0 20px ${config.color}`, border: `1px solid ${config.color}40` }} />
      )}

      <div
        className="bg-[#1a1a1e] rounded-2xl overflow-hidden transition-all duration-150"
        style={{
          border: `1.5px solid ${borderColor}`,
          boxShadow: selected
            ? `0 4px 24px ${config.color}20, 0 0 0 1px ${config.color}30`
            : '0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        {/* 节点头部 */}
        <div
          className="flex items-center gap-2 px-3 py-2 cursor-grab active:cursor-grabbing"
          style={{ borderBottom: `1px solid rgba(255,255,255,0.05)` }}
        >
          <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${config.color}20` }}>
            <Icon className="w-3 h-3" style={{ color: config.color }} />
          </div>
          <span className="text-xs font-medium text-gray-300 flex-1 truncate">
            {node.data.label || node.type.charAt(0).toUpperCase() + node.type.slice(1)}
          </span>
          {/* 状态指示 */}
          {node.data.status === 'generating' && (
            <Loader2 className="w-3 h-3 animate-spin" style={{ color: config.color }} />
          )}
          {node.data.status === 'completed' && (
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
          {node.data.status === 'failed' && (
            <div className="w-2 h-2 rounded-full bg-red-400" />
          )}
          {/* 操作按钮 */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={e => { e.stopPropagation(); onDuplicate() }}
              className="p-0.5 rounded text-gray-500 hover:text-gray-300 transition-colors">
              <Copy className="w-3 h-3" />
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete() }}
              className="p-0.5 rounded text-gray-500 hover:text-red-400 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 节点内容区 */}
        <div className="p-3" style={{ minHeight: node.height - 44 }}>
          {node.type === 'text' && (
            <textarea
              value={node.data.text || ''}
              onChange={e => onDataChange({ text: e.target.value })}
              placeholder="输入文本 / 提示词..."
              className="w-full h-full bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none resize-none leading-relaxed"
              style={{ minHeight: node.height - 64 }}
              onMouseDown={e => e.stopPropagation()}
            />
          )}

          {node.type === 'image' && (
            <div className="flex items-center justify-center h-full rounded-xl"
              style={{ minHeight: node.height - 64, backgroundColor: 'rgba(139,92,246,0.03)' }}>
              {node.data.imageUrl ? (
                <img src={node.data.imageUrl} alt="" className="w-full h-auto rounded-lg" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${config.color}15` }}>
                    <Image className="w-6 h-6" style={{ color: `${config.color}60` }} />
                  </div>
                  {node.data.status === 'generating' ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                      <span className="text-xs text-gray-500">生成中...</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-600">等待输入</span>
                  )}
                </div>
              )}
            </div>
          )}

          {node.type === 'video' && (
            <div className="flex items-center justify-center h-full rounded-xl"
              style={{ minHeight: node.height - 64, backgroundColor: 'rgba(236,72,153,0.03)' }}>
              {node.data.videoUrl ? (
                <video src={node.data.videoUrl} className="w-full rounded-lg" controls />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${config.color}15` }}>
                    <Play className="w-6 h-6" style={{ color: `${config.color}60` }} />
                  </div>
                  {node.data.status === 'generating' ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-pink-400" />
                      <span className="text-xs text-gray-500">生成中...</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-600">等待输入</span>
                  )}
                </div>
              )}
            </div>
          )}

          {node.type === 'audio' && (
            <div className="flex items-center justify-center h-full rounded-xl"
              style={{ minHeight: node.height - 64, backgroundColor: 'rgba(245,158,11,0.03)' }}>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${config.color}15` }}>
                  <Music className="w-6 h-6" style={{ color: `${config.color}60` }} />
                </div>
                <span className="text-xs text-gray-600">等待输入</span>
              </div>
            </div>
          )}

          {node.type === 'upload' && (
            <div className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-xl cursor-pointer transition-all"
              style={{
                minHeight: node.height - 64,
                borderColor: 'rgba(16,185,129,0.15)',
              }}
              onMouseDown={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2"
                style={{ backgroundColor: `${config.color}10` }}>
                <Upload className="w-6 h-6" style={{ color: `${config.color}50` }} />
              </div>
              <span className="text-xs text-gray-500">拖拽或点击上传</span>
              <span className="text-[10px] text-gray-600 mt-1">支持图片/视频/音频</span>
            </div>
          )}

          {node.type === 'table' && (
            <TableNodeContent node={node} onDataChange={onDataChange} />
          )}

          {node.type === 'document' && (
            <div className="h-full rounded-xl overflow-auto" style={{ minHeight: node.height - 64, backgroundColor: 'rgba(245,158,11,0.03)' }}
              onMouseDown={e => e.stopPropagation()}>
              {node.data.documentContent ? (
                <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap p-2 max-h-60 overflow-auto">
                  {node.data.documentContent.slice(0, 2000)}
                  {(node.data.documentContent.length > 2000) && (
                    <span className="text-gray-600">{'\n'}...（共 {node.data.documentContent.length} 字）</span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${config.color}15` }}>
                    <FileText className="w-6 h-6" style={{ color: `${config.color}60` }} />
                  </div>
                  <span className="text-xs text-gray-600">空文档</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ====== 选中时：快捷操作栏（图片/视频节点） ====== */}
        {selected && (node.type === 'image' || node.type === 'video') && (
          <div className="border-t border-white/5">
            <div className="flex items-center gap-0.5 px-2 py-1.5 overflow-x-auto">
              {IMAGE_ACTIONS.map(action => (
                <button
                  key={action.label}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-gray-400 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
                  onClick={e => e.stopPropagation()}
                >
                  <action.icon className="w-3 h-3" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ====== 选中时：生成信息摘要栏 ====== */}
        {selected && (node.type === 'image' || node.type === 'video') && (
          <div className="border-t border-white/5 px-3 py-2" onMouseDown={e => e.stopPropagation()}>
            {/* Prompt 预览 */}
            {(node.data.imagePrompt || node.data.videoPrompt) && (
              <div className="text-[11px] text-gray-400 leading-relaxed mb-2 line-clamp-3">
                {node.data.imagePrompt || node.data.videoPrompt}
              </div>
            )}
            {/* 模型 & 规格信息 */}
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" style={{ color: config.color }} />
                {(() => {
                  const models = node.type === 'image' ? IMAGE_MODELS : VIDEO_MODELS
                  return models.find(m => m.id === node.data.model)?.name || models[0]?.name || '未选择'
                })()}
              </span>
              {node.data.aspectRatio && (
                <>
                  <span className="text-gray-600">·</span>
                  <span>{node.data.aspectRatio}</span>
                </>
              )}
              {node.data.resolution && (
                <>
                  <span className="text-gray-600">·</span>
                  <span>{node.data.resolution}</span>
                </>
              )}
              {node.type === 'video' && node.data.videoDuration && (
                <>
                  <span className="text-gray-600">·</span>
                  <span>{node.data.videoDuration}s</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ====== 右下角缩放手柄（选中时显示） ====== */}
      {selected && onResizeStart && (
        <div
          className="absolute z-30 cursor-nwse-resize"
          style={{ right: -4, bottom: -4, width: 12, height: 12 }}
          onMouseDown={e => { e.stopPropagation(); e.preventDefault(); onResizeStart(node.id, e) }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" className="text-gray-500 hover:text-white transition-colors">
            <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="10" y1="6" x2="6" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="10" y1="10" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* ====== 左侧 + 号（固定在边缘垂直中点，hover 时显示） ====== */}
      {!portMenu && (
        <div
          className="absolute z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{ left: -24, top: nodeHeight / 2 - 12 }}
          onMouseDown={e => { e.stopPropagation(); e.preventDefault(); setPortMenu('left') }}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer bg-[#2a2a2e]/90 border border-white/15 shadow-lg backdrop-blur-sm hover:bg-white/20 hover:border-white/30 hover:scale-110 transition-all">
            <Plus className="w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>
      )}

      {/* ====== 右侧 + 号（固定在边缘垂直中点，hover 时显示） ====== */}
      {!portMenu && (
        <div
          className="absolute z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{ right: -24, top: nodeHeight / 2 - 12 }}
          onMouseDown={e => { e.stopPropagation(); e.preventDefault(); setPortMenu('right') }}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer bg-[#2a2a2e]/90 border border-white/15 shadow-lg backdrop-blur-sm hover:bg-white/20 hover:border-white/30 hover:scale-110 transition-all">
            <Plus className="w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>
      )}

      {/* ====== 快捷添加菜单 ====== */}
      {portMenu && (
        <>
          {/* 点击空白处关闭 */}
          <div className="fixed inset-0 z-40"
            onClick={() => setPortMenu(null)}
            onMouseDown={e => e.stopPropagation()}
            onContextMenu={e => { e.preventDefault(); setPortMenu(null) }}
          />
          <div
            className="absolute z-50 w-56 bg-[#1c1c20] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
            style={{
              left: portMenu === 'right' ? node.width + 16 : undefined,
              right: portMenu === 'left' ? node.width + 16 : undefined,
              top: nodeHeight / 2 - 80,
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            <div className="px-3 pt-3 pb-1.5 text-[10px] text-gray-500 font-medium uppercase tracking-wider">
              引用该节点生成
            </div>
            {PORT_ADD_ITEMS.map((item, idx) => (
              <button
                key={idx}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
                onClick={e => handleMenuItemClick(e, item.type)}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${NODE_DEFAULTS[item.type].color}15` }}>
                  <item.icon className="w-4 h-4" style={{ color: NODE_DEFAULTS[item.type].color }} />
                </div>
                <div>
                  <div className="text-sm text-gray-200">{item.label}</div>
                  <div className="text-[10px] text-gray-500">{item.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ========== 表格节点内容（可选行） ==========
function TableNodeContent({ node, onDataChange }: { node: CanvasNode; onDataChange: (data: Partial<CanvasNodeData>) => void }) {
  const headers = node.data.tableHeaders || []
  const rows = node.data.tableRows || []
  const selected = new Set(node.data.selectedRowIndices || [])

  const toggleRow = (idx: number) => {
    const next = new Set(selected)
    next.has(idx) ? next.delete(idx) : next.add(idx)
    onDataChange({ selectedRowIndices: Array.from(next) })
  }

  const selectAll = () => {
    if (selected.size === rows.length) {
      onDataChange({ selectedRowIndices: [] })
    } else {
      onDataChange({ selectedRowIndices: rows.map((_, i) => i) })
    }
  }

  if (rows.length === 0 && headers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2" style={{ minHeight: 200 }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(6,182,212,0.1)' }}>
          <Table2 className="w-6 h-6" style={{ color: 'rgba(6,182,212,0.5)' }} />
        </div>
        <span className="text-xs text-gray-600">空表格</span>
      </div>
    )
  }

  const maxCols = Math.max(headers.length, ...rows.map(r => r.length))
  const displayCols = Math.min(maxCols, 5)

  return (
    <div className="h-full overflow-hidden rounded-lg" onMouseDown={e => e.stopPropagation()} style={{ minHeight: node.height - 64 }}>
      {/* 表头信息 + 全选 */}
      <div className="flex items-center justify-between px-2 py-1 bg-cyan-500/5 border-b border-white/5">
        <span className="text-[10px] text-gray-500">{rows.length} 行 × {maxCols} 列{node.data.sheetName ? ` · ${node.data.sheetName}` : ''}</span>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <span className="text-[10px] text-cyan-400">{selected.size} 行已选</span>
          )}
          <button onClick={selectAll} className="text-[10px] text-gray-500 hover:text-cyan-400 transition-colors">
            {selected.size === rows.length ? '取消全选' : '全选'}
          </button>
        </div>
      </div>
      {/* 表格 */}
      <div className="overflow-auto max-h-56">
        <table className="w-full border-collapse text-[11px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#151520]">
              <th className="w-6 px-1 py-1 border-b border-r border-white/5 text-gray-600 text-center">#</th>
              {Array.from({ length: displayCols }, (_, i) => (
                <th key={i} className="px-2 py-1 text-left text-cyan-300/80 font-medium border-b border-r border-white/5 whitespace-nowrap truncate max-w-[100px]">
                  {headers[i] != null ? String(headers[i]) : ''}
                </th>
              ))}
              {maxCols > displayCols && <th className="px-1 py-1 text-gray-600 border-b border-white/5">...</th>}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 50).map((row, idx) => {
              const isSelected = selected.has(idx)
              return (
                <tr key={idx}
                  className={`cursor-pointer transition-colors ${isSelected ? 'bg-cyan-500/10' : idx % 2 === 0 ? 'bg-transparent hover:bg-white/3' : 'bg-white/[0.02] hover:bg-white/3'}`}
                  onClick={() => toggleRow(idx)}>
                  <td className="px-1 py-0.5 text-center border-r border-white/5">
                    {isSelected ? (
                      <Check className="w-3 h-3 text-cyan-400 mx-auto" />
                    ) : (
                      <span className="text-gray-600">{idx + 1}</span>
                    )}
                  </td>
                  {Array.from({ length: displayCols }, (_, ci) => {
                    const cell = row[ci]
                    return (
                      <td key={ci} className="px-2 py-0.5 text-gray-400 border-r border-white/5 truncate max-w-[100px]" title={cell != null ? String(cell) : ''}>
                        {cell != null ? String(cell) : ''}
                      </td>
                    )
                  })}
                  {maxCols > displayCols && <td className="px-1 py-0.5 text-gray-600">...</td>}
                </tr>
              )
            })}
            {rows.length > 50 && (
              <tr><td colSpan={displayCols + 2} className="text-center text-[10px] text-gray-600 py-1">...还有 {rows.length - 50} 行</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default memo(CanvasNodeViewInner)
