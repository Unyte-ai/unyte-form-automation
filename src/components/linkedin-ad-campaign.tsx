'use client'

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface AdCampaign {
  id: string
  name: string
  status?: string
  type?: string
  costType?: string
  dailyBudget?: {
    amount: string
    currencyCode: string
  }
  totalBudget?: {
    amount: string
    currencyCode: string
  }
}

interface LinkedInAdCampaignProps {
  campaigns?: AdCampaign[]
  onChange?: (value: string) => void
  isLoading?: boolean
}

export function LinkedInAdCampaign({ campaigns = [], onChange, isLoading = false }: LinkedInAdCampaignProps) {
  const [value, setValue] = React.useState('')

  const handleValueChange = (newValue: string) => {
    setValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  // Helper function to format campaign display text
  const formatCampaignLabel = (campaign: AdCampaign) => {
    const parts = [campaign.name]
    
    if (campaign.status) {
      parts.push(`[${campaign.status}]`)
    }
    
    if (campaign.dailyBudget) {
      parts.push(`$${campaign.dailyBudget.amount}/${campaign.dailyBudget.currencyCode} daily`)
    }
    
    return parts.join(' ')
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor="ad-campaign">Campaign</Label>
      <Select 
        value={value} 
        onValueChange={handleValueChange}
        disabled={isLoading || campaigns.length === 0}
      >
        <SelectTrigger id="ad-campaign" className="w-full">
          <SelectValue placeholder={
            isLoading 
              ? "Loading campaigns..." 
              : campaigns.length === 0 
                ? "No campaigns available"
                : "Select a campaign"
          } />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Loading campaigns...
            </div>
          ) : campaigns.length > 0 ? (
            campaigns.map(campaign => (
              <SelectItem key={campaign.id} value={campaign.id}>
                <div className="flex flex-col">
                  <span>{formatCampaignLabel(campaign)}</span>
                  <span className="text-xs text-muted-foreground">
                    ID: {campaign.id} {campaign.type && `• Type: ${campaign.type}`}
                  </span>
                </div>
              </SelectItem>
            ))
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No campaigns available for this campaign group
            </div>
          )}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Select an existing LinkedIn campaign or create a new one
      </p>
    </div>
  )
}