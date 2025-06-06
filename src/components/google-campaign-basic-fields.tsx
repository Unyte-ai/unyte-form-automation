'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface GoogleCampaignBasicFieldsProps {
  campaignName: string
  campaignType: 'SEARCH' | 'DISPLAY'
  accountName: string
  managerCustomerId?: string
  onCampaignNameChange: (value: string) => void
  onCampaignTypeChange: (value: 'SEARCH' | 'DISPLAY') => void
  disabled?: boolean
}

export function GoogleCampaignBasicFields({
  campaignName,
  campaignType,
  accountName,
  managerCustomerId,
  onCampaignNameChange,
  onCampaignTypeChange,
  disabled = false
}: GoogleCampaignBasicFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Account Information Display */}
      <div className="p-3 bg-muted/30 rounded-md">
        <p className="text-sm text-muted-foreground">
          Creating campaign for: <strong>{accountName}</strong>
          {managerCustomerId && (
            <span className="block text-xs mt-1 opacity-75">
              via Manager Account ID: {managerCustomerId}
            </span>
          )}
        </p>
      </div>

      {/* Campaign Name */}
      <div className="grid gap-2">
        <Label htmlFor="campaign-name">Campaign Name</Label>
        <Input
          id="campaign-name"
          value={campaignName}
          onChange={(e) => onCampaignNameChange(e.target.value)}
          placeholder="Enter campaign name"
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Choose a descriptive name for your campaign
        </p>
      </div>

      {/* Campaign Type */}
      <div className="grid gap-2">
        <Label htmlFor="campaign-type">Campaign Type</Label>
        <Select 
          value={campaignType} 
          onValueChange={onCampaignTypeChange}
          disabled={disabled}
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
    </div>
  )
}