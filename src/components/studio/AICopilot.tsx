import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { 
  MessageCircle, 
  Zap, 
  Send, 
  Sparkles,
  RotateCcw,
  X,
  User,
  Bot,
  AtSign,
  ChevronDown,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  History,
  Settings,
  PanelRightClose
} from 'lucide-react'
import { useCopilotStore } from '../../store/copilotStore'
import { useProjectStore } from '../../store'
import type { ContextReference, CopilotMessage } from '../../store/types'

interface AICopilotProps {
  collapsed: boolean
  onToggle: () => void
}

export default function AICopilot({ collapsed, onToggle }: AICopilotProps) {
  const {
    mode,
    messages,
    inputValue,
    showMentionPopup,
    mentionQuery,
    activeContext,
    isGenerating,
    setMode,
    setInputValue,
    insertMention,
    setShowMentionPopup,
    removeSelectedAsset,
    sendMessage,
    clearMessages
  } = useCopilotStore()

  const { characters, environments, scripts, storyboards, openTabs, activeTabId } = useProjectStore()
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const activeTab = openTabs.find(t => t.id === activeTabId)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 构建可@提及的资产列表
  const mentionableAssets: ContextReference[] = [
    ...characters.map(c => ({
      id: c.id,
      type: 'character' as const,
      name: c.name,
      entityId: c.id
    })),
    ...environments.map(e => ({
      id: e.id,
      type: 'environment' as const,
      name: e.name,
      entityId: e.id
    })),
    ...scripts.map(s => ({
      id: s.id,
      type: 'script' as const,
      name: s.name,
      entityId: s.id
    })),
    ...storyboards.map(sb => ({
      id: sb.id,
      type: 'storyboard' as const,
      name: sb.name,
      entityId: sb.id
    }))
  ]

  // 过滤@提及列表
  const filteredMentions = mentionableAssets.filter(asset =>
    asset.name.toLowerCase().includes(mentionQuery.toLowerCase())
  )

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === 'Escape' && showMentionPopup) {
      setShowMentionPopup(false)
    }
  }

  const handleSend = () => {
    if (!inputValue.trim() || isGenerating) return
    sendMessage(inputValue.trim(), activeContext.selectedAssets)
  }

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (collapsed) {
    return (
      <div className="w-12 bg-[#111] border-l border-white/5 flex flex-col items-center py-3 gap-2">
        <button 
          onClick={onToggle}
          className="p-2 rounded-lg text-violet-400 hover:text-white hover:bg-white/5 transition-colors" 
          title="AI 副驾"
        >
          <Sparkles className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors" title="历史">
          <History className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors" title="设置">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="w-96 bg-[#111] border-l border-white/5 flex flex-col overflow-hidden flex-shrink-0">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">AI 副驾</h3>
            <p className="text-xs text-gray-500">Multi-modal Co-pilot</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearMessages}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
            title="清空对话"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
            title="收起面板"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 动态上下文感知条 */}
      {activeTab && (
        <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-gray-500">正在查看：</span>
            <span className="text-gray-300 font-medium truncate">{activeTab.title}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
              activeTab.type === 'script' ? 'bg-amber-500/20 text-amber-400' :
              activeTab.type === 'storyboard_edit' ? 'bg-violet-500/20 text-violet-400' :
              activeTab.type === 'character' ? 'bg-purple-500/20 text-purple-400' :
              activeTab.type === 'episode' ? 'bg-blue-500/20 text-blue-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {activeTab.type === 'script' ? '剧本' :
               activeTab.type === 'storyboard_edit' ? '分镜' :
               activeTab.type === 'character' ? '角色' :
               activeTab.type === 'episode' ? '剧集' :
               activeTab.type === 'environment' ? '场景' : activeTab.type}
            </span>
          </div>
        </div>
      )}

      {/* 模式切换指示器 */}
      <div className="px-4 py-2 border-b border-white/5">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">当前模式:</span>
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
            mode === 'chat' 
              ? 'bg-blue-500/20 text-blue-400' 
              : 'bg-amber-500/20 text-amber-400'
          }`}>
            {mode === 'chat' ? (
              <>
                <MessageCircle className="w-3 h-3" />
                询问模式
              </>
            ) : (
              <>
                <Zap className="w-3 h-3" />
                执行模式
              </>
            )}
          </span>
        </div>
      </div>

      {/* 当前上下文标签 */}
      {activeContext.selectedAssets.length > 0 && (
        <div className="px-4 py-2 border-b border-white/5">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-gray-500 mr-1">引用:</span>
            {activeContext.selectedAssets.map(asset => (
              <span
                key={asset.id}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                  asset.type === 'character'
                    ? 'bg-violet-500/20 text-violet-400'
                    : 'bg-cyan-500/20 text-cyan-400'
                }`}
              >
                @{asset.name}
                <button
                  onClick={() => removeSelectedAsset(asset.id)}
                  className="hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onCopy={handleCopy}
            copiedId={copiedId}
          />
        ))}
        
        {/* 生成中指示器 */}
        {isGenerating && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 bg-white/5 rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">思考中...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t border-white/5 space-y-3">
        {/* @提及弹出框 */}
        {showMentionPopup && filteredMentions.length > 0 && (
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
            <div className="px-3 py-2 border-b border-white/5">
              <span className="text-xs text-gray-500">选择要引用的资产</span>
            </div>
            {filteredMentions.map(asset => (
              <button
                key={asset.id}
                onClick={() => insertMention(asset)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors text-left"
              >
                <div className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
                  asset.type === 'character' ? 'bg-violet-500/20 text-violet-400' :
                  asset.type === 'script' ? 'bg-amber-500/20 text-amber-400' :
                  asset.type === 'storyboard' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-cyan-500/20 text-cyan-400'
                }`}>
                  {asset.type === 'character' ? '角' : 
                   asset.type === 'script' ? '本' :
                   asset.type === 'storyboard' ? '镜' : '景'}
                </div>
                <div>
                  <p className="text-sm text-white">{asset.name}</p>
                  <p className="text-xs text-gray-500">
                    {asset.type === 'character' ? '角色' : 
                     asset.type === 'script' ? '剧本' :
                     asset.type === 'storyboard' ? '分镜' : '场景'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 输入框 */}
        <div className="relative">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'chat' 
              ? "输入问题，讨论剧情、优化提示词..." 
              : "描述要执行的操作，如：创建5个分镜..."
            }
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500/50 transition-colors resize-none"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isGenerating}
            className={`absolute right-3 bottom-3 p-2 rounded-lg transition-all ${
              inputValue.trim() && !isGenerating
                ? 'bg-violet-600 hover:bg-violet-500 text-white'
                : 'bg-white/5 text-gray-600 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* 底部工具栏 */}
        <div className="flex items-center justify-between">
          {/* 模式切换 */}
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg">
            <button
              onClick={() => setMode('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                mode === 'chat'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              询问
            </button>
            <button
              onClick={() => setMode('action')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                mode === 'action'
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              执行
            </button>
          </div>

          {/* 快捷操作 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setInputValue(inputValue + '@')}
              className="p-1.5 rounded-lg text-gray-500 hover:text-violet-400 hover:bg-white/5 transition-colors"
              title="@提及资产"
            >
              <AtSign className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 消息气泡组件
function MessageBubble({ 
  message, 
  onCopy, 
  copiedId 
}: { 
  message: CopilotMessage
  onCopy: (content: string, id: string) => void
  copiedId: string | null
}) {
  const { revertAction } = useCopilotStore()
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="px-4 py-2 rounded-full bg-white/5 text-xs text-gray-400 flex items-center gap-2">
          <AlertCircle className="w-3 h-3" />
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* 头像 */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isUser 
          ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
          : 'bg-gradient-to-br from-violet-500 to-purple-600'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* 消息内容 */}
      <div className={`flex-1 max-w-[85%] ${isUser ? 'flex flex-col items-end' : ''}`}>
        {/* 引用标签 */}
        {message.references && message.references.length > 0 && (
          <div className="flex items-center gap-1 mb-1 flex-wrap">
            {message.references.map(ref => (
              <span
                key={ref.id}
                className={`px-1.5 py-0.5 rounded text-xs ${
                  ref.type === 'character'
                    ? 'bg-violet-500/20 text-violet-400'
                    : 'bg-cyan-500/20 text-cyan-400'
                }`}
              >
                @{ref.name}
              </span>
            ))}
          </div>
        )}

        {/* 气泡 */}
        <div className={`rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-violet-600 text-white rounded-tr-none' 
            : 'bg-white/5 text-gray-100 rounded-tl-none'
        }`}>
          {/* 消息文本 */}
          <div className="text-sm whitespace-pre-wrap leading-relaxed">
            {message.content.split('\n').map((line, i) => {
              // 简单的Markdown渲染
              const boldRegex = /\*\*(.+?)\*\*/g
              const parts = line.split(boldRegex)
              return (
                <p key={i} className={i > 0 ? 'mt-2' : ''}>
                  {parts.map((part, j) => 
                    j % 2 === 1 ? (
                      <strong key={j} className="font-semibold">{part}</strong>
                    ) : (
                      <span key={j}>{part}</span>
                    )
                  )}
                </p>
              )
            })}
          </div>

          {/* Action模式的执行结果 */}
          {message.action && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                    {message.action.type === 'batch' ? '批量操作' : message.action.type}
                  </span>
                  <span className="text-gray-500">
                    影响 {message.action.targetIds.length} 个节点
                  </span>
                </div>
                {message.action.canRevert && (
                  <button
                    onClick={() => revertAction(message.action!.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-red-500/20 text-gray-400 hover:text-red-400 text-xs transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    撤销
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 消息操作栏 */}
        {!isUser && (
          <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onCopy(message.content, message.id)}
              className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              title="复制"
            >
              {copiedId === message.id ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}

        {/* 时间戳 */}
        <span className="text-[10px] text-gray-600 mt-1">
          {new Date(message.timestamp).toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>
    </div>
  )
}
