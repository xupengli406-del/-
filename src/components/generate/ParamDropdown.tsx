import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export default function ParamDropdown<T extends string | number>({
  label,
  value,
  options,
  onChange,
  icon,
}: {
  label?: string
  value: T
  options: { label: string; value: T }[]
  onChange: (v: T) => void
  icon?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const currentLabel = options.find((o) => o.value === value)?.label || String(value)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-2.5 py-1 bg-apple-bg-secondary rounded-lg border border-apple-border-light flex items-center gap-1.5 text-xs text-apple-text-secondary hover:border-apple-border transition-colors"
      >
        {icon}
        {label ? `${label}: ` : ''}{currentLabel}
        <ChevronDown size={10} className="text-apple-text-tertiary" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-1 min-w-[120px] bg-white rounded-xl border border-apple-border-light shadow-lg overflow-hidden z-50">
            {options.map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full px-3 py-2 text-xs text-left transition-colors flex items-center justify-between ${
                  opt.value === value ? 'text-brand bg-brand-50' : 'text-apple-text hover:bg-apple-bg-secondary'
                }`}
              >
                {opt.label}
                {opt.value === value && <Check size={10} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
