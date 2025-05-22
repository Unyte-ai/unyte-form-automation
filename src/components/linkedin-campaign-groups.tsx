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

interface CampaignGroup {
  id: string
  name: string
}

interface LinkedInCampaignGroupsProps {
  campaignGroups?: CampaignGroup[]
  onChange?: (value: string) => void
  isLoading?: boolean
}

export function LinkedInCampaignGroups({ campaignGroups = [], onChange, isLoading = false }: LinkedInCampaignGroupsProps) {
  const [value, setValue] = React.useState('')

  const handleValueChange = (newValue: string) => {
    setValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor="campaign-group">Campaign Group</Label>
      <Select 
        value={value} 
        onValueChange={handleValueChange}
        disabled={isLoading || campaignGroups.length === 0}
      >
        <SelectTrigger id="campaign-group" className="w-full">
          <SelectValue placeholder={
            isLoading 
              ? "Loading campaign groups..." 
              : campaignGroups.length === 0 
                ? "No campaign groups available"
                : "Select a campaign group"
          } />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Loading campaign groups...
            </div>
          ) : campaignGroups.length > 0 ? (
            campaignGroups.map(group => (
              <SelectItem key={group.id} value={group.id}>
                {group.name} <span className="text-xs text-muted-foreground ml-1">({group.id})</span>
              </SelectItem>
            ))
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No campaign groups available
            </div>
          )}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Select the LinkedIn campaign group you want to use for this campaign
      </p>
    </div>
  )
}