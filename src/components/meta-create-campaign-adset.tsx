'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { MetaCampaignFields } from '@/components/meta-campaign-fields'
import { MetaAdSetFields } from '@/components/meta-adset-fields'
import { useMetaCampaignForm } from '@/hooks/use-meta-campaign-form'
import { createFacebookCampaignAndAdSet } from '@/app/actions/facebook-batch-campaign-adset'
import { 
  FacebookCampaignData,
  FacebookAdSetData,
  FacebookBatchCampaignAdSetData,
  getBillingEventForUIObjective,
  getOptimizationGoalForUIObjective,
  getBudgetLabel
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
    isBudgetLocked,
    isDateLocked,
    hasAutoPopulated,
    setHasAutoPopulated,
    toggleBudgetLock,
    toggleDateLock,
    handleAutoPopulate,
    validateFormData,
    resetForm
  } = useMetaCampaignForm(formData)

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

  if (!isExpanded) {
    return (
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
    )
  }

  return (
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
              isBudgetLocked={isBudgetLocked}
              onToggleBudgetLock={toggleBudgetLock}
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
              isDateLocked={isDateLocked}
              onToggleDateLock={toggleDateLock}
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
  )
}