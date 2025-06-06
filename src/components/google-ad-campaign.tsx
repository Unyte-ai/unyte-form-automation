'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { createGoogleCampaign, CreateGoogleCampaignData } from '@/app/actions/google-create-campaign'
import { useGoogleCampaignForm } from '@/hooks/use-google-campaign-form'
import { GoogleCampaignBasicFields } from './google-campaign-basic-fields'
import { GoogleCampaignBudgetSection } from './google-campaign-budget-section'
import { GoogleCampaignDateSection } from './google-campaign-date-section'
import { GoogleCampaignSuccessDisplay } from './google-campaign-success-display'
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
    isBudgetLocked,
    isDateLocked,
    createdCampaign,
    
    // Setters
    setCampaignName,
    setCampaignType,
    setBudgetType,
    setBudgetAmount,
    setStartDate,
    setEndDate,
    setIsCreating,
    setCreatedCampaign,
    setIsBudgetLocked,
    setIsDateLocked,
    
    // Utilities
    getTomorrowDate,
    handleAutoPopulate,
    resetForm,
    initializeDefaultDates
  } = useGoogleCampaignForm(formData)

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

  const toggleBudgetLock = () => {
    setIsBudgetLocked(!isBudgetLocked)
  }

  const toggleDateLock = () => {
    setIsDateLocked(!isDateLocked)
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
              isBudgetLocked={isBudgetLocked}
              onBudgetTypeChange={setBudgetType}
              onBudgetAmountChange={setBudgetAmount}
              onToggleBudgetLock={toggleBudgetLock}
              disabled={isCreating}
            />

            <GoogleCampaignDateSection
              startDate={startDate}
              endDate={endDate}
              isDateLocked={isDateLocked}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onToggleDateLock={toggleDateLock}
              getTomorrowDate={getTomorrowDate}
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
    </div>
  )
}