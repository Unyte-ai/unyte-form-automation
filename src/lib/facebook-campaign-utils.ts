// Facebook Campaign and Ad Set Types and Utilities

// UI Objectives (what users see in forms)
export type FacebookCampaignObjective = 
  | 'AWARENESS'
  | 'TRAFFIC'
  | 'ENGAGEMENT'
  | 'LEADS'
  | 'APP_PROMOTION'
  | 'SALES'

// API Objectives (what Facebook API expects)
export type FacebookCampaignAPIObjective = 
  | 'OUTCOME_AWARENESS'
  | 'OUTCOME_TRAFFIC'
  | 'OUTCOME_ENGAGEMENT'
  | 'OUTCOME_LEADS'
  | 'OUTCOME_APP_PROMOTION'
  | 'OUTCOME_SALES'

export type FacebookCampaignStatus = 'ACTIVE' | 'PAUSED'

export type FacebookBuyingType = 'AUCTION'

export type FacebookBidStrategy = 'LOWEST_COST_WITHOUT_CAP'

export type FacebookSpecialAdCategory = 'NONE'

export type FacebookBillingEvent = 
  | 'APP_INSTALLS'
  | 'CLICKS'
  | 'IMPRESSIONS'
  | 'LINK_CLICKS'
  | 'NONE'
  | 'OFFER_CLAIMS'
  | 'PAGE_LIKES'
  | 'POST_ENGAGEMENT'
  | 'THRUPLAY'
  | 'PURCHASE'
  | 'LISTING_INTERACTION'

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
  // lifetime_budget removed - using campaign budget instead
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
  objective: FacebookCampaignAPIObjective // Note: API objective type
  status: FacebookCampaignStatus
  special_ad_categories: FacebookSpecialAdCategory[] | []
  buying_type: FacebookBuyingType
  bid_strategy: FacebookBidStrategy
  lifetime_budget: number
}

export interface FacebookAdSetAPIData {
  name: string
  campaign_id: string
  // lifetime_budget removed - using campaign budget instead
  billing_event: FacebookBillingEvent
  targeting: string // JSON stringified FacebookTargeting
  status: FacebookCampaignStatus
  start_time: string
  end_time: string
}

// UI to API objective mapping
export const UI_TO_API_OBJECTIVE: Record<FacebookCampaignObjective, FacebookCampaignAPIObjective> = {
  'AWARENESS': 'OUTCOME_AWARENESS',
  'TRAFFIC': 'OUTCOME_TRAFFIC',
  'ENGAGEMENT': 'OUTCOME_ENGAGEMENT',
  'LEADS': 'OUTCOME_LEADS',
  'APP_PROMOTION': 'OUTCOME_APP_PROMOTION',
  'SALES': 'OUTCOME_SALES'
}

// Objective to Billing Event mapping (using UI objectives)
export const OBJECTIVE_TO_BILLING_EVENT: Record<FacebookCampaignObjective, FacebookBillingEvent> = {
  'AWARENESS': 'IMPRESSIONS',
  'TRAFFIC': 'LINK_CLICKS',
  'ENGAGEMENT': 'POST_ENGAGEMENT',
  'LEADS': 'NONE',
  'APP_PROMOTION': 'APP_INSTALLS',
  'SALES': 'PURCHASE'
}

// Campaign objectives with human-readable labels (for UI dropdowns)
export const CAMPAIGN_OBJECTIVES = [
  { value: 'AWARENESS', label: 'Brand Awareness' },
  { value: 'TRAFFIC', label: 'Traffic' },
  { value: 'ENGAGEMENT', label: 'Engagement' },
  { value: 'LEADS', label: 'Lead Generation' },
  { value: 'APP_PROMOTION', label: 'App Promotion' },
  { value: 'SALES', label: 'Sales' }
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
export function getBillingEventForUIObjective(objective: FacebookCampaignObjective): FacebookBillingEvent {
  return OBJECTIVE_TO_BILLING_EVENT[objective]
}

export function getAPIObjectiveFromUIObjective(uiObjective: FacebookCampaignObjective): FacebookCampaignAPIObjective {
  return UI_TO_API_OBJECTIVE[uiObjective]
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
  
  // Budget validation removed - using campaign budget instead
  
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
    objective: getAPIObjectiveFromUIObjective(data.objective), // Convert UI to API objective
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
    // lifetime_budget removed - using campaign budget instead
    billing_event: data.billing_event,
    targeting: JSON.stringify(data.targeting),
    status: data.status,
    start_time: data.start_time,
    end_time: data.end_time
  }
}