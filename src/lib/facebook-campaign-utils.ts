// Facebook Campaign and Ad Set Types and Utilities

// UI Objectives (what users see in forms)
export type FacebookCampaignObjective = 
  | 'AWARENESS'
  | 'TRAFFIC'
  | 'SALES'
  | 'APP_PROMOTION'
  | 'LEAD_GENERATION'
  | 'POST_ENGAGEMENT'

// API Objectives (what Facebook API expects)
export type FacebookCampaignAPIObjective = 
  | 'OUTCOME_AWARENESS'
  | 'OUTCOME_TRAFFIC'
  | 'OUTCOME_SALES'
  | 'OUTCOME_APP_PROMOTION'
  | 'OUTCOME_LEADS'
  | 'OUTCOME_ENGAGEMENT'

export type FacebookCampaignStatus = 'ACTIVE' | 'PAUSED'

export type FacebookBuyingType = 'AUCTION'

export type FacebookBidStrategy = 'LOWEST_COST_WITHOUT_CAP'

export type FacebookSpecialAdCategory = 'NONE'

// Budget type for campaign
export type FacebookBudgetType = 'LIFETIME' | 'DAILY'

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

export type FacebookOptimizationGoal = 
  | 'LINK_CLICKS'
  | 'IMPRESSIONS'
  | 'REACH'
  | 'OFFSITE_CONVERSIONS'
  | 'LANDING_PAGE_VIEWS'
  | 'POST_ENGAGEMENT'
  | 'THRUPLAY'
  | 'LEAD_GENERATION'

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
  budget_type: FacebookBudgetType // NEW: Budget type selection
  lifetime_budget?: number // in cents - optional, used when budget_type is LIFETIME
  daily_budget?: number // in cents - optional, used when budget_type is DAILY
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
  billing_event: FacebookBillingEvent
  optimization_goal?: FacebookOptimizationGoal
  targeting: FacebookTargeting
  status: FacebookCampaignStatus
  start_time: string // ISO string
  end_time: string // ISO string
  // App promotion fields
  application_id?: string
  object_store_url?: string
  // Lead generation fields
  page_id?: string
}

export interface FacebookBatchCampaignAdSetData {
  campaign: FacebookCampaignData
  adset: Omit<FacebookAdSetData, 'campaign_id'>
}

// API-ready interfaces (what gets sent to Facebook)
export interface FacebookCampaignAPIData {
  name: string
  objective: FacebookCampaignAPIObjective
  status: FacebookCampaignStatus
  special_ad_categories: FacebookSpecialAdCategory[] | []
  buying_type: FacebookBuyingType
  bid_strategy: FacebookBidStrategy
  lifetime_budget?: number // Only included if budget_type is LIFETIME
  daily_budget?: number // Only included if budget_type is DAILY
}

export interface FacebookAdSetAPIData {
  name: string
  campaign_id: string
  billing_event: FacebookBillingEvent
  optimization_goal?: FacebookOptimizationGoal
  targeting: string // JSON stringified FacebookTargeting
  status: FacebookCampaignStatus
  start_time: string
  end_time: string
  promoted_object?: string // JSON stringified promoted object
}

// UI to API objective mapping
export const UI_TO_API_OBJECTIVE: Record<FacebookCampaignObjective, FacebookCampaignAPIObjective> = {
  'AWARENESS': 'OUTCOME_AWARENESS',
  'TRAFFIC': 'OUTCOME_TRAFFIC',
  'SALES': 'OUTCOME_SALES',
  'APP_PROMOTION': 'OUTCOME_APP_PROMOTION',
  'LEAD_GENERATION': 'OUTCOME_LEADS',
  'POST_ENGAGEMENT': 'OUTCOME_ENGAGEMENT'
}

// Objective to Billing Event mapping
export const OBJECTIVE_TO_BILLING_EVENT: Record<FacebookCampaignObjective, FacebookBillingEvent> = {
  'AWARENESS': 'IMPRESSIONS',
  'TRAFFIC': 'IMPRESSIONS',
  'SALES': 'LINK_CLICKS',
  'APP_PROMOTION': 'LINK_CLICKS',
  'LEAD_GENERATION': 'IMPRESSIONS',
  'POST_ENGAGEMENT': 'IMPRESSIONS'
}

// Objective to Optimization Goal mapping
export const OBJECTIVE_TO_OPTIMIZATION_GOAL: Record<FacebookCampaignObjective, FacebookOptimizationGoal | undefined> = {
  'AWARENESS': undefined,
  'TRAFFIC': undefined,
  'SALES': 'LINK_CLICKS',
  'APP_PROMOTION': 'LINK_CLICKS',
  'LEAD_GENERATION': 'LEAD_GENERATION',
  'POST_ENGAGEMENT': 'POST_ENGAGEMENT'
}

// Campaign objectives with human-readable labels
export const CAMPAIGN_OBJECTIVES = [
  { value: 'AWARENESS', label: 'Brand Awareness' },
  { value: 'TRAFFIC', label: 'Traffic' },
  { value: 'SALES', label: 'Sales' },
  { value: 'APP_PROMOTION', label: 'App Promotion' },
  { value: 'LEAD_GENERATION', label: 'Lead Generation' },
  { value: 'POST_ENGAGEMENT', label: 'Engagement' }
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
  bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
  budget_type: 'LIFETIME' // Default to lifetime budget
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

export function getOptimizationGoalForUIObjective(objective: FacebookCampaignObjective): FacebookOptimizationGoal | undefined {
  return OBJECTIVE_TO_OPTIMIZATION_GOAL[objective]
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
  
  if (!data.budget_type) {
    errors.push('Budget type is required')
  }
  
  // Validate budget based on budget type
  if (data.budget_type === 'LIFETIME') {
    if (!data.lifetime_budget || data.lifetime_budget <= 0) {
      errors.push('Lifetime budget must be greater than 0')
    }
    if (data.daily_budget) {
      errors.push('Cannot set daily budget when using lifetime budget')
    }
  } else if (data.budget_type === 'DAILY') {
    if (!data.daily_budget || data.daily_budget <= 0) {
      errors.push('Daily budget must be greater than 0')
    }
    if (data.lifetime_budget) {
      errors.push('Cannot set lifetime budget when using daily budget')
    }
  }
  
  return errors
}

export function validateAdSetData(data: Partial<FacebookAdSetData>): string[] {
  const errors: string[] = []
  
  if (!data.name?.trim()) {
    errors.push('Ad Set name is required')
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

// Enhanced validation function that accepts campaign objective for context
export function validateAdSetDataWithObjective(data: Partial<FacebookAdSetData>, campaignObjective?: FacebookCampaignObjective): string[] {
  const errors = validateAdSetData(data)
  
  // Additional validation for APP_PROMOTION campaigns
  if (campaignObjective === 'APP_PROMOTION') {
    if (!data.object_store_url?.trim()) {
      errors.push('App store URL is required for app promotion campaigns')
    }
    if (!data.application_id?.trim()) {
      errors.push('Application ID is required for app promotion campaigns')
    }
  }
  
  // Additional validation for LEAD_GENERATION campaigns
  if (campaignObjective === 'LEAD_GENERATION') {
    if (!data.page_id?.trim()) {
      errors.push('Facebook Page ID is required for lead generation campaigns')
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

// Helper function to get the budget amount based on type
export function getBudgetAmount(campaign: FacebookCampaignData): number {
  return campaign.budget_type === 'LIFETIME' 
    ? campaign.lifetime_budget || 0 
    : campaign.daily_budget || 0
}

// Helper function to get budget label for UI
export function getBudgetLabel(budgetType: FacebookBudgetType): string {
  return budgetType === 'LIFETIME' ? 'Lifetime Budget' : 'Daily Budget'
}

// Convert form data to API-ready format
export function prepareCampaignForAPI(data: FacebookCampaignData): FacebookCampaignAPIData {
  const apiData: FacebookCampaignAPIData = {
    name: data.name,
    objective: getAPIObjectiveFromUIObjective(data.objective),
    status: data.status,
    special_ad_categories: data.special_ad_categories,
    buying_type: data.buying_type,
    bid_strategy: data.bid_strategy
  }

  // Only include the budget field that corresponds to the budget type
  if (data.budget_type === 'LIFETIME' && data.lifetime_budget) {
    apiData.lifetime_budget = data.lifetime_budget
  } else if (data.budget_type === 'DAILY' && data.daily_budget) {
    apiData.daily_budget = data.daily_budget
  }

  return apiData
}

export function prepareAdSetForAPI(data: FacebookAdSetData): FacebookAdSetAPIData {
  const apiData: FacebookAdSetAPIData = {
    name: data.name,
    campaign_id: data.campaign_id,
    billing_event: data.billing_event,
    targeting: JSON.stringify(data.targeting),
    status: data.status,
    start_time: data.start_time,
    end_time: data.end_time
  }

  // Only include optimization_goal if it's specified
  if (data.optimization_goal) {
    apiData.optimization_goal = data.optimization_goal
  }

  // Include promoted_object for APP_PROMOTION campaigns
  if (data.object_store_url?.trim() && data.application_id?.trim()) {
    apiData.promoted_object = JSON.stringify({
      application_id: data.application_id,
      object_store_url: data.object_store_url
    })
  }

  // Include promoted_object for LEAD_GENERATION campaigns
  if (data.page_id?.trim()) {
    apiData.promoted_object = JSON.stringify({
      page_id: data.page_id
    })
  }

  return apiData
}