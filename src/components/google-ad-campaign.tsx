'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createGoogleCampaign, CreateGoogleCampaignData } from '@/app/actions/google-create-campaign'
import { toast } from 'sonner'

interface GoogleAdCampaignProps {
  customerId: string
  accountName: string
  organizationId: string
  managerCustomerId?: string
}

export function GoogleAdCampaign({ 
  customerId, 
  accountName, 
  organizationId,
  managerCustomerId
}: GoogleAdCampaignProps) {
  const [campaignName, setCampaignName] = useState('')
  const [campaignType, setCampaignType] = useState<'SEARCH' | 'DISPLAY'>('SEARCH')
  const [dailyBudget, setDailyBudget] = useState('1.00')
  const [isCreating, setIsCreating] = useState(false)
  const [createdCampaign, setCreatedCampaign] = useState<{
    campaignId: string
    campaignName: string
  } | null>(null)

  const handleCreateCampaign = async () => {
    if (!campaignName.trim()) {
      toast.error('Campaign name is required')
      return
    }

    const budgetValue = parseFloat(dailyBudget)
    if (isNaN(budgetValue) || budgetValue <= 0) {
      toast.error('Please enter a valid daily budget')
      return
    }

    try {
      setIsCreating(true)

      const campaignData: CreateGoogleCampaignData = {
        campaignName: campaignName.trim(),
        campaignType,
        dailyBudget: budgetValue,
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
        
        // Reset form
        setCampaignName('')
        setCampaignType('SEARCH')
        setDailyBudget('1.00')
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

  return (
    <div className="space-y-4 mt-4">
      <div className="p-4 border rounded-lg bg-muted/30">
        <h3 className="font-medium mb-4">Create Campaign</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Creating campaign for: <strong>{accountName}</strong>
          {managerCustomerId && (
            <span className="block text-xs mt-1 opacity-75">
              via Manager Account ID: {managerCustomerId}
            </span>
          )}
        </p>

        {createdCampaign ? (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-md dark:bg-green-950/30 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-300">
                <strong>Campaign Created!</strong>
              </p>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                Campaign: &quot;{createdCampaign.campaignName}&quot; (ID: {createdCampaign.campaignId})
              </p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-2">
                The campaign is paused and ready for customization in Google Ads Manager.
              </p>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCreatedCampaign(null)}
            >
              Create Another Campaign
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Enter campaign name"
                disabled={isCreating}
              />
              <p className="text-xs text-muted-foreground">
                Choose a descriptive name for your campaign
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="campaign-type">Campaign Type</Label>
              <Select 
                value={campaignType} 
                onValueChange={(value: 'SEARCH' | 'DISPLAY') => setCampaignType(value)}
                disabled={isCreating}
              >
                <SelectTrigger id="campaign-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEARCH">Search</SelectItem>
                  <SelectItem value="DISPLAY">Display</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select the type of campaign you want to create
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="daily-budget">Daily Budget (USD)</Label>
              <Input
                id="daily-budget"
                type="number"
                step="0.01"
                min="0.01"
                value={dailyBudget}
                onChange={(e) => setDailyBudget(e.target.value)}
                placeholder="1.00"
                disabled={isCreating}
              />
              <p className="text-xs text-muted-foreground">
                Set a minimal daily budget (can be increased later in Google Ads Manager)
              </p>
            </div>

            <div className="pt-2">
              <Button 
                onClick={handleCreateCampaign}
                disabled={isCreating || !campaignName.trim()}
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