import { create } from 'zustand'

export type AppScreen = 'login' | 'workspace' | 'billing' | 'repository'
export type RepositoryType = 'storyboard' | 'video' | 'asset'

interface AppFlowState {
  isLoggedIn: boolean
  currentScreen: AppScreen
  activeRepository: RepositoryType
  loginStep: 'phone' | 'verify' | 'profile'
  billingPlan: 'free' | 'pro' | 'studio'
  enterWorkspace: () => void
  openLogin: () => void
  completeLogin: () => void
  setLoginStep: (step: 'phone' | 'verify' | 'profile') => void
  openBilling: () => void
  openRepository: (repo?: RepositoryType) => void
  setActiveRepository: (repo: RepositoryType) => void
  setBillingPlan: (plan: 'free' | 'pro' | 'studio') => void
}

export const useAppFlowStore = create<AppFlowState>((set) => ({
  isLoggedIn: true,
  currentScreen: 'workspace',
  activeRepository: 'storyboard',
  loginStep: 'phone',
  billingPlan: 'pro',
  enterWorkspace: () => set({ currentScreen: 'workspace' }),
  openLogin: () => set({ currentScreen: 'login' }),
  completeLogin: () => set({ isLoggedIn: true, currentScreen: 'workspace', loginStep: 'profile' }),
  setLoginStep: (step) => set({ loginStep: step }),
  openBilling: () => set({ currentScreen: 'billing' }),
  openRepository: (repo) => set((state) => ({ currentScreen: 'repository', activeRepository: repo ?? state.activeRepository })),
  setActiveRepository: (repo) => set({ activeRepository: repo }),
  setBillingPlan: (plan) => set({ billingPlan: plan }),
}))
