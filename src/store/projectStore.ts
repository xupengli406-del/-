import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { IPProject, Season, Episode, Scene, Frame, Character, Environment, Prop, WorkTab, GenerationTask, Version, Script, Storyboard, StoryboardPanel, CanvasImportItem } from './types'

// 模拟数据
const mockProjects: IPProject[] = [
  {
    id: '1',
    name: '星辰变第一季',
    description: '修真奇幻漫剧，讲述秦羽的修炼之路',
    coverColor: 'from-blue-500 to-purple-600',
    seasons: [
      {
        id: 's1',
        name: '第一季',
        episodes: [
          { id: 'e1', name: '第1集 - 废柴少年', scenes: [], status: 'completed' },
          { id: 'e2', name: '第2集 - 奇遇', scenes: [], status: 'in_progress' },
          { id: 'e3', name: '第3集 - 觉醒', scenes: [], status: 'draft' },
        ]
      }
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-28'),
    status: 'active'
  },
  {
    id: '2',
    name: '都市逆袭',
    description: '现代都市重生逆袭故事',
    coverColor: 'from-orange-500 to-red-600',
    seasons: [
      {
        id: 's1',
        name: '第一季',
        episodes: [
          { id: 'e1', name: '第1集 - 重生', scenes: [], status: 'draft' },
        ]
      }
    ],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-25'),
    status: 'active'
  },
  {
    id: '3',
    name: '校园奇遇记',
    description: '青春校园恋爱喜剧',
    coverColor: 'from-pink-500 to-rose-600',
    seasons: [],
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-20'),
    status: 'active'
  },
]

const mockCharacters: Character[] = [
  {
    id: 'c1',
    name: '秦羽',
    description: '男主角，废柴少年，后觉醒成为绝世强者',
    referenceImages: [],
    prompt: 'young man, black hair, determined eyes, chinese ancient clothing',
    tags: ['男主', '修真', '古装']
  },
  {
    id: 'c2',
    name: '凌雪',
    description: '女主角，冰雪宗圣女',
    referenceImages: [],
    prompt: 'beautiful woman, white hair, ice blue eyes, elegant white robe',
    tags: ['女主', '修真', '古装']
  },
]

const mockEnvironments: Environment[] = [
  {
    id: 'env1',
    name: '青云山',
    description: '主角修炼的仙山',
    referenceImages: [],
    prompt: 'majestic mountain, floating islands, clouds, mystical atmosphere',
    tags: ['修真', '山景', '仙境']
  },
]

interface ProjectState {
  // 项目列表（第一层级）
  projects: IPProject[]
  currentProjectId: string | null
  
  // 全局资产
  characters: Character[]
  environments: Environment[]
  props: Prop[]
  
  // 剧本与分镜
  scripts: Script[]
  storyboards: Storyboard[]
  
  // 工作台Tab状态
  openTabs: WorkTab[]
  activeTabId: string | null
  
  // 生成任务队列
  taskQueue: GenerationTask[]
  
  // 版本历史
  versions: Version[]
  
  // UI状态
  leftSidebarCollapsed: boolean
  rightSidebarCollapsed: boolean
  
  // 画布导入队列
  canvasImportQueue: CanvasImportItem[]
  
  // Actions
  setCurrentProject: (id: string | null) => void
  addProject: (project: Omit<IPProject, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateProject: (id: string, updates: Partial<IPProject>) => void
  deleteProject: (id: string) => void
  
  // 资产操作
  addCharacter: (character: Omit<Character, 'id'>) => void
  updateCharacter: (id: string, updates: Partial<Character>) => void
  deleteCharacter: (id: string) => void
  
  addEnvironment: (env: Omit<Environment, 'id'>) => void
  updateEnvironment: (id: string, updates: Partial<Environment>) => void
  deleteEnvironment: (id: string) => void
  
  // 剧本操作
  addScript: (script: Omit<Script, 'id' | 'uploadedAt' | 'wordCount'>) => string
  updateScript: (id: string, updates: Partial<Script>) => void
  deleteScript: (id: string) => void
  parseScriptStructure: (scriptId: string) => Promise<void>
  
  // 分镜操作
  addStoryboard: (storyboard: Omit<Storyboard, 'id' | 'createdAt'>) => string
  updateStoryboard: (id: string, updates: Partial<Storyboard>) => void
  deleteStoryboard: (id: string) => void
  updatePanel: (storyboardId: string, panelId: string, updates: Partial<StoryboardPanel>) => void
  generatePanelFromScript: (scriptId: string, selectedText: string) => Promise<string>
  
  // Tab操作
  openTab: (tab: Omit<WorkTab, 'id'>) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  markTabDirty: (id: string, dirty: boolean) => void
  
  // 季操作
  addSeason: (name?: string) => string
  deleteSeason: (seasonId: string) => void
  renameSeason: (seasonId: string, name: string) => void
  
  // 剧集操作
  addEpisode: (seasonId: string, episode?: Omit<Episode, 'id'>) => string
  updateEpisode: (episodeId: string, updates: Partial<Episode>) => void
  deleteEpisode: (episodeId: string) => void
  duplicateEpisode: (episodeId: string) => void
  
  // 场景操作
  addScene: (episodeId: string, scene?: Omit<Scene, 'id'>) => string
  deleteScene: (episodeId: string, sceneId: string) => void
  updateScene: (episodeId: string, sceneId: string, updates: Partial<Scene>) => void
  
  // 帧操作
  addFrame: (episodeId: string, sceneId: string) => string
  deleteFrame: (episodeId: string, sceneId: string, frameId: string) => void
  updateFrame: (episodeId: string, sceneId: string, frameId: string, updates: Partial<Frame>) => void
  
  // 复制操作
  duplicateCharacter: (id: string) => void
  duplicateEnvironment: (id: string) => void
  
  // 任务队列
  addTask: (task: Omit<GenerationTask, 'id' | 'createdAt'>) => void
  updateTaskStatus: (id: string, status: GenerationTask['status'], progress?: number) => void
  
  // 画布导入
  queueCanvasImport: (item: CanvasImportItem) => void
  consumeCanvasImport: () => CanvasImportItem | undefined
  
  // UI状态
  toggleLeftSidebar: () => void
  toggleRightSidebar: () => void
}

export const useProjectStore = create<ProjectState>()(
  immer((set, get) => ({
    projects: mockProjects,
    currentProjectId: null,
    characters: mockCharacters,
    environments: mockEnvironments,
    props: [],
    scripts: [],
    storyboards: [],
    openTabs: [],
    activeTabId: null,
    taskQueue: [],
    versions: [],
    leftSidebarCollapsed: false,
    rightSidebarCollapsed: false,
    canvasImportQueue: [],

    setCurrentProject: (id) => set((state) => {
      state.currentProjectId = id
      state.openTabs = []
      state.activeTabId = null
    }),

    addProject: (project) => set((state) => {
      const newProject: IPProject = {
        ...project,
        id: `project-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      state.projects.push(newProject)
    }),

    updateProject: (id, updates) => set((state) => {
      const index = state.projects.findIndex(p => p.id === id)
      if (index !== -1) {
        state.projects[index] = { ...state.projects[index], ...updates, updatedAt: new Date() }
      }
    }),

    deleteProject: (id) => set((state) => {
      state.projects = state.projects.filter(p => p.id !== id)
    }),

    addCharacter: (character) => set((state) => {
      state.characters.push({ ...character, id: `char-${Date.now()}` })
    }),

    updateCharacter: (id, updates) => set((state) => {
      const index = state.characters.findIndex(c => c.id === id)
      if (index !== -1) {
        state.characters[index] = { ...state.characters[index], ...updates }
      }
    }),

    deleteCharacter: (id) => set((state) => {
      state.characters = state.characters.filter(c => c.id !== id)
    }),

    addEnvironment: (env) => set((state) => {
      state.environments.push({ ...env, id: `env-${Date.now()}` })
    }),

    updateEnvironment: (id, updates) => set((state) => {
      const index = state.environments.findIndex(e => e.id === id)
      if (index !== -1) {
        state.environments[index] = { ...state.environments[index], ...updates }
      }
    }),

    deleteEnvironment: (id) => set((state) => {
      state.environments = state.environments.filter(e => e.id !== id)
    }),

    // ===== 剧本操作 =====
    addScript: (script) => {
      const id = `script-${Date.now()}`
      set((state) => {
        state.scripts.push({
          ...script,
          id,
          uploadedAt: new Date(),
          wordCount: script.content.length,
        })
      })
      return id
    },

    updateScript: (id, updates) => set((state) => {
      const index = state.scripts.findIndex(s => s.id === id)
      if (index !== -1) {
        state.scripts[index] = { ...state.scripts[index], ...updates }
        if (updates.content !== undefined) {
          state.scripts[index].wordCount = updates.content.length
        }
      }
    }),

    deleteScript: (id) => set((state) => {
      state.scripts = state.scripts.filter(s => s.id !== id)
    }),

    parseScriptStructure: async (scriptId) => {
      // 模拟AI解析剧本结构
      await new Promise(resolve => setTimeout(resolve, 1500))
      set((state) => {
        const script = state.scripts.find(s => s.id === scriptId)
        if (script) {
          script.parsedStructure = {
            chapters: [
              {
                id: `ch-${Date.now()}-1`,
                title: '第一章：废柴少年',
                scenes: [
                  { id: `ps-1`, title: '清晨训练', description: '秦羽负重攀爬悬崖，汗水浸透衣衫', location: '后山悬崖', characters: ['秦羽'] },
                  { id: `ps-2`, title: '父亲的期望', description: '父亲对秦羽的失望，哥哥们的嘲讽', location: '镇国公府餐厅', characters: ['秦羽', '秦德'] },
                ]
              },
              {
                id: `ch-${Date.now()}-2`,
                title: '第二章：奇遇',
                scenes: [
                  { id: `ps-3`, title: '神秘老者', description: '秦羽在后山遇到神秘老者，获得《星辰诀》秘籍', location: '后山密林', characters: ['秦羽', '神秘老者'] },
                ]
              },
            ],
            detectedCharacters: ['秦羽', '秦德', '凌雪', '神秘老者'],
            detectedLocations: ['后山悬崖', '镇国公府餐厅', '后山密林', '青云山'],
          }
        }
      })
    },

    // ===== 分镜操作 =====
    addStoryboard: (storyboard) => {
      const id = `sb-${Date.now()}`
      set((state) => {
        state.storyboards.push({
          ...storyboard,
          id,
          createdAt: new Date(),
        })
      })
      return id
    },

    updateStoryboard: (id, updates) => set((state) => {
      const index = state.storyboards.findIndex(s => s.id === id)
      if (index !== -1) {
        state.storyboards[index] = { ...state.storyboards[index], ...updates }
      }
    }),

    deleteStoryboard: (id) => set((state) => {
      state.storyboards = state.storyboards.filter(s => s.id !== id)
    }),

    updatePanel: (storyboardId, panelId, updates) => set((state) => {
      const sb = state.storyboards.find(s => s.id === storyboardId)
      if (sb) {
        const panel = sb.panels.find(p => p.id === panelId)
        if (panel) {
          Object.assign(panel, updates)
        }
      }
    }),

    generatePanelFromScript: async (scriptId, selectedText) => {
      // 模拟AI拆解分镜
      await new Promise(resolve => setTimeout(resolve, 1000))
      const panels: StoryboardPanel[] = [
        { id: `panel-${Date.now()}-1`, index: 0, description: '远景：展现场景全貌，渲染氛围', characterIds: [], status: 'draft' },
        { id: `panel-${Date.now()}-2`, index: 1, description: '中景：角色入场，确立空间关系', characterIds: [], status: 'draft' },
        { id: `panel-${Date.now()}-3`, index: 2, description: '近景：角色表情特写，传递情绪', characterIds: [], status: 'draft' },
        { id: `panel-${Date.now()}-4`, index: 3, description: '动态镜头：关键动作/冲突爆发', characterIds: [], status: 'draft' },
        { id: `panel-${Date.now()}-5`, index: 4, description: '定格收尾：悬念或转折，引出下一场', characterIds: [], status: 'draft' },
      ]
      const sbId = `sb-${Date.now()}`
      set((state) => {
        state.storyboards.push({
          id: sbId,
          name: `分镜 - ${selectedText.slice(0, 20)}...`,
          sourceScriptId: scriptId,
          sourceText: selectedText,
          panels,
          createdAt: new Date(),
        })
      })
      return sbId
    },

    openTab: (tab) => set((state) => {
      const existing = state.openTabs.find(t => t.entityId === tab.entityId && t.type === tab.type)
      if (existing) {
        state.activeTabId = existing.id
      } else {
        const newTab: WorkTab = { ...tab, id: `tab-${Date.now()}` }
        state.openTabs.push(newTab)
        state.activeTabId = newTab.id
      }
    }),

    closeTab: (id) => set((state) => {
      const index = state.openTabs.findIndex(t => t.id === id)
      state.openTabs = state.openTabs.filter(t => t.id !== id)
      if (state.activeTabId === id) {
        state.activeTabId = state.openTabs[Math.max(0, index - 1)]?.id || null
      }
    }),

    setActiveTab: (id) => set((state) => {
      state.activeTabId = id
    }),

    markTabDirty: (id, dirty) => set((state) => {
      const tab = state.openTabs.find(t => t.id === id)
      if (tab) tab.isDirty = dirty
    }),

    // ===== 季操作 =====
    addSeason: (name) => {
      const id = `season-${Date.now()}`
      set((state) => {
        const project = state.projects.find(p => p.id === state.currentProjectId)
        if (project) {
          const num = project.seasons.length + 1
          project.seasons.push({ id, name: name || `第${num}季`, episodes: [] })
        }
      })
      return id
    },

    deleteSeason: (seasonId) => set((state) => {
      const project = state.projects.find(p => p.id === state.currentProjectId)
      if (project) {
        project.seasons = project.seasons.filter(s => s.id !== seasonId)
      }
    }),

    renameSeason: (seasonId, name) => set((state) => {
      const project = state.projects.find(p => p.id === state.currentProjectId)
      if (project) {
        const season = project.seasons.find(s => s.id === seasonId)
        if (season) season.name = name
      }
    }),

    // ===== 剧集操作 =====
    addEpisode: (seasonId, episode) => {
      const id = `ep-${Date.now()}`
      set((state) => {
        const project = state.projects.find(p => p.id === state.currentProjectId)
        if (project) {
          const season = project.seasons.find(s => s.id === seasonId)
          if (season) {
            if (episode) {
              season.episodes.push({ ...episode, id })
            } else {
              const num = season.episodes.length + 1
              season.episodes.push({ id, name: `第${num}集`, scenes: [], status: 'draft' })
            }
          }
        }
      })
      return id
    },

    updateEpisode: (episodeId, updates) => set((state) => {
      const project = state.projects.find(p => p.id === state.currentProjectId)
      if (project) {
        for (const season of project.seasons) {
          const ep = season.episodes.find(e => e.id === episodeId)
          if (ep) {
            Object.assign(ep, updates)
            break
          }
        }
      }
    }),

    deleteEpisode: (episodeId) => set((state) => {
      const project = state.projects.find(p => p.id === state.currentProjectId)
      if (project) {
        for (const season of project.seasons) {
          const idx = season.episodes.findIndex(e => e.id === episodeId)
          if (idx !== -1) {
            season.episodes.splice(idx, 1)
            break
          }
        }
      }
    }),

    duplicateEpisode: (episodeId) => set((state) => {
      const project = state.projects.find(p => p.id === state.currentProjectId)
      if (project) {
        for (const season of project.seasons) {
          const ep = season.episodes.find(e => e.id === episodeId)
          if (ep) {
            const clone = JSON.parse(JSON.stringify(ep))
            clone.id = `ep-${Date.now()}`
            clone.name = `${ep.name} (副本)`
            clone.status = 'draft'
            season.episodes.push(clone)
            break
          }
        }
      }
    }),

    // ===== 场景操作 =====
    addScene: (episodeId, scene) => {
      const id = `scene-${Date.now()}`
      set((state) => {
        const project = state.projects.find(p => p.id === state.currentProjectId)
        if (project) {
          for (const season of project.seasons) {
            const ep = season.episodes.find(e => e.id === episodeId)
            if (ep) {
              if (scene) {
                ep.scenes.push({ ...scene, id })
              } else {
                const num = ep.scenes.length + 1
                ep.scenes.push({ id, name: `场景${num}`, frames: [] })
              }
              break
            }
          }
        }
      })
      return id
    },

    deleteScene: (episodeId, sceneId) => set((state) => {
      const project = state.projects.find(p => p.id === state.currentProjectId)
      if (project) {
        for (const season of project.seasons) {
          const ep = season.episodes.find(e => e.id === episodeId)
          if (ep) {
            ep.scenes = ep.scenes.filter(s => s.id !== sceneId)
            break
          }
        }
      }
    }),

    updateScene: (episodeId, sceneId, updates) => set((state) => {
      const project = state.projects.find(p => p.id === state.currentProjectId)
      if (project) {
        for (const season of project.seasons) {
          const ep = season.episodes.find(e => e.id === episodeId)
          if (ep) {
            const scene = ep.scenes.find(s => s.id === sceneId)
            if (scene) Object.assign(scene, updates)
            break
          }
        }
      }
    }),

    // ===== 帧操作 =====
    addFrame: (episodeId, sceneId) => {
      const id = `frame-${Date.now()}`
      set((state) => {
        const project = state.projects.find(p => p.id === state.currentProjectId)
        if (project) {
          for (const season of project.seasons) {
            const ep = season.episodes.find(e => e.id === episodeId)
            if (ep) {
              const scene = ep.scenes.find(s => s.id === sceneId)
              if (scene) {
                scene.frames.push({ id, characters: [], status: 'pending' })
              }
              break
            }
          }
        }
      })
      return id
    },

    deleteFrame: (episodeId, sceneId, frameId) => set((state) => {
      const project = state.projects.find(p => p.id === state.currentProjectId)
      if (project) {
        for (const season of project.seasons) {
          const ep = season.episodes.find(e => e.id === episodeId)
          if (ep) {
            const scene = ep.scenes.find(s => s.id === sceneId)
            if (scene) {
              scene.frames = scene.frames.filter(f => f.id !== frameId)
            }
            break
          }
        }
      }
    }),

    updateFrame: (episodeId, sceneId, frameId, updates) => set((state) => {
      const project = state.projects.find(p => p.id === state.currentProjectId)
      if (project) {
        for (const season of project.seasons) {
          const ep = season.episodes.find(e => e.id === episodeId)
          if (ep) {
            const scene = ep.scenes.find(s => s.id === sceneId)
            if (scene) {
              const frame = scene.frames.find(f => f.id === frameId)
              if (frame) Object.assign(frame, updates)
            }
            break
          }
        }
      }
    }),

    // ===== 复制操作 =====
    duplicateCharacter: (id) => set((state) => {
      const char = state.characters.find(c => c.id === id)
      if (char) {
        const clone = { ...char, id: `char-${Date.now()}`, name: `${char.name} (副本)` }
        state.characters.push(clone)
      }
    }),

    duplicateEnvironment: (id) => set((state) => {
      const env = state.environments.find(e => e.id === id)
      if (env) {
        const clone = { ...env, id: `env-${Date.now()}`, name: `${env.name} (副本)` }
        state.environments.push(clone)
      }
    }),

    addTask: (task) => set((state) => {
      state.taskQueue.push({
        ...task,
        id: `task-${Date.now()}`,
        createdAt: new Date(),
      })
    }),

    updateTaskStatus: (id, status, progress) => set((state) => {
      const task = state.taskQueue.find(t => t.id === id)
      if (task) {
        task.status = status
        if (progress !== undefined) task.progress = progress
      }
    }),

    queueCanvasImport: (item) => set((state) => {
      state.canvasImportQueue.push(item)
    }),

    consumeCanvasImport: () => {
      const item = get().canvasImportQueue[0]
      if (item) {
        set((state) => { state.canvasImportQueue.shift() })
      }
      return item
    },

    toggleLeftSidebar: () => set((state) => {
      state.leftSidebarCollapsed = !state.leftSidebarCollapsed
    }),

    toggleRightSidebar: () => set((state) => {
      state.rightSidebarCollapsed = !state.rightSidebarCollapsed
    }),
  }))
)
