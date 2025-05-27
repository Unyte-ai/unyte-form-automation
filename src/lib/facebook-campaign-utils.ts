// Facebook Campaign and Ad Set Types and Utilities

export type FacebookCampaignObjective = 
  | 'BRAND_AWARENESS'
  | 'REACH'
  | 'TRAFFIC'
  | 'ENGAGEMENT'
  | 'APP_PROMOTION'
  | 'VIDEO_VIEWS'
  | 'LEAD_GENERATION'
  | 'MESSAGES'
  | 'CONVERSIONS'
  | 'CATALOG_SALES'
  | 'STORE_TRAFFIC'

export type FacebookCampaignStatus = 'ACTIVE' | 'PAUSED'

export type FacebookBuyingType = 'AUCTION'

export type FacebookBidStrategy = 'LOWEST_COST_WITHOUT_CAP'

export type FacebookSpecialAdCategory = 'NONE'

export type FacebookBillingEvent = 
  | 'IMPRESSIONS'
  | 'LINK_CLICKS'
  | 'POST_ENGAGEMENT'
  | 'VIDEO_VIEWS'
  | 'LEAD_GENERATION'
  | 'MESSAGES'
  | 'OFFSITE_CONVERSIONS'

export type FacebookPublisherPlatform = 
  | 'facebook'
  | 'instagram'
  | 'audience_network'
  | 'messenger'
  | 'threads'

export interface FacebookCampaignData {
  name: string
  objective: FacebookCampaignObjective
  status: FacebookCampaignStatus
  special_ad_categories: FacebookSpecialAdCategory[] | []
  buying_type: FacebookBuyingType
  bid_strategy: FacebookBidStrategy
  lifetime_budget: number // in cents
}

export interface FacebookGeoTargeting {
  countries: string[] // Country codes like ['US', 'CA']
}

export interface FacebookTargeting {
  geo_locations: FacebookGeoTargeting
  age_min: number
  age_max: number
  publisher_platforms: FacebookPublisherPlatform[]
}

export interface FacebookAdSetData {
  name: string
  campaign_id: string
  lifetime_budget: number // in cents
  billing_event: FacebookBillingEvent
  targeting: FacebookTargeting
  status: FacebookCampaignStatus
  start_time: string // ISO string
  end_time: string // ISO string
}

export interface FacebookBatchCampaignAdSetData {
  campaign: FacebookCampaignData
  adset: Omit<FacebookAdSetData, 'campaign_id'> // campaign_id will be set automatically
}

// API-ready interfaces (what gets sent to Facebook)
export interface FacebookCampaignAPIData {
  name: string
  objective: FacebookCampaignObjective
  status: FacebookCampaignStatus
  special_ad_categories: FacebookSpecialAdCategory[] | []
  buying_type: FacebookBuyingType
  bid_strategy: FacebookBidStrategy
  lifetime_budget: number
}

export interface FacebookAdSetAPIData {
  name: string
  campaign_id: string
  lifetime_budget: number
  billing_event: FacebookBillingEvent
  targeting: string // JSON stringified FacebookTargeting
  status: FacebookCampaignStatus
  start_time: string
  end_time: string
}

// Objective to Billing Event mapping
export const OBJECTIVE_TO_BILLING_EVENT: Record<FacebookCampaignObjective, FacebookBillingEvent> = {
  BRAND_AWARENESS: 'IMPRESSIONS',
  REACH: 'IMPRESSIONS',
  TRAFFIC: 'LINK_CLICKS',
  ENGAGEMENT: 'POST_ENGAGEMENT',
  APP_PROMOTION: 'IMPRESSIONS',
  VIDEO_VIEWS: 'VIDEO_VIEWS',
  LEAD_GENERATION: 'LEAD_GENERATION',
  MESSAGES: 'MESSAGES',
  CONVERSIONS: 'OFFSITE_CONVERSIONS',
  CATALOG_SALES: 'IMPRESSIONS',
  STORE_TRAFFIC: 'IMPRESSIONS'
}

// Campaign objectives with human-readable labels
export const CAMPAIGN_OBJECTIVES = [
  { value: 'BRAND_AWARENESS', label: 'Brand Awareness' },
  { value: 'REACH', label: 'Reach' },
  { value: 'TRAFFIC', label: 'Traffic' },
  { value: 'ENGAGEMENT', label: 'Engagement' },
  { value: 'APP_PROMOTION', label: 'App Promotion' },
  { value: 'VIDEO_VIEWS', label: 'Video Views' },
  { value: 'LEAD_GENERATION', label: 'Lead Generation' },
  { value: 'MESSAGES', label: 'Messages' },
  { value: 'CONVERSIONS', label: 'Conversions' },
  { value: 'CATALOG_SALES', label: 'Catalog Sales' },
  { value: 'STORE_TRAFFIC', label: 'Store Traffic' }
] as const

// Publisher platforms with human-readable labels
export const PUBLISHER_PLATFORMS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'audience_network', label: 'Audience Network' },
  { value: 'messenger', label: 'Messenger' },
  { value: 'threads', label: 'Threads' }
] as const

// Common country options
export const COMMON_COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'IT', label: 'Italy' },
  { value: 'ES', label: 'Spain' },
  { value: 'BR', label: 'Brazil' },
  { value: 'MX', label: 'Mexico' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'IN', label: 'India' }
] as const

// Default values
export const DEFAULT_CAMPAIGN_VALUES: Partial<FacebookCampaignData> = {
  status: 'PAUSED',
  special_ad_categories: [],
  buying_type: 'AUCTION',
  bid_strategy: 'LOWEST_COST_WITHOUT_CAP'
}

export const DEFAULT_ADSET_VALUES: Partial<FacebookAdSetData> = {
  status: 'PAUSED',
  targeting: {
    geo_locations: {
      countries: ['US']
    },
    age_min: 18,
    age_max: 65,
    publisher_platforms: ['facebook', 'instagram']
  }
}

// Utility functions
export function getBillingEventForObjective(objective: FacebookCampaignObjective): FacebookBillingEvent {
  return OBJECTIVE_TO_BILLING_EVENT[objective]
}

export function validateCampaignData(data: Partial<FacebookCampaignData>): string[] {
  const errors: string[] = []
  
  if (!data.name?.trim()) {
    errors.push('Campaign name is required')
  }
  
  if (!data.objective) {
    errors.push('Campaign objective is required')
  }
  
  if (!data.lifetime_budget || data.lifetime_budget <= 0) {
    errors.push('Campaign lifetime budget must be greater than 0')
  }
  
  return errors
}

export function validateAdSetData(data: Partial<FacebookAdSetData>): string[] {
  const errors: string[] = []
  
  if (!data.name?.trim()) {
    errors.push('Ad Set name is required')
  }
  
  if (!data.lifetime_budget || data.lifetime_budget <= 0) {
    errors.push('Ad Set lifetime budget must be greater than 0')
  }
  
  if (!data.targeting?.geo_locations?.countries?.length) {
    errors.push('At least one target country is required')
  }
  
  if (!data.targeting?.publisher_platforms?.length) {
    errors.push('At least one publisher platform is required')
  }
  
  if (data.targeting?.age_min && data.targeting?.age_max) {
    if (data.targeting.age_min > data.targeting.age_max) {
      errors.push('Minimum age cannot be greater than maximum age')
    }
    if (data.targeting.age_min < 13) {
      errors.push('Minimum age cannot be less than 13')
    }
    if (data.targeting.age_max > 99) {
      errors.push('Maximum age cannot be greater than 99')
    }
  }
  
  if (!data.start_time) {
    errors.push('Start time is required')
  }
  
  if (!data.end_time) {
    errors.push('End time is required')
  }
  
  if (data.start_time && data.end_time) {
    const startDate = new Date(data.start_time)
    const endDate = new Date(data.end_time)
    
    if (endDate <= startDate) {
      errors.push('End time must be after start time')
    }
    
    if (startDate <= new Date()) {
      errors.push('Start time must be in the future')
    }
  }
  
  return errors
}

export function formatBudgetCents(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function parseBudgetToCents(dollarAmount: string): number {
  const parsed = parseFloat(dollarAmount)
  return Math.round(parsed * 100)
}

// Convert form data to API-ready format
export function prepareCampaignForAPI(data: FacebookCampaignData): FacebookCampaignAPIData {
  return {
    name: data.name,
    objective: data.objective,
    status: data.status,
    special_ad_categories: data.special_ad_categories,
    buying_type: data.buying_type,
    bid_strategy: data.bid_strategy,
    lifetime_budget: data.lifetime_budget
  }
}

export function prepareAdSetForAPI(data: FacebookAdSetData): FacebookAdSetAPIData {
  return {
    name: data.name,
    campaign_id: data.campaign_id,
    lifetime_budget: data.lifetime_budget,
    billing_event: data.billing_event,
    targeting: JSON.stringify(data.targeting),
    status: data.status,
    start_time: data.start_time,
    end_time: data.end_time
  }
}