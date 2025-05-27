'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { MetaCampaignFields } from '@/components/meta-campaign-fields'
import { MetaAdSetFields } from '@/components/meta-adset-fields'
import { createFacebookCampaignAndAdSet } from '@/app/actions/facebook-batch-campaign-adset'
import { 
  FacebookCampaignData,
  FacebookAdSetData,
  FacebookBatchCampaignAdSetData,
  DEFAULT_CAMPAIGN_VALUES,
  DEFAULT_ADSET_VALUES,
  validateCampaignData,
  validateAdSetData,
  getBillingEventForUIObjective
} from '@/lib/facebook-campaign-utils'

interface MetaCreateCampaignAdSetProps {
  organizationId: string
  selectedAdAccount: string // Facebook Ad Account ID (with act_ prefix)
  onCampaignCreated?: (campaign: { campaignId: string; campaignName: string; adSetId: string; adSetName: string }) => void
}

export function MetaCreateCampaignAdSet({ 
  organizationId, 
  selectedAdAccount, 
  onCampaignCreated 
}: MetaCreateCampaignAdSetProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // Campaign form state
  const [campaignData, setCampaignData] = useState<Partial<FacebookCampaignData>>({
    name: '',
    objective: undefined,
    status: DEFAULT_CAMPAIGN_VALUES.status,
    special_ad_categories: DEFAULT_CAMPAIGN_VALUES.special_ad_categories,
    buying_type: DEFAULT_CAMPAIGN_VALUES.buying_type,
    bid_strategy: DEFAULT_CAMPAIGN_VALUES.bid_strategy,
    lifetime_budget: 0
  })

  // Ad Set form state
  const [adSetData, setAdSetData] = useState<Partial<Omit<FacebookAdSetData, 'campaign_id'>>>({
    name: '',
    lifetime_budget: 0,
    targeting: DEFAULT_ADSET_VALUES.targeting,
    status: DEFAULT_ADSET_VALUES.status,
    start_time: getDefaultStartDate(),
    end_time: getDefaultEndDate()
  })

  // Form validation errors
  const [campaignErrors, setCampaignErrors] = useState<Record<string, string>>({})
  const [adSetErrors, setAdSetErrors] = useState<Record<string, string>>({})

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

  // Validate form data and convert validation errors to error objects
  const validateFormData = (): boolean => {
    // Validate campaign data
    const campaignValidationErrors = validateCampaignData(campaignData)
    const campaignErrorObj: Record<string, string> = {}
    campaignValidationErrors.forEach(error => {
      if (error.includes('name')) campaignErrorObj.name = error
      if (error.includes('objective')) campaignErrorObj.objective = error
      if (error.includes('budget')) campaignErrorObj.lifetime_budget = error
    })
    setCampaignErrors(campaignErrorObj)

    // Validate ad set data (with temporary campaign_id for validation)
    const tempAdSetData: FacebookAdSetData = {
      ...(adSetData as Omit<FacebookAdSetData, 'campaign_id' | 'billing_event'>),
      campaign_id: 'temp',
      billing_event: campaignData.objective ? getBillingEventForUIObjective(campaignData.objective) : 'IMPRESSIONS'
    }
    
    const adSetValidationErrors = validateAdSetData(tempAdSetData)
    const adSetErrorObj: Record<string, string> = {}
    adSetValidationErrors.forEach(error => {
      if (error.includes('Ad Set name')) adSetErrorObj.name = error
      if (error.includes('Ad Set lifetime budget')) adSetErrorObj.lifetime_budget = error
      if (error.includes('country')) adSetErrorObj.countries = error
      if (error.includes('publisher platform')) adSetErrorObj.publisher_platforms = error
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

      // Prepare batch data
      const batchData: FacebookBatchCampaignAdSetData = {
        campaign: campaignData as FacebookCampaignData,
        adset: adSetData as Omit<FacebookAdSetData, 'campaign_id'>
      }

      // Call batch server action
      const result = await createFacebookCampaignAndAdSet(organizationId, selectedAdAccount, batchData)

      if (!result.success) {
        throw new Error(result.error || 'Failed to create campaign and ad set')
      }

      // Success
      toast.success('Campaign and Ad Set created successfully', {
        description: `Campaign "${result.data!.campaignName}" and Ad Set "${result.data!.adSetName}" have been created.`
      })

      // Reset form
      setCampaignData({
        name: '',
        objective: undefined,
        status: DEFAULT_CAMPAIGN_VALUES.status,
        special_ad_categories: DEFAULT_CAMPAIGN_VALUES.special_ad_categories,
        buying_type: DEFAULT_CAMPAIGN_VALUES.buying_type,
        bid_strategy: DEFAULT_CAMPAIGN_VALUES.bid_strategy,
        lifetime_budget: 0
      })

      setAdSetData({
        name: '',
        lifetime_budget: 0,
        targeting: DEFAULT_ADSET_VALUES.targeting,
        status: DEFAULT_ADSET_VALUES.status,
        start_time: getDefaultStartDate(),
        end_time: getDefaultEndDate()
      })

      // Clear errors
      setCampaignErrors({})
      setAdSetErrors({})

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

  if (!isExpanded) {
    return (
      <div className="border-t pt-4">
        <Button 
          variant="ghost" 
          onClick={() => setIsExpanded(true)}
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
    )
  }

  return (
    <Card className="border-t-0 rounded-t-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Create New Campaign & Ad Set</CardTitle>
        <p className="text-sm text-muted-foreground">
          This will create both a campaign and ad set together using Facebook&apos;s batch API
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
            />
          </div>

          {/* Ad Set Fields Section */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="font-medium text-sm">Ad Set Settings</h3>
              <p className="text-xs text-muted-foreground">Configure targeting, budget, and schedule</p>
            </div>
            <MetaAdSetFields
              value={adSetData}
              onChange={setAdSetData}
              errors={adSetErrors}
            />
          </div>

          {/* Billing Event Info */}
          {campaignData.objective && (
            <div className="p-3 rounded-md bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
              <p className="text-blue-800 dark:text-blue-300 text-sm">
                <strong>Billing Event:</strong> {getBillingEventForUIObjective(campaignData.objective)} 
                <br />
                <span className="text-xs">
                  This billing event is automatically set based on your selected campaign objective.
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
  )
}