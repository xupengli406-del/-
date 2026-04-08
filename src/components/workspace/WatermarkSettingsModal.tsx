import { useState } from 'react'
import { X } from 'lucide-react'
import { useAccountStore } from '../../store/accountStore'

interface WatermarkSettingsModalProps {
  open: boolean
  onClose: () => void
}

export default function WatermarkSettingsModal({ open, onClose }: WatermarkSettingsModalProps) {
  const { globalWatermarkDisabled, setGlobalWatermarkDisabled } = useAccountStore()
  const [localValue, setLocalValue] = useState(globalWatermarkDisabled)

  const handleSave = () => {
    setGlobalWatermarkDisabled(localValue)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/25 px-6 backdrop-blur-[2px]">
      <div className="w-full max-w-[520px] rounded-[24px] border border-black/5 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h3 className="text-[18px] font-semibold text-slate-900">AI 生成内容水印管理规则</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* 说明文字 */}
        <div className="px-6 pb-4">
          <div className="rounded-2xl bg-slate-50 p-4 text-[13px] leading-6 text-slate-600">
            <p>
              根据相关法规要求，AI 生成的内容默认添加水印标识。开启「去 AI 水印」后，
              生成的图片和视频将不再添加 AI 标识水印。
            </p>
            <p className="mt-2 text-[12px] text-slate-400">
              请注意：去除水印后的内容仍需遵守相关法律法规，不得用于误导公众或冒充真实创作。
            </p>
          </div>
        </div>

        <div className="mx-6 h-px bg-slate-100" />

        {/* Toggle */}
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[14px] font-medium text-slate-800">去 AI 水印</div>
              <div className="mt-0.5 text-[12px] text-slate-400">
                开启后，所有新生成的图片和视频将不添加 AI 水印。
              </div>
            </div>
            <button
              onClick={() => setLocalValue(!localValue)}
              className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 ${
                localValue ? 'bg-brand' : 'bg-slate-200'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  localValue ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="px-6 pb-6">
          <button
            onClick={handleSave}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-brand text-[15px] font-semibold text-white transition hover:bg-brand/90"
          >
            保存设置
          </button>
        </div>
      </div>
    </div>
  )
}
