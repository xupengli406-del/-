import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { CopilotMode, CopilotMessage, ContextReference, ActionDiff, ActiveContext } from './types'

interface CopilotState {
  // 当前模式
  mode: CopilotMode
  
  // 消息历史
  messages: CopilotMessage[]
  
  // 当前输入
  inputValue: string
  
  // @提及相关
  mentionQuery: string
  showMentionPopup: boolean
  mentionCursorPosition: number
  
  // 当前上下文
  activeContext: ActiveContext
  
  // 执行历史（用于回退）
  actionHistory: ActionDiff[]
  
  // 加载状态
  isGenerating: boolean
  
  // Actions
  setMode: (mode: CopilotMode) => void
  setInputValue: (value: string) => void
  
  // 消息操作
  addMessage: (message: Omit<CopilotMessage, 'id' | 'timestamp'>) => void
  updateMessage: (id: string, updates: Partial<CopilotMessage>) => void
  clearMessages: () => void
  
  // @提及操作
  setMentionQuery: (query: string) => void
  setShowMentionPopup: (show: boolean) => void
  insertMention: (reference: ContextReference) => void
  
  // 上下文操作
  setActiveContext: (context: Partial<ActiveContext>) => void
  addSelectedAsset: (asset: ContextReference) => void
  removeSelectedAsset: (id: string) => void
  clearSelectedAssets: () => void
  
  // 执行操作
  addAction: (action: Omit<ActionDiff, 'id' | 'timestamp'>) => void
  revertAction: (actionId: string) => void
  
  // 生成状态
  setIsGenerating: (generating: boolean) => void
  
  // 发送消息（模拟AI响应）
  sendMessage: (content: string, references?: ContextReference[]) => Promise<void>
}

export const useCopilotStore = create<CopilotState>()(
  immer((set, get) => ({
    mode: 'chat',
    messages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: '你好！我是你的AI创作助手 🎬\n\n我可以帮你：\n- **💬 询问模式**：剧情推演、台词润色、提示优化\n- **⚡ 执行模式**：批量创建分镜、自动生成节点\n\n试试选中左侧资产或输入 @ 来引用特定内容！',
        timestamp: new Date(),
        mode: 'chat',
        status: 'completed'
      }
    ],
    inputValue: '',
    mentionQuery: '',
    showMentionPopup: false,
    mentionCursorPosition: 0,
    activeContext: {
      selectedAssets: []
    },
    actionHistory: [],
    isGenerating: false,

    setMode: (mode) => set((state) => {
      state.mode = mode
    }),

    setInputValue: (value) => set((state) => {
      state.inputValue = value
      // 检测@符号触发提及
      const lastAtIndex = value.lastIndexOf('@')
      if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
        state.showMentionPopup = true
        state.mentionQuery = ''
        state.mentionCursorPosition = lastAtIndex
      } else if (lastAtIndex !== -1 && value.length > lastAtIndex + 1) {
        const afterAt = value.slice(lastAtIndex + 1)
        if (!afterAt.includes(' ')) {
          state.showMentionPopup = true
          state.mentionQuery = afterAt
          state.mentionCursorPosition = lastAtIndex
        } else {
          state.showMentionPopup = false
        }
      } else {
        state.showMentionPopup = false
      }
    }),

    addMessage: (message) => set((state) => {
      state.messages.push({
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date()
      })
    }),

    updateMessage: (id, updates) => set((state) => {
      const msg = state.messages.find(m => m.id === id)
      if (msg) {
        Object.assign(msg, updates)
      }
    }),

    clearMessages: () => set((state) => {
      state.messages = [{
        id: 'welcome',
        role: 'assistant',
        content: '对话已清空，有什么可以帮助你的？',
        timestamp: new Date(),
        mode: 'chat',
        status: 'completed'
      }]
    }),

    setMentionQuery: (query) => set((state) => {
      state.mentionQuery = query
    }),

    setShowMentionPopup: (show) => set((state) => {
      state.showMentionPopup = show
    }),

    insertMention: (reference) => set((state) => {
      const before = state.inputValue.slice(0, state.mentionCursorPosition)
      const after = state.inputValue.slice(state.mentionCursorPosition + state.mentionQuery.length + 1)
      state.inputValue = `${before}@${reference.name} ${after}`
      state.showMentionPopup = false
      state.mentionQuery = ''
      
      // 添加到选中资产
      if (!state.activeContext.selectedAssets.find(a => a.id === reference.id)) {
        state.activeContext.selectedAssets.push(reference)
      }
    }),

    setActiveContext: (context) => set((state) => {
      Object.assign(state.activeContext, context)
    }),

    addSelectedAsset: (asset) => set((state) => {
      if (!state.activeContext.selectedAssets.find(a => a.id === asset.id)) {
        state.activeContext.selectedAssets.push(asset)
      }
    }),

    removeSelectedAsset: (id) => set((state) => {
      state.activeContext.selectedAssets = state.activeContext.selectedAssets.filter(a => a.id !== id)
    }),

    clearSelectedAssets: () => set((state) => {
      state.activeContext.selectedAssets = []
    }),

    addAction: (action) => set((state) => {
      const newAction: ActionDiff = {
        ...action,
        id: `action-${Date.now()}`,
        timestamp: new Date()
      }
      state.actionHistory.unshift(newAction)
    }),

    revertAction: (actionId) => set((state) => {
      const action = state.actionHistory.find(a => a.id === actionId)
      if (action && action.canRevert) {
        action.canRevert = false
        // 添加系统消息表示回退
        state.messages.push({
          id: `msg-revert-${Date.now()}`,
          role: 'system',
          content: `✅ 已撤销操作：${action.description}`,
          timestamp: new Date(),
          mode: 'action',
          status: 'completed'
        })
      }
    }),

    setIsGenerating: (generating) => set((state) => {
      state.isGenerating = generating
    }),

    sendMessage: async (content, references) => {
      const state = get()
      const mode = state.mode
      
      // 添加用户消息
      set((s) => {
        s.messages.push({
          id: `msg-user-${Date.now()}`,
          role: 'user',
          content,
          timestamp: new Date(),
          mode,
          references,
          status: 'completed'
        })
        s.inputValue = ''
        s.isGenerating = true
      })

      // 模拟AI响应延迟
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200))

      // 生成模拟响应
      if (mode === 'chat') {
        // 询问模式的响应
        const responses = [
          `好的，让我帮你分析一下这个场景...\n\n根据你的描述，我建议可以从以下几个角度来强化戏剧张力：\n\n1. **情绪递进**：从平静→紧张→爆发\n2. **镜头语言**：使用特写捕捉微表情\n3. **节奏控制**：对白之间留白制造悬念`,
          `这是一个很有趣的创意方向！\n\n我来帮你细化一下分镜描述：\n\n**分镜1**：远景，展现场景全貌\n**分镜2**：中景，角色入场\n**分镜3**：近景，情绪特写\n**分镜4**：动作镜头，冲突爆发\n**分镜5**：定格，悬念收尾`,
          `根据角色设定，我建议这段对白可以这样调整：\n\n> "你以为...你真的以为这样就结束了吗？"\n\n加入停顿和语气词，更能体现角色内心的挣扎与愤怒。`
        ]
        const response = responses[Math.floor(Math.random() * responses.length)]
        
        set((s) => {
          s.messages.push({
            id: `msg-ai-${Date.now()}`,
            role: 'assistant',
            content: response,
            timestamp: new Date(),
            mode: 'chat',
            status: 'completed'
          })
          s.isGenerating = false
        })
      } else {
        // 执行模式的响应（带Action Diff）
        const actionResponse = `⚡ **执行完成**\n\n已根据你的指令完成以下操作：\n\n- 创建了 5 个分镜节点\n- 自动填入中文提示词\n- 关联了角色资产\n\n所有节点已添加到当前剧集时间线中。`
        
        const actionDiff: ActionDiff = {
          id: `action-${Date.now()}`,
          type: 'batch',
          targetType: 'frame',
          targetIds: ['frame-1', 'frame-2', 'frame-3', 'frame-4', 'frame-5'],
          description: '批量创建5个分镜节点',
          previousState: {},
          newState: { framesCreated: 5 },
          timestamp: new Date(),
          canRevert: true
        }
        
        set((s) => {
          s.messages.push({
            id: `msg-ai-${Date.now()}`,
            role: 'assistant',
            content: actionResponse,
            timestamp: new Date(),
            mode: 'action',
            action: actionDiff,
            status: 'completed'
          })
          s.actionHistory.unshift(actionDiff)
          s.isGenerating = false
        })
      }
    }
  }))
)
