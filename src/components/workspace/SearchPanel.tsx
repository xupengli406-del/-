import { useState, useRef, useEffect } from 'react'
import { Search, SlidersHorizontal, Info } from 'lucide-react'

const searchOptions = [
  { key: 'path', label: 'path:', desc: '匹配文件路径' },
  { key: 'file', label: 'file:', desc: '匹配文件名' },
  { key: 'tag', label: 'tag:', desc: '搜索标签' },
  { key: 'line', label: 'line:', desc: '以行为单位搜索关键词' },
  { key: 'section', label: 'section:', desc: '以章节为单位搜索关键词' },
  { key: 'property', label: '[property]', desc: '匹配笔记属性' },
]

export default function SearchPanel() {
  const [query, setQuery] = useState('')
  const [showOptions, setShowOptions] = useState(false)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSelectOption = (key: string) => {
    setQuery((prev) => prev + key + ':')
    setShowOptions(false)
    inputRef.current?.focus()
  }

  return (
    <div className="h-full flex flex-col">
      {/* 搜索输入 */}
      <div className="px-3 py-2">
        <div className="search-input-container">
          <Search size={13} className="text-apple-text-tertiary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowOptions(true)}
            placeholder="输入并开始搜索"
            className="flex-1 bg-transparent text-xs text-apple-text outline-none placeholder:text-apple-text-tertiary"
          />
          <button
            onClick={() => setCaseSensitive(!caseSensitive)}
            className={`text-[10px] font-bold px-1 rounded ${caseSensitive ? 'text-brand bg-brand/10' : 'text-apple-text-tertiary hover:text-apple-text-secondary'}`}
            title="区分大小写"
          >
            Aa
          </button>
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="text-apple-text-tertiary hover:text-apple-text-secondary"
            title="搜索选项"
          >
            <SlidersHorizontal size={13} />
          </button>
        </div>
      </div>

      {/* 搜索选项下拉 */}
      {showOptions && (
        <div className="search-options-dropdown">
          <div className="flex items-center gap-1 px-3 py-1.5 text-[11px] text-apple-text-secondary font-medium">
            搜索选项
            <Info size={11} className="text-apple-text-tertiary" />
          </div>
          {searchOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleSelectOption(opt.key)}
              className="search-option-item"
            >
              <span className="search-option-key">{opt.label}</span>
              <span className="search-option-desc">{opt.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* 搜索结果 */}
      <div className="flex-1 overflow-y-auto px-3">
        {!query && !showOptions && (
          <div className="flex flex-col items-center justify-center h-32 text-apple-text-tertiary">
            <Search size={24} strokeWidth={1} className="mb-2 opacity-40" />
            <span className="text-[11px]">输入关键词搜索</span>
          </div>
        )}
      </div>
    </div>
  )
}
