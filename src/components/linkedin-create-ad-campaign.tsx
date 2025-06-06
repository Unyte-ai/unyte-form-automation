'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { useLinkedInCampaignForm } from '@/hooks/useLinkedInCampaignForm'
import { useLinkedInAutoPopulate } from '@/hooks/useLinkedInAutoPopulate'
import { useLinkedInCampaignSubmission } from '@/hooks/useLinkedInCampaignSubmission'
import { LinkedInCampaignBasicInfo } from '@/components/linkedin-campaign-basic-info'
import { LinkedInCampaignBudgetSection } from '@/components/linkedin-campaign-budget-section'
import { LinkedInCampaignScheduleSection } from '@/components/linkedin-campaign-schedule-section'
import { LinkedInCampaignLocaleSection } from '@/components/linkedin-campaign-locale-section'
import { LinkedInCampaignFormActions } from '@/components/linkedin-campaign-form-actions'

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
    
    // Lock states
    isBudgetLocked,
    setIsBudgetLocked,
    isDateLocked,
    setIsDateLocked,
    
    // Functions
    toggleBudgetLock,
    toggleDateLock,
    resetForm
  } = useLinkedInCampaignForm()

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
    setIsBudgetLocked,
    setIsDateLocked,
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
            isBudgetLocked={isBudgetLocked}
            toggleBudgetLock={toggleBudgetLock}
            isCreating={isCreating}
          />

          <LinkedInCampaignLocaleSection
            country={country}
            setCountry={setCountry}
            language={language}
            setLanguage={setLanguage}
          />

          <LinkedInCampaignScheduleSection
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            isDateLocked={isDateLocked}
            toggleDateLock={toggleDateLock}
            isCreating={isCreating}
          />

          <LinkedInCampaignFormActions
            isCreating={isCreating}
            onCancel={handleCancel}
          />
        </form>
      </CardContent>
    </Card>
  )
}