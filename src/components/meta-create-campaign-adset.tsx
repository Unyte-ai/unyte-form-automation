'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { MetaCampaignFields } from '@/components/meta-campaign-fields'
import { MetaAdSetFields } from '@/components/meta-adset-fields'
import { MetaCampaignBlurConfirmationDialog } from '@/components/meta-campaign-blur-confirmation-dialog'
import { useMetaCampaignForm } from '@/hooks/use-meta-campaign-form'
import { useMetaCampaignBlurConfirmation } from '@/hooks/use-meta-campaign-blur-confirmation'
import { createFacebookCampaignAndAdSet } from '@/app/actions/facebook-batch-campaign-adset'
import { 
  FacebookCampaignData,
  FacebookAdSetData,
  FacebookBatchCampaignAdSetData,
  getBillingEventForUIObjective,
  getOptimizationGoalForUIObjective,
  getBudgetLabel,
  formatBudgetCents
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

interface MetaCreateCampaignAdSetProps {
  organizationId: string
  selectedAdAccount: string // Facebook Ad Account ID (with act_ prefix)
  onCampaignCreated?: (campaign: { campaignId: string; campaignName: string; adSetId: string; adSetName: string }) => void
  formData?: StructuredData // Add formData prop
}

export function MetaCreateCampaignAdSet({ 
  organizationId, 
  selectedAdAccount, 
  onCampaignCreated,
  formData // Add formData prop
}: MetaCreateCampaignAdSetProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // Use the custom hook for form state management
  const {
    campaignData,
    setCampaignData,
    adSetData,
    setAdSetData,
    campaignErrors,
    adSetErrors,
    
    // Individual lock states (following Google pattern)
    isBudgetTypeLocked,
    isBudgetAmountLocked,
    isStartDateLocked,
    isEndDateLocked,
    
    hasAutoPopulated,
    setHasAutoPopulated,
    originalFormData,
    
    // Individual toggle actions (following Google pattern)
    toggleBudgetTypeLock,
    toggleBudgetAmountLock,
    toggleStartDateLock,
    toggleEndDateLock,
    
    handleAutoPopulate,
    validateFormData,
    resetForm,
    hasBudgetOriginalData,
    hasDateOriginalData
  } = useMetaCampaignForm(formData)

  // Use the blur confirmation hook
  const {
    confirmationState,
    requestConfirmation,
    confirmChange,
    cancelChange
  } = useMetaCampaignBlurConfirmation()

  // Track values when focus enters fields for comparison on blur
  const focusValues = useRef({
    budgetType: '',
    budgetAmount: '',
    startDate: '',
    endDate: ''
  })

  // Focus handlers to capture current values
  const handleBudgetTypeFocus = () => {
    focusValues.current.budgetType = campaignData.budget_type || 'LIFETIME'
  }

  const handleBudgetAmountFocus = () => {
    const currentBudgetType = campaignData.budget_type || 'LIFETIME'
    const budgetAmount = currentBudgetType === 'LIFETIME' ? campaignData.lifetime_budget : campaignData.daily_budget
    focusValues.current.budgetAmount = budgetAmount ? formatBudgetCents(budgetAmount) : ''
  }

  const handleStartDateFocus = () => {
    focusValues.current.startDate = adSetData.start_time || ''
  }

  const handleEndDateFocus = () => {
    focusValues.current.endDate = adSetData.end_time || ''
  }

  // Blur handlers to detect changes and show confirmation
  const handleBudgetTypeBlur = () => {
    const currentBudgetType = campaignData.budget_type || 'LIFETIME'
    if (focusValues.current.budgetType !== currentBudgetType) {
      const originalValue = originalFormData.budgetType || focusValues.current.budgetType
      requestConfirmation(
        'budget-type',
        originalValue,
        currentBudgetType,
        hasBudgetOriginalData(),
        () => setCampaignData({ ...campaignData, budget_type: originalValue as 'LIFETIME' | 'DAILY' })
      )
    }
  }

  const handleBudgetAmountBlur = () => {
    const currentBudgetType = campaignData.budget_type || 'LIFETIME'
    const budgetAmount = currentBudgetType === 'LIFETIME' ? campaignData.lifetime_budget : campaignData.daily_budget
    const currentBudgetDisplay = budgetAmount ? formatBudgetCents(budgetAmount) : ''
    
    if (focusValues.current.budgetAmount !== currentBudgetDisplay) {
      const originalValue = originalFormData.budgetAmount || focusValues.current.budgetAmount
      requestConfirmation(
        'budget-amount',
        originalValue,
        currentBudgetDisplay,
        hasBudgetOriginalData(),
        () => {
          const originalBudgetCents = originalValue ? Math.round(parseFloat(originalValue) * 100) : 0
          if (currentBudgetType === 'LIFETIME') {
            setCampaignData({ ...campaignData, lifetime_budget: originalBudgetCents, daily_budget: undefined })
          } else {
            setCampaignData({ ...campaignData, daily_budget: originalBudgetCents, lifetime_budget: undefined })
          }
        }
      )
    }
  }

  const handleStartDateBlur = () => {
    const currentStartDate = adSetData.start_time || ''
    if (focusValues.current.startDate !== currentStartDate) {
      const originalValue = originalFormData.startDate || focusValues.current.startDate
      requestConfirmation(
        'start-date',
        originalValue,
        currentStartDate,
        hasDateOriginalData(),
        () => setAdSetData({ ...adSetData, start_time: originalValue })
      )
    }
  }

  const handleEndDateBlur = () => {
    const currentEndDate = adSetData.end_time || ''
    if (focusValues.current.endDate !== currentEndDate) {
      const originalValue = originalFormData.endDate || focusValues.current.endDate
      requestConfirmation(
        'end-date',
        originalValue,
        currentEndDate,
        hasDateOriginalData(),
        () => setAdSetData({ ...adSetData, end_time: originalValue })
      )
    }
  }

  // Handle expand and auto-populate
  const handleExpandAndAutoPopulate = () => {
    setIsExpanded(true)
    
    // Auto-populate immediately if we have form data and haven't done it yet
    if (formData?.formData && !hasAutoPopulated) {
      // Small delay to ensure form is rendered
      setTimeout(() => {
        handleAutoPopulate()
        setHasAutoPopulated(true)
      }, 0)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form data
    if (!validateFormData()) {
      toast.error('Please fix the form errors before submitting')
      return
    }

    if (!selectedAdAccount) {
      toast.error('Please select an ad account first')
      return
    }

    try {
      setIsCreating(true)

      // Prepare ad set data - only include app promotion fields for APP_PROMOTION campaigns
      let finalAdSetData = { ...adSetData }
      
      if (campaignData.objective !== 'APP_PROMOTION') {
        // Remove app promotion fields for other objectives
        const { application_id, object_store_url, ...adSetWithoutAppFields } = finalAdSetData // eslint-disable-line @typescript-eslint/no-unused-vars
        finalAdSetData = adSetWithoutAppFields
      }

      // Prepare batch data
      const batchData: FacebookBatchCampaignAdSetData = {
        campaign: campaignData as FacebookCampaignData,
        adset: finalAdSetData as Omit<FacebookAdSetData, 'campaign_id'>
      }

      // Call batch server action
      const result = await createFacebookCampaignAndAdSet(organizationId, selectedAdAccount, batchData)

      if (!result.success) {
        throw new Error(result.error || 'Failed to create campaign and ad set')
      }

      // Success
      const budgetTypeLabel = campaignData.budget_type === 'LIFETIME' ? 'lifetime' : 'daily'
      toast.success('Campaign and Ad Set created successfully', {
        description: `Campaign "${result.data!.campaignName}" with ${budgetTypeLabel} budget and Ad Set "${result.data!.adSetName}" have been created.`
      })

      // Reset form using the hook
      resetForm()

      // Collapse form
      setIsExpanded(false)

      // Notify parent component
      if (onCampaignCreated && result.data) {
        onCampaignCreated({
          campaignId: result.data.campaignId,
          campaignName: result.data.campaignName,
          adSetId: result.data.adSetId,
          adSetName: result.data.adSetName
        })
      }

    } catch (error) {
      console.error('Error creating Facebook campaign and ad set:', error)
      toast.error('Failed to create campaign and ad set', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      {!isExpanded ? (
        <div className="border-t pt-4">
          <Button 
            variant="ghost" 
            onClick={handleExpandAndAutoPopulate}
            className="w-full justify-start text-sm"
            disabled={!selectedAdAccount}
          >
            <Plus className="mr-2 size-4" />
            Create New Campaign & Ad Set
          </Button>
          {!selectedAdAccount && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Select an ad account to create a new campaign
            </p>
          )}
        </div>
      ) : (
        <Card className="border-t-0 rounded-t-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Create New Campaign & Ad Set</CardTitle>
            <p className="text-sm text-muted-foreground">
              This will create both a campaign and ad set together using Facebook&apos;s batch API. 
              Budget will be set at the campaign level and distributed across ad sets.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campaign Fields Section */}
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="font-medium text-sm">Campaign Settings</h3>
                  <p className="text-xs text-muted-foreground">Configure your campaign objective and budget</p>
                </div>
                <MetaCampaignFields
                  value={campaignData}
                  onChange={setCampaignData}
                  errors={campaignErrors}
                  
                  // Individual lock states and handlers (following Google pattern)
                  isBudgetTypeLocked={isBudgetTypeLocked}
                  isBudgetAmountLocked={isBudgetAmountLocked}
                  onToggleBudgetTypeLock={toggleBudgetTypeLock}
                  onToggleBudgetAmountLock={toggleBudgetAmountLock}
                  
                  // Focus/blur handlers for blur confirmation
                  onBudgetTypeFocus={handleBudgetTypeFocus}
                  onBudgetTypeBlur={handleBudgetTypeBlur}
                  onBudgetAmountFocus={handleBudgetAmountFocus}
                  onBudgetAmountBlur={handleBudgetAmountBlur}
                  
                  // Original form data for display
                  originalFormData={originalFormData}
                  disabled={isCreating}
                />
              </div>

              {/* Ad Set Fields Section */}
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="font-medium text-sm">Ad Set Settings</h3>
                  <p className="text-xs text-muted-foreground">
                    Configure targeting and schedule (budget comes from campaign)
                  </p>
                </div>
                <MetaAdSetFields
                  value={adSetData}
                  onChange={setAdSetData}
                  errors={adSetErrors}
                  campaignObjective={campaignData.objective}
                  
                  // Individual lock states and handlers (following Google pattern)
                  isStartDateLocked={isStartDateLocked}
                  isEndDateLocked={isEndDateLocked}
                  onToggleStartDateLock={toggleStartDateLock}
                  onToggleEndDateLock={toggleEndDateLock}
                  
                  // Focus/blur handlers for blur confirmation
                  onStartDateFocus={handleStartDateFocus}
                  onStartDateBlur={handleStartDateBlur}
                  onEndDateFocus={handleEndDateFocus}
                  onEndDateBlur={handleEndDateBlur}
                  
                  // Original form data for display
                  originalFormData={originalFormData}
                  disabled={isCreating}
                />
              </div>

              {/* Billing Event and Optimization Goal Info */}
              {campaignData.objective && (
                <div className="p-3 rounded-md bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                  <p className="text-blue-800 dark:text-blue-300 text-sm">
                    <strong>Billing Event:</strong> {getBillingEventForUIObjective(campaignData.objective)}
                    {getOptimizationGoalForUIObjective(campaignData.objective) && (
                      <>
                        <br />
                        <strong>Optimization Goal:</strong> {getOptimizationGoalForUIObjective(campaignData.objective)}
                      </>
                    )}
                    <br />
                    <strong>Budget Type:</strong> {getBudgetLabel(campaignData.budget_type || 'LIFETIME')}
                    <br />
                    <span className="text-xs">
                      These settings are automatically configured based on your selected campaign objective.
                      Budget is managed at the campaign level.
                    </span>
                  </p>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsExpanded(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Campaign & Ad Set'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Blur Confirmation Dialog */}
      <MetaCampaignBlurConfirmationDialog
        isOpen={confirmationState.isOpen}
        fieldType={confirmationState.fieldType}
        originalValue={confirmationState.originalValue}
        newValue={confirmationState.newValue}
        hasOriginalData={confirmationState.hasOriginalData}
        onConfirm={confirmChange}
        onCancel={cancelChange}
      />
    </>
  )
}