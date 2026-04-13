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
    title: 'Free',
    price: '$0',
    priceNote: '/ mo',
    desc: 'Try AI creation — new users get $1 free credit.',
    features: ['Pay-per-use models', 'Community support', 'Basic project management'],
    storage: '2 GB cloud storage',
  },
  {
    key: 'pro',
    title: 'Pro',
    price: '$9.9',
    priceNote: '/ mo',
    badge: 'Recommended',
    desc: 'Best choice for individual creators with more storage.',
    features: ['Pay-per-use models', 'Priority generation queue', 'Project management', 'Priority support'],
    storage: '50 GB cloud storage',
    recommended: true,
  },
  {
    key: 'enterprise',
    title: 'Enterprise',
    price: 'Contact Sales',
    desc: 'Team collaboration, custom pricing, and dedicated support.',
    features: ['Custom model pricing', 'Multi-user collaboration & permissions', 'Dedicated customer success', 'Custom invoicing & plans'],
    storage: 'Unlimited storage',
  },
]

export const modelPricing = [
  { model: 'Seedream 4.0', type: 'Image 2K', price: '$0.03 / image' },
  { model: 'Seedream 4.0', type: 'Image 4K', price: '$0.06 / image' },
  { model: 'Seedance 2.0', type: 'Video 5s', price: '$0.30 / clip' },
  { model: 'Seedance 2.0', type: 'Video 10s', price: '$0.50 / clip' },
]
