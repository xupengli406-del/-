import { useState } from 'react'
import { X, Plus, ChevronLeft, Send, ChevronDown, Sparkles } from 'lucide-react'

interface Props {
  onClose: () => void
}

interface Message {
  id: number
  role: 'ai' | 'user'
  content: string
}

export default function CanvasAIPanel({ onClose }: Props) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [chatMode, setChatMode] = useState('对话模式')
  const [model, setModel] = useState('Gemini3 Flash')
  const [showModeDropdown, setShowModeDropdown] = useState(false)
  const [showModelDropdown, setShowModelDropdown] = useState(false)

  const handleSend = () => {
    if (!input.trim()) return
    const userMsg: Message = { id: Date.now(), role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')

    // 模拟AI回复
    setTimeout(() => {
      const aiMsg: Message = {
        id: Date.now() + 1,
        role: 'ai',
        content: '收到你的消息！我是Octopus AI助手，可以帮你进行漫剧创作。你可以描述你想要的场景、角色或剧情，我来帮你生成。',
      }
      setMessages(prev => [...prev, aiMsg])
    }, 800)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const modes = ['对话模式', '创作模式', '编辑模式']
  const models = ['Gemini3 Flash', 'Gemini3 Pro', 'GPT-4o', 'Claude 3.5']

  return (
    <div className="w-80 bg-[#111111] border-l border-white/5 flex flex-col flex-shrink-0 z-20 relative">
      {/* 折叠按钮 */}
      <button
        onClick={onClose}
        className="absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-10 bg-[#1a1a1a] border border-white/10 rounded-l-md flex items-center justify-center hover:bg-white/10 transition-colors z-30"
      >
        <ChevronLeft className="w-3 h-3 text-gray-400" />
      </button>

      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors z-10"
      >
        <X className="w-3.5 h-3.5 text-gray-500" />
      </button>

      {/* 聊天内容区 */}
      <div className="flex-1 overflow-y-auto p-5">
        {messages.length === 0 ? (
          // 空状态：欢迎信息
          <div>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-1">
              Hi，创作者
            </h2>
            <p className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-6">
              在寻找哪方面的灵感？
            </p>

            {/* 提示卡片 */}
            <div className="bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden mb-4">
              <div className="h-24 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-gray-600" />
              </div>
              <div className="p-3">
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  拖拽图片/视频节点到对话框中，解锁超级节点内容生成提示词等进阶玩法，可为创作提供更多灵感～
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <button className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors">不再显示</button>
                  <button className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors">知道了</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // 消息列表
          <div className="space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-500/20 text-blue-100'
                    : 'bg-white/5 text-gray-300'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部输入区 */}
      <div className="p-3 border-t border-white/5">
        {/* 输入框 */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden mb-2.5">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="开启你的灵感之旅"
            rows={2}
            className="w-full bg-transparent text-sm text-gray-300 placeholder-gray-600 p-3 outline-none resize-none"
          />
        </div>

        {/* 底部工具栏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <Plus className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {/* 对话模式选择 */}
            <div className="relative">
              <button
                onClick={() => { setShowModeDropdown(!showModeDropdown); setShowModelDropdown(false) }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-gray-400 transition-colors"
              >
                <span>○</span>
                {chatMode}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showModeDropdown && (
                <div className="absolute bottom-full left-0 mb-1 bg-[#1e1e1e] border border-white/10 rounded-lg py-1 min-w-[120px] z-50 shadow-xl">
                  {modes.map(mode => (
                    <button
                      key={mode}
                      onClick={() => { setChatMode(mode); setShowModeDropdown(false) }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                        chatMode === mode ? 'text-white bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 模型选择 */}
            <div className="relative">
              <button
                onClick={() => { setShowModelDropdown(!showModelDropdown); setShowModeDropdown(false) }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-gray-400 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                {model}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showModelDropdown && (
                <div className="absolute bottom-full left-0 mb-1 bg-[#1e1e1e] border border-white/10 rounded-lg py-1 min-w-[140px] z-50 shadow-xl">
                  {models.map(m => (
                    <button
                      key={m}
                      onClick={() => { setModel(m); setShowModelDropdown(false) }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                        model === m ? 'text-white bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 发送按钮 */}
          <button
            onClick={handleSend}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              input.trim()
                ? 'bg-blue-500 hover:bg-blue-400 text-white'
                : 'bg-white/5 text-gray-600'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
