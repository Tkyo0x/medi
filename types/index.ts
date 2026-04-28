export interface Module {
  id: string
  name: string
  tagline: string
  description: string
  category: string
  color: string
  icon: string
  version: string
  status: 'active' | 'coming_soon' | 'beta'
  features: string[]
}

export interface ActiveTrial {
  module_id: string
  expires_at: string
  hours_left: number
}

export interface ModuleStatus {
  subscribedModules: string[]
  activeTrials: ActiveTrial[]
}

export interface AccessResult {
  access: boolean
  reason: 'subscription' | 'trial' | 'trial_expired' | 'no_access'
  hours_left?: number
  expires_at?: string
}
