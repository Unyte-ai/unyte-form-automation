import { useState } from 'react'
import { toast } from 'sonner'
import { populateMetaFormFromFormData } from '@/lib/meta-autopopulate-utils'
import { getBudgetAllocationSummary } from '@/lib/meta-budget-utils'
import { 
  FacebookCampaignData,
  FacebookAdSetData,
  DEFAULT_CAMPAIGN_VALUES,
  DEFAULT_ADSET_VALUES,
  validateCampaignData,
  validateAdSetDataWithObjective,
  getBillingEventForUIObjective,
  getOptimizationGoalForUIObjective
} from '@/lib/facebook-campaign-utils'

// Define interfaces for form data
interface FormQuestion {
  question: string;
  answer: string;
}

interface StructuredData {
  rawText: string;
  formData: FormQuestion[];
}

export function useMetaCampaignForm(formData?: StructuredData) {
  // Get default start date (tomorrow)
  function getDefaultStartDate(): string {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return tomorrow.toISOString()
  }

  // Get default end date (one week from start date)
  function getDefaultEndDate(): string {
    const startDate = new Date(getDefaultStartDate())
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 7)
    return endDate.toISOString()
  }

  // State management
  const [hasAutoPopulated, setHasAutoPopulated] = useState(false)
  
  // Budget lock state
  const [isBudgetLocked, setIsBudgetLocked] = useState(false) // Budget starts unlocked
  
  // Date lock state
  const [isDateLocked, setIsDateLocked] = useState(false) // Dates start unlocked
  
  // Campaign form state
  const [campaignData, setCampaignData] = useState<Partial<FacebookCampaignData>>({
    name: '',
    objective: undefined,
    status: DEFAULT_CAMPAIGN_VALUES.status,
    special_ad_categories: DEFAULT_CAMPAIGN_VALUES.special_ad_categories,
    buying_type: DEFAULT_CAMPAIGN_VALUES.buying_type,
    bid_strategy: DEFAULT_CAMPAIGN_VALUES.bid_strategy,
    budget_type: DEFAULT_CAMPAIGN_VALUES.budget_type, // 'LIFETIME' by default
    lifetime_budget: 0,
    daily_budget: undefined
  })

  // Ad Set form state
  const [adSetData, setAdSetData] = useState<Partial<Omit<FacebookAdSetData, 'campaign_id'>>>({
    name: '',
    targeting: DEFAULT_ADSET_VALUES.targeting,
    status: DEFAULT_ADSET_VALUES.status,
    start_time: getDefaultStartDate(),
    end_time: getDefaultEndDate(),
    application_id: '',
    object_store_url: ''
  })

  // Form validation errors
  const [campaignErrors, setCampaignErrors] = useState<Record<string, string>>({})
  const [adSetErrors, setAdSetErrors] = useState<Record<string, string>>({})

  // Toggle budget lock function
  const toggleBudgetLock = () => {
    setIsBudgetLocked(!isBudgetLocked)
  }

  // Toggle date lock function
  const toggleDateLock = () => {
    setIsDateLocked(!isDateLocked)
  }

  // Auto-populate handler
  const handleAutoPopulate = () => {
    if (!formData?.formData) {
      toast.error('No form data available for auto-population')
      return
    }

    try {
      // Use the utility function to populate both campaign and ad set data
      const result = populateMetaFormFromFormData(formData, campaignData, adSetData)
      
      // Update the form state with populated data
      setCampaignData(result.campaignData)
      setAdSetData(result.adSetData)
      
      // Clear any existing errors when auto-populating
      setCampaignErrors({})
      setAdSetErrors({})

      // Lock budget fields after auto-populate if budget data was populated
      const hasBudgetData = result.campaignData.budget_type || 
                           result.campaignData.lifetime_budget || 
                           result.campaignData.daily_budget
      if (hasBudgetData) {
        setIsBudgetLocked(true)
      }

      // Lock date fields after auto-populate if date data was populated
      const hasDateData = result.adSetData.start_time !== getDefaultStartDate() || 
                          result.adSetData.end_time !== getDefaultEndDate()
      if (hasDateData) {
        setIsDateLocked(true)
      }
      
      // Show success message with what was populated
      if (result.populatedFields.length > 0) {
        // Get budget allocation summary for additional information
        const selectedPlatforms = result.adSetData.targeting?.publisher_platforms || []
        const budgetSummary = getBudgetAllocationSummary(formData, selectedPlatforms)
        
        toast.success('Auto-populated successfully!', {
          description: `Filled: ${result.populatedFields.join(', ')}\n${budgetSummary}`
        })
      } else {
        toast.info('No matching fields found in form data', {
          description: 'Form data may not contain the expected campaign information'
        })
      }

    } catch (error) {
      console.error('Error during auto-populate:', error)
      toast.error('Auto-populate failed', {
        description: 'An error occurred while processing the form data'
      })
    }
  }

  // Validate form data and convert validation errors to error objects
  const validateFormData = (): boolean => {
    // Validate campaign data
    const campaignValidationErrors = validateCampaignData(campaignData)
    const campaignErrorObj: Record<string, string> = {}
    campaignValidationErrors.forEach((error: string) => {
      if (error.includes('name')) campaignErrorObj.name = error
      if (error.includes('objective')) campaignErrorObj.objective = error
      if (error.includes('budget type')) campaignErrorObj.budget_type = error
      if (error.includes('Lifetime budget')) campaignErrorObj.lifetime_budget = error
      if (error.includes('Daily budget')) campaignErrorObj.daily_budget = error
      if (error.includes('lifetime budget')) campaignErrorObj.lifetime_budget = error
      if (error.includes('daily budget')) campaignErrorObj.daily_budget = error
    })
    setCampaignErrors(campaignErrorObj)

    // Prepare ad set data for validation
    const tempAdSetData: FacebookAdSetData = {
      ...(adSetData as Omit<FacebookAdSetData, 'campaign_id' | 'billing_event' | 'optimization_goal'>),
      campaign_id: 'temp',
      billing_event: campaignData.objective ? getBillingEventForUIObjective(campaignData.objective) : 'IMPRESSIONS'
    }
    
    // Add optimization goal if one is specified for this objective
    const optimizationGoal = campaignData.objective ? getOptimizationGoalForUIObjective(campaignData.objective) : undefined
    if (optimizationGoal) {
      tempAdSetData.optimization_goal = optimizationGoal
    }

    // For APP_PROMOTION, ensure both fields are provided for validation
    if (campaignData.objective === 'APP_PROMOTION') {
      tempAdSetData.object_store_url = adSetData.object_store_url || ''
      tempAdSetData.application_id = adSetData.application_id || ''
    }
    
    const adSetValidationErrors = validateAdSetDataWithObjective(tempAdSetData, campaignData.objective)
    const adSetErrorObj: Record<string, string> = {}
    adSetValidationErrors.forEach((error: string) => {
      if (error.includes('Ad Set name')) adSetErrorObj.name = error
      if (error.includes('country')) adSetErrorObj.countries = error
      if (error.includes('publisher platform')) adSetErrorObj.publisher_platforms = error
      if (error.includes('Application ID')) adSetErrorObj.application_id = error
      if (error.includes('App store URL')) adSetErrorObj.object_store_url = error
      if (error.includes('age')) {
        if (error.includes('Minimum')) adSetErrorObj.age_min = error
        if (error.includes('Maximum')) adSetErrorObj.age_max = error
      }
      if (error.includes('Start time')) adSetErrorObj.start_time = error
      if (error.includes('End time')) adSetErrorObj.end_time = error
    })
    setAdSetErrors(adSetErrorObj)

    return campaignValidationErrors.length === 0 && adSetValidationErrors.length === 0
  }

  // Reset form to initial state
  const resetForm = () => {
    setCampaignData({
      name: '',
      objective: undefined,
      status: DEFAULT_CAMPAIGN_VALUES.status,
      special_ad_categories: DEFAULT_CAMPAIGN_VALUES.special_ad_categories,
      buying_type: DEFAULT_CAMPAIGN_VALUES.buying_type,
      bid_strategy: DEFAULT_CAMPAIGN_VALUES.bid_strategy,
      budget_type: DEFAULT_CAMPAIGN_VALUES.budget_type,
      lifetime_budget: 0,
      daily_budget: undefined
    })

    setAdSetData({
      name: '',
      targeting: DEFAULT_ADSET_VALUES.targeting,
      status: DEFAULT_ADSET_VALUES.status,
      start_time: getDefaultStartDate(),
      end_time: getDefaultEndDate(),
      application_id: '',
      object_store_url: ''
    })

    // Clear errors
    setCampaignErrors({})
    setAdSetErrors({})

    // Reset lock states
    setIsBudgetLocked(false)
    setIsDateLocked(false)

    // Reset auto-populate state
    setHasAutoPopulated(false)
  }

  return {
    // State
    campaignData,
    setCampaignData,
    adSetData,
    setAdSetData,
    campaignErrors,
    adSetErrors,
    isBudgetLocked,
    isDateLocked,
    hasAutoPopulated,
    setHasAutoPopulated,
    
    // Actions
    toggleBudgetLock,
    toggleDateLock,
    handleAutoPopulate,
    validateFormData,
    resetForm,
    
    // Utilities
    getDefaultStartDate,
    getDefaultEndDate
  }
}