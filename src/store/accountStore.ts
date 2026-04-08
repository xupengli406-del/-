import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BalanceInfo, BalanceRecord, BalanceRecordType, StorageQuota, StorageAsset } from './types'

export type LoginTab = 'email' | 'quick' | 'manual'
export type UserPlan = 'subscription' | 'enterprise'
export type BalanceFilter = 'all' | 'consume' | 'acquire'
export type StorageAssetFilter = 'all' | 'image' | 'video' | 'upload'

interface UserProfile {
  name: string
  email: string
  avatar: string
}

interface AccountState {
  // 登录状态
  isLoggedIn: boolean
  loginTab: LoginTab
  profile: UserProfile
  currentPlan: UserPlan

  // 全局水印设置
  globalWatermarkDisabled: boolean

  // 余额
  balanceInfo: BalanceInfo
  balanceRecords: BalanceRecord[]
  balanceFilter: BalanceFilter

  // 存储空间
  storageQuota: StorageQuota
  storageAssets: StorageAsset[]
  storageAssetFilter: StorageAssetFilter

  // Actions — 登录
  loginWithTab: (tab?: LoginTab) => void
  logout: () => void
  setLoginTab: (tab: LoginTab) => void
  setCurrentPlan: (plan: UserPlan) => void

  // Actions — 水印
  setGlobalWatermarkDisabled: (v: boolean) => void

  // Actions — 余额
  setBalanceFilter: (filter: BalanceFilter) => void
  addBalanceRecord: (record: Omit<BalanceRecord, 'id'>) => void
  recharge: (amount: number) => void

  // Actions — 存储
  setStorageAssetFilter: (filter: StorageAssetFilter) => void
  deleteStorageAsset: (assetId: string) => void
}

const defaultProfile: UserProfile = {
  name: '林空',
  email: 'linkong@aimanju.ai',
  avatar: '林',
}

const mockBalanceRecords: BalanceRecord[] = [
  { id: 'r1', type: 'acquire', event: '新用户注册赠送', amount: 18, timestamp: Date.now() - 7 * 86400000 },
  { id: 'r2', type: 'acquire', event: '订阅版月度额度', amount: 200, timestamp: Date.now() - 5 * 86400000 },
  { id: 'r3', type: 'acquire', event: '充值', amount: 50, timestamp: Date.now() - 3 * 86400000 },
  { id: 'r4', type: 'consume', event: '图片生成 - Seedream 4.0', amount: -0.5, timestamp: Date.now() - 2 * 86400000 },
  { id: 'r5', type: 'consume', event: '视频生成 - Seedance 1.5', amount: -3, timestamp: Date.now() - 2 * 86400000 + 3600000 },
  { id: 'r6', type: 'consume', event: '图片生成 - Seedream 4.0', amount: -0.5, timestamp: Date.now() - 86400000 },
  { id: 'r7', type: 'consume', event: '视频生成 - Seedance 1.5', amount: -3, timestamp: Date.now() - 86400000 + 7200000 },
  { id: 'r8', type: 'consume', event: '图片生成 - Seedream 4.0', amount: -0.5, timestamp: Date.now() - 43200000 },
  { id: 'r9', type: 'acquire', event: '每日登录赠送', amount: 0.5, timestamp: Date.now() - 36000000 },
  { id: 'r10', type: 'consume', event: '视频生成 - Seedance 1.5', amount: -3, timestamp: Date.now() - 7200000 },
]

const GB = 1024 * 1024 * 1024
const MB = 1024 * 1024

const mockStorageAssets: StorageAsset[] = [
  { id: 'sa1', name: '场景一-全景.png', type: 'image', size: 3.2 * MB, url: '', createdAt: Date.now() - 86400000 },
  { id: 'sa2', name: '场景二-特写.png', type: 'image', size: 2.8 * MB, url: '', createdAt: Date.now() - 86400000 + 3600000 },
  { id: 'sa3', name: '场景一-动画.mp4', type: 'video', size: 52 * MB, url: '', createdAt: Date.now() - 2 * 86400000 },
  { id: 'sa4', name: '场景三-转场.mp4', type: 'video', size: 48 * MB, url: '', createdAt: Date.now() - 3 * 86400000 },
  { id: 'sa5', name: '参考图-人物.jpg', type: 'upload', size: 4.5 * MB, url: '', createdAt: Date.now() - 4 * 86400000 },
  { id: 'sa6', name: '场景四-远景.png', type: 'image', size: 3.5 * MB, url: '', createdAt: Date.now() - 5 * 86400000 },
  { id: 'sa7', name: '预告片.mp4', type: 'video', size: 85 * MB, url: '', createdAt: Date.now() - 6 * 86400000 },
  { id: 'sa8', name: '参考图-场景.png', type: 'upload', size: 6.2 * MB, url: '', createdAt: Date.now() - 7 * 86400000 },
]

let recordIdCounter = 100

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      // 登录状态
      isLoggedIn: false,
      loginTab: 'email',
      profile: defaultProfile,
      currentPlan: 'subscription',

      // 全局水印设置
      globalWatermarkDisabled: false,

      // 余额
      balanceInfo: { total: 268, subscription: 200, recharged: 50, gifted: 18 },
      balanceRecords: mockBalanceRecords,
      balanceFilter: 'all',

      // 存储空间
      storageQuota: {
        used: 1.2 * GB,
        total: 50 * GB,
        breakdown: { images: 512 * MB, videos: 614 * MB, uploads: 86 * MB },
      },
      storageAssets: mockStorageAssets,
      storageAssetFilter: 'all',

      // Actions — 登录
      loginWithTab: (tab = 'email') => set({ isLoggedIn: true, loginTab: tab }),
      logout: () => set({ isLoggedIn: false, loginTab: 'email' }),
      setLoginTab: (tab) => set({ loginTab: tab }),
      setCurrentPlan: (plan) => set({ currentPlan: plan }),

      // Actions — 水印
      setGlobalWatermarkDisabled: (v) => set({ globalWatermarkDisabled: v }),

      // Actions — 余额
      setBalanceFilter: (filter) => set({ balanceFilter: filter }),

      addBalanceRecord: (record) => {
        const id = `r${++recordIdCounter}`
        const newRecord: BalanceRecord = { ...record, id }
        set((s) => {
          const newTotal = s.balanceInfo.total + record.amount
          const balanceInfo = { ...s.balanceInfo, total: Math.round(newTotal * 100) / 100 }
          // 消耗优先从充值扣，再从赠送扣，最后从订阅扣
          if (record.amount < 0) {
            const deduct = Math.abs(record.amount)
            let remaining = deduct
            if (balanceInfo.recharged >= remaining) {
              balanceInfo.recharged -= remaining
              remaining = 0
            } else {
              remaining -= balanceInfo.recharged
              balanceInfo.recharged = 0
            }
            if (remaining > 0) {
              if (balanceInfo.gifted >= remaining) {
                balanceInfo.gifted -= remaining
                remaining = 0
              } else {
                remaining -= balanceInfo.gifted
                balanceInfo.gifted = 0
              }
            }
            if (remaining > 0) {
              balanceInfo.subscription = Math.max(0, balanceInfo.subscription - remaining)
            }
          }
          return {
            balanceInfo,
            balanceRecords: [newRecord, ...s.balanceRecords],
          }
        })
      },

      recharge: (amount) => {
        const id = `r${++recordIdCounter}`
        set((s) => ({
          balanceInfo: {
            ...s.balanceInfo,
            total: Math.round((s.balanceInfo.total + amount) * 100) / 100,
            recharged: Math.round((s.balanceInfo.recharged + amount) * 100) / 100,
          },
          balanceRecords: [
            { id, type: 'acquire' as BalanceRecordType, event: '充值', amount, timestamp: Date.now() },
            ...s.balanceRecords,
          ],
        }))
      },

      // Actions — 存储
      setStorageAssetFilter: (filter) => set({ storageAssetFilter: filter }),

      deleteStorageAsset: (assetId) => {
        set((s) => {
          const asset = s.storageAssets.find((a) => a.id === assetId)
          if (!asset) return s
          const newAssets = s.storageAssets.filter((a) => a.id !== assetId)
          const breakdownKey = asset.type === 'upload' ? 'uploads' : asset.type === 'image' ? 'images' : 'videos'
          return {
            storageAssets: newAssets,
            storageQuota: {
              ...s.storageQuota,
              used: Math.max(0, s.storageQuota.used - asset.size),
              breakdown: {
                ...s.storageQuota.breakdown,
                [breakdownKey]: Math.max(0, s.storageQuota.breakdown[breakdownKey] - asset.size),
              },
            },
          }
        })
      },
    }),
    {
      name: 'account-settings',
      partialize: (state) => ({
        globalWatermarkDisabled: state.globalWatermarkDisabled,
      }),
    },
  ),
)
