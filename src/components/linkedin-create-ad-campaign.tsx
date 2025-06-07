'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { useLinkedInCampaignForm } from '@/hooks/useLinkedInCampaignForm'
import { useLinkedInAutoPopulate } from '@/hooks/useLinkedInAutoPopulate'
import { useLinkedInCampaignSubmission } from '@/hooks/useLinkedInCampaignSubmission'
import { useLinkedInCampaignBlurConfirmation } from '@/hooks/use-linkedin-campaign-blur-confirmation'
import { LinkedInCampaignBasicInfo } from '@/components/linkedin-campaign-basic-info'
import { LinkedInCampaignBudgetSection } from '@/components/linkedin-campaign-budget-section'
import { LinkedInCampaignScheduleSection } from '@/components/linkedin-campaign-schedule-section'
import { LinkedInCampaignLocaleSection } from '@/components/linkedin-campaign-locale-section'
import { LinkedInCampaignFormActions } from '@/components/linkedin-campaign-form-actions'
import { LinkedInCampaignBlurConfirmationDialog } from '@/components/linkedin-campaign-blur-confirmation-dialog'

interface FormQuestion {
  question: string;
  answer: string;
}

interface StructuredData {
  rawText: string;
  formData: FormQuestion[];
}

interface LinkedInCreateAdCampaignProps {
  organizationId: string
  selectedAccount: string // Ad Account URN
  selectedCampaignGroup: string // Campaign Group URN
  onCampaignCreated?: (campaign: { id: string; name: string }) => void
  formData?: StructuredData // Add formData prop
}

export function LinkedInCreateAdCampaign({ 
  organizationId, 
  selectedAccount, 
  selectedCampaignGroup,
  onCampaignCreated,
  formData // Add formData prop
}: LinkedInCreateAdCampaignProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Use custom hooks
  const {
    // Form state
    name,
    setName,
    campaignType,
    setCampaignType,
    budgetType,
    setBudgetType,
    budgetAmount,
    setBudgetAmount,
    currency,
    setCurrency,
    country,
    setCountry,
    language,
    setLanguage,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    
    // Individual lock states
    isBudgetTypeLocked,
    setIsBudgetTypeLocked,
    isBudgetAmountLocked,
    setIsBudgetAmountLocked,
    isStartDateLocked,
    setIsStartDateLocked,
    isEndDateLocked,
    setIsEndDateLocked,
    
    // Individual toggle functions
    toggleBudgetTypeLock,
    toggleBudgetAmountLock,
    toggleStartDateLock,
    toggleEndDateLock,
    resetForm,

    // Original form data tracking
    originalFormData,
    setOriginalFormData,
    hasBudgetOriginalData,
    hasDateOriginalData
  } = useLinkedInCampaignForm()

  // Use the blur confirmation hook
  const {
    confirmationState,
    requestConfirmation,
    confirmChange,
    cancelChange
  } = useLinkedInCampaignBlurConfirmation()

  // Track values when focus enters fields for comparison on blur
  const focusValues = useRef({
    budgetType: '',
    budgetAmount: '',
    startDate: '',
    endDate: ''
  })

  // Auto-populate hook
  const { handleAutoPopulate } = useLinkedInAutoPopulate({
    formData,
    setName,
    setCampaignType,
    setBudgetType,
    setBudgetAmount,
    setCurrency,
    setCountry,
    setLanguage,
    setStartDate,
    setEndDate,
    setIsBudgetTypeLocked,
    setIsBudgetAmountLocked,
    setIsStartDateLocked,
    setIsEndDateLocked,
    setOriginalFormData,
    campaignType
  })

  // Submission hook
  const { isCreating, handleSubmit } = useLinkedInCampaignSubmission({
    organizationId,
    selectedAccount,
    selectedCampaignGroup,
    name,
    campaignType,
    budgetType,
    budgetAmount,
    currency,
    country,
    language,
    startDate,
    endDate,
    resetForm,
    setIsExpanded,
    onCampaignCreated
  })

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

  // Handle expanding form and auto-populate
  const handleExpandAndAutoPopulate = () => {
    setIsExpanded(true)
    
    // Run auto-populate if form data is available
    if (formData?.formData) {
      handleAutoPopulate()
    }
  }

  // Handle cancel
  const handleCancel = () => {
    setIsExpanded(false)
  }

  if (!isExpanded) {
    return (
      <div className="border-t pt-4">
        <Button 
          variant="ghost" 
          onClick={handleExpandAndAutoPopulate}
          className="w-full justify-start text-sm"
        >
          <Plus className="mr-2 size-4" />
          Create New Campaign
        </Button>
      </div>
    )
  }

  return (
    <Card className="border-t-0 rounded-t-none">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">Create New Campaign</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <LinkedInCampaignBasicInfo
            name={name}
            setName={setName}
            campaignType={campaignType}
            setCampaignType={setCampaignType}
          />

          <LinkedInCampaignBudgetSection
            budgetType={budgetType}
            setBudgetType={setBudgetType}
            budgetAmount={budgetAmount}
            setBudgetAmount={setBudgetAmount}
            currency={currency}
            setCurrency={setCurrency}
            isBudgetTypeLocked={isBudgetTypeLocked}
            isBudgetAmountLocked={isBudgetAmountLocked}
            toggleBudgetTypeLock={toggleBudgetTypeLock}
            toggleBudgetAmountLock={toggleBudgetAmountLock}
            onBudgetTypeFocus={handleBudgetTypeFocus}
            onBudgetTypeBlur={handleBudgetTypeBlur}
            onBudgetAmountFocus={handleBudgetAmountFocus}
            onBudgetAmountBlur={handleBudgetAmountBlur}
            isCreating={isCreating}
          />

          <LinkedInCampaignLocaleSection
            country={country}
            setCountry={setCountry}
            language={language}
            setLanguage={setLanguage}
            currency={currency}        // Add this
            setCurrency={setCurrency}  // Add this
          />

          <LinkedInCampaignScheduleSection
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            isStartDateLocked={isStartDateLocked}
            isEndDateLocked={isEndDateLocked}
            toggleStartDateLock={toggleStartDateLock}
            toggleEndDateLock={toggleEndDateLock}
            onStartDateFocus={handleStartDateFocus}
            onStartDateBlur={handleStartDateBlur}
            onEndDateFocus={handleEndDateFocus}
            onEndDateBlur={handleEndDateBlur}
            isCreating={isCreating}
          />

          <LinkedInCampaignFormActions
            isCreating={isCreating}
            onCancel={handleCancel}
          />
        </form>
      </CardContent>

      {/* Blur Confirmation Dialog */}
      <LinkedInCampaignBlurConfirmationDialog
        isOpen={confirmationState.isOpen}
        fieldType={confirmationState.fieldType}
        originalValue={confirmationState.originalValue}
        newValue={confirmationState.newValue}
        hasOriginalData={confirmationState.hasOriginalData}
        onConfirm={confirmChange}
        onCancel={cancelChange}
      />
    </Card>
  )
}