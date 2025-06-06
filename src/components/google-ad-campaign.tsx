'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { createGoogleCampaign, CreateGoogleCampaignData } from '@/app/actions/google-create-campaign'
import { useGoogleCampaignForm } from '@/hooks/use-google-campaign-form'
import { useGoogleCampaignBlurConfirmation } from '@/hooks/use-google-campaign-blur-confirmation'
import { GoogleCampaignBasicFields } from './google-campaign-basic-fields'
import { GoogleCampaignBudgetSection } from './google-campaign-budget-section'
import { GoogleCampaignDateSection } from './google-campaign-date-section'
import { GoogleCampaignSuccessDisplay } from './google-campaign-success-display'
import { GoogleCampaignBlurConfirmationDialog } from './google-campaign-blur-confirmation-dialog'
import { toast } from 'sonner'

// Define interfaces for form data
interface FormQuestion {
  question: string;
  answer: string;
}

interface StructuredData {
  rawText: string;
  formData: FormQuestion[];
}

interface GoogleAdCampaignProps {
  customerId: string
  accountName: string
  organizationId: string
  managerCustomerId?: string
  formData?: StructuredData
}

export function GoogleAdCampaign({ 
  customerId, 
  accountName, 
  organizationId,
  managerCustomerId,
  formData
}: GoogleAdCampaignProps) {
  // Use the custom hook for all form state management
  const {
    // State
    campaignName,
    campaignType,
    budgetType,
    budgetAmount,
    startDate,
    endDate,
    isCreating,
    
    // Individual lock states
    isBudgetTypeLocked,
    isBudgetAmountLocked,
    isStartDateLocked,
    isEndDateLocked,
    
    createdCampaign,
    originalFormData,
    
    // Setters
    setCampaignName,
    setCampaignType,
    setBudgetType,
    setBudgetAmount,
    setStartDate,
    setEndDate,
    setIsCreating,
    setCreatedCampaign,
    
    // Individual lock setters
    setIsBudgetTypeLocked,
    setIsBudgetAmountLocked,
    setIsStartDateLocked,
    setIsEndDateLocked,
    
    // Utilities
    getTomorrowDate,
    handleAutoPopulate,
    resetForm,
    initializeDefaultDates,
    hasBudgetOriginalData,
    hasDateOriginalData
  } = useGoogleCampaignForm(formData)

  // Use the new blur confirmation hook
  const {
    confirmationState,
    requestConfirmation,
    confirmChange,
    cancelChange
  } = useGoogleCampaignBlurConfirmation()

  // Track values when focus enters fields for comparison on blur
  const focusValues = useRef({
    budgetType: '',
    budgetAmount: '',
    startDate: '',
    endDate: ''
  })

  // Initialize default dates on first render
  useEffect(() => {
    initializeDefaultDates()
  }, [initializeDefaultDates])

  // Auto-populate on component mount when formData is available
  useEffect(() => {
    if (formData?.formData && formData.formData.length > 0) {
      console.log('GoogleAdCampaign mounted with form data, triggering auto-populate')
      handleAutoPopulate()
    }
  }, [formData, handleAutoPopulate])

  const handleCreateCampaign = async () => {
    if (!campaignName.trim()) {
      toast.error('Campaign name is required')
      return
    }

    const budgetValue = parseFloat(budgetAmount)
    if (isNaN(budgetValue) || budgetValue <= 0) {
      toast.error('Please enter a valid budget amount')
      return
    }

    if (!startDate) {
      toast.error('Start date is required')
      return
    }

    if (!endDate) {
      toast.error('End date is required')
      return
    }

    // Validate date range
    const start = new Date(startDate)
    const end = new Date(endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (start <= today) {
      toast.error('Start date must be in the future')
      return
    }

    if (end <= start) {
      toast.error('End date must be after start date')
      return
    }

    try {
      setIsCreating(true)

      const campaignData: CreateGoogleCampaignData = {
        campaignName: campaignName.trim(),
        campaignType,
        budgetType,
        budgetAmount: budgetValue,
        startDate,
        endDate,
        customerId,
        ...(managerCustomerId && { managerCustomerId })
      }

      const result = await createGoogleCampaign(organizationId, campaignData)

      if (result.success && result.data) {
        toast.success('Campaign created successfully!', {
          description: `Campaign "${campaignName}" has been created and is paused. You can now customize it in Google Ads Manager.`
        })
        
        setCreatedCampaign({
          campaignId: result.data.campaignId,
          campaignName: campaignName.trim(),
        })
        
        // Reset form using the hook's utility function
        resetForm()
      } else {
        throw new Error(result.error || 'Failed to create campaign')
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
      toast.error('Failed to create campaign', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateAnother = () => {
    setCreatedCampaign(null)
  }

  // Individual unlock handlers
  const handleBudgetTypeUnlock = () => {
    setIsBudgetTypeLocked(!isBudgetTypeLocked)
  }

  const handleBudgetAmountUnlock = () => {
    setIsBudgetAmountLocked(!isBudgetAmountLocked)
  }

  const handleStartDateUnlock = () => {
    setIsStartDateLocked(!isStartDateLocked)
  }

  const handleEndDateUnlock = () => {
    setIsEndDateLocked(!isEndDateLocked)
  }

  // Focus handlers to capture current values
  const handleBudgetTypeFocus = () => {
    focusValues.current.budgetType = budgetType
  }

  const handleBudgetAmountFocus = () => {
    focusValues.current.budgetAmount = budgetAmount
  }

  const handleStartDateFocus = () => {
    focusValues.current.startDate = startDate
  }

  const handleEndDateFocus = () => {
    focusValues.current.endDate = endDate
  }

  // Blur handlers to detect changes and show confirmation
  const handleBudgetTypeBlur = () => {
    if (focusValues.current.budgetType !== budgetType) {
      const originalValue = originalFormData.budgetType || focusValues.current.budgetType
      requestConfirmation(
        'budget-type',
        originalValue,
        budgetType,
        hasBudgetOriginalData(),
        () => setBudgetType(originalValue as 'daily' | 'total')
      )
    }
  }

  const handleBudgetAmountBlur = () => {
    if (focusValues.current.budgetAmount !== budgetAmount) {
      const originalValue = originalFormData.budgetAmount || focusValues.current.budgetAmount
      requestConfirmation(
        'budget-amount',
        originalValue,
        budgetAmount,
        hasBudgetOriginalData(),
        () => setBudgetAmount(originalValue)
      )
    }
  }

  const handleStartDateBlur = () => {
    if (focusValues.current.startDate !== startDate) {
      const originalValue = originalFormData.startDate || focusValues.current.startDate
      requestConfirmation(
        'start-date',
        originalValue,
        startDate,
        hasDateOriginalData(),
        () => setStartDate(originalValue)
      )
    }
  }

  const handleEndDateBlur = () => {
    if (focusValues.current.endDate !== endDate) {
      const originalValue = originalFormData.endDate || focusValues.current.endDate
      requestConfirmation(
        'end-date',
        originalValue,
        endDate,
        hasDateOriginalData(),
        () => setEndDate(originalValue)
      )
    }
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="p-4 border rounded-lg bg-muted/30">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Create Campaign</h3>
        </div>

        {createdCampaign ? (
          <GoogleCampaignSuccessDisplay
            createdCampaign={createdCampaign}
            onCreateAnother={handleCreateAnother}
          />
        ) : (
          <div className="space-y-4">
            <GoogleCampaignBasicFields
              campaignName={campaignName}
              campaignType={campaignType}
              accountName={accountName}
              managerCustomerId={managerCustomerId}
              onCampaignNameChange={setCampaignName}
              onCampaignTypeChange={setCampaignType}
              disabled={isCreating}
            />

            <GoogleCampaignBudgetSection
              budgetType={budgetType}
              budgetAmount={budgetAmount}
              
              // Individual lock states
              isBudgetTypeLocked={isBudgetTypeLocked}
              isBudgetAmountLocked={isBudgetAmountLocked}
              
              onBudgetTypeChange={setBudgetType}
              onBudgetAmountChange={setBudgetAmount}
              
              // Individual unlock handlers
              onBudgetTypeUnlock={handleBudgetTypeUnlock}
              onBudgetAmountUnlock={handleBudgetAmountUnlock}
              
              onBudgetTypeFocus={handleBudgetTypeFocus}
              onBudgetTypeBlur={handleBudgetTypeBlur}
              onBudgetAmountFocus={handleBudgetAmountFocus}
              onBudgetAmountBlur={handleBudgetAmountBlur}
              originalFormData={originalFormData}
              disabled={isCreating}
            />

            <GoogleCampaignDateSection
              startDate={startDate}
              endDate={endDate}
              
              // Individual lock states
              isStartDateLocked={isStartDateLocked}
              isEndDateLocked={isEndDateLocked}
              
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              
              // Individual unlock handlers
              onStartDateUnlock={handleStartDateUnlock}
              onEndDateUnlock={handleEndDateUnlock}
              
              onStartDateFocus={handleStartDateFocus}
              onStartDateBlur={handleStartDateBlur}
              onEndDateFocus={handleEndDateFocus}
              onEndDateBlur={handleEndDateBlur}
              getTomorrowDate={getTomorrowDate}
              originalFormData={originalFormData}
              disabled={isCreating}
            />

            <div className="pt-2">
              <Button 
                onClick={handleCreateCampaign}
                disabled={isCreating || !campaignName.trim() || !startDate || !endDate}
                className="w-full"
              >
                {isCreating ? 'Creating Campaign...' : 'Create Paused Campaign'}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Campaign will be created in a paused state for safe customization
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Blur Confirmation Dialog */}
      <GoogleCampaignBlurConfirmationDialog
        isOpen={confirmationState.isOpen}
        fieldType={confirmationState.fieldType}
        originalValue={confirmationState.originalValue}
        newValue={confirmationState.newValue}
        hasOriginalData={confirmationState.hasOriginalData}
        onConfirm={confirmChange}
        onCancel={cancelChange}
      />
    </div>
  )
}