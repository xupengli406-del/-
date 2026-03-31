import { create } from 'zustand'

export type LoginTab = 'email' | 'quick' | 'manual'
export type UserPlan = 'subscription' | 'enterprise'

interface UserProfile {
  name: string
  email: string
  avatar: string
}

interface AccountState {
  isLoggedIn: boolean
  balance: number
  currentPlan: UserPlan
  loginTab: LoginTab
  profile: UserProfile
  loginWithTab: (tab?: LoginTab) => void
  logout: () => void
  setLoginTab: (tab: LoginTab) => void
  setCurrentPlan: (plan: UserPlan) => void
}

const defaultProfile: UserProfile = {
  name: '林空',
  email: 'linkong@aimanju.ai',
  avatar: '林',
}

export const useAccountStore = create<AccountState>((set) => ({
  isLoggedIn: false,
  balance: 268,
  currentPlan: 'subscription',
  loginTab: 'email',
  profile: defaultProfile,
  loginWithTab: (tab = 'email') => set({ isLoggedIn: true, loginTab: tab }),
  logout: () => set({ isLoggedIn: false, loginTab: 'email' }),
  setLoginTab: (tab) => set({ loginTab: tab }),
  setCurrentPlan: (plan) => set({ currentPlan: plan }),
}))
