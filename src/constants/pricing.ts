import type { UserPlan } from '../store/accountStore'

export const plans: {
  key: UserPlan
  title: string
  price: string
  priceNote?: string
  badge?: string
  desc: string
  features: string[]
  storage: string
  recommended?: boolean
}[] = [
  {
    key: 'free',
    title: '免费版',
    price: '$0',
    priceNote: '/ 月',
    desc: '体验 AI 创作，新用户赠送 $1 额度。',
    features: ['模型按量付费', '社区支持', '基础项目管理'],
    storage: '2 GB 云端存储',
  },
  {
    key: 'pro',
    title: 'Pro',
    price: '$9.9',
    priceNote: '/ 月',
    badge: '推荐',
    desc: '个人创作者的最佳选择，更大存储空间。',
    features: ['模型按量付费', '优先生成队列', '项目管理', '优先客服支持'],
    storage: '50 GB 云端存储',
    recommended: true,
  },
  {
    key: 'enterprise',
    title: '企业版',
    price: '联系销售',
    desc: '团队协作、定制价格、专属支持。',
    features: ['定制模型价格', '多人协作与权限控制', '专属客户成功支持', '对公结算与定制方案'],
    storage: '不限存储',
  },
]

export const modelPricing = [
  { model: 'Seedream 4.0', type: '图片 2K', price: '$0.03 / 张' },
  { model: 'Seedream 4.0', type: '图片 4K', price: '$0.06 / 张' },
  { model: 'Seedance 1.5', type: '视频 5s', price: '$0.30 / 条' },
  { model: 'Seedance 1.5', type: '视频 10s', price: '$0.50 / 条' },
]
