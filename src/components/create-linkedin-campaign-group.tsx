'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Loader2 } from 'lucide-react'
import { createLinkedInCampaignGroup, CreateLinkedInCampaignGroupData } from '@/app/actions/create-linkedin-campaign-group'
import { toast } from 'sonner'

interface LinkedInCreateCampaignGroupProps {
  organizationId: string
  selectedAccount: string // Ad Account URN or ID
  onCampaignGroupCreated?: (campaignGroup: { id: string; name: string }) => void
}

export function LinkedInCreateCampaignGroup({ 
  organizationId, 
  selectedAccount,
  onCampaignGroupCreated 
}: LinkedInCreateCampaignGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [objectiveType, setObjectiveType] = useState<'BRAND_AWARENESS' | 'ENGAGEMENT' | 'JOB_APPLICANT' | 'LEAD_GENERATION' | 'WEBSITE_CONVERSION' | 'WEBSITE_VISIT' | 'VIDEO_VIEW'>('LEAD_GENERATION')
  
  // Date state
  const [startDate, setStartDate] = useState(() => {
    // Default to tomorrow to avoid timezone issues
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    // Default to 30 days from start date
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 31)
    return futureDate.toISOString().split('T')[0]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Please enter a campaign group name')
      return
    }

    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates')
      return
    }

    if (new Date(endDate) <= new Date(startDate)) {
      toast.error('End date must be after start date')
      return
    }

    try {
      setIsCreating(true)

      // Prepare campaign group data
      const campaignGroupData: CreateLinkedInCampaignGroupData = {
        account: selectedAccount,
        name: name.trim(),
        startDate: startDate,
        endDate: endDate,
        objectiveType: objectiveType
      }

      // Call server action
      const result = await createLinkedInCampaignGroup(organizationId, campaignGroupData)

      if (!result.success) {
        throw new Error(result.error || 'Failed to create campaign group')
      }

      // Success
      toast.success('Campaign group created successfully', {
        description: `Draft campaign group "${name}" has been created and can be used for campaigns.`
      })

      // Reset form
      setName('')
      // Reset dates
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setStartDate(tomorrow.toISOString().split('T')[0])
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 31)
      setEndDate(futureDate.toISOString().split('T')[0])
      setIsExpanded(false)

      // Notify parent component
      if (onCampaignGroupCreated && result.data) {
        onCampaignGroupCreated(result.data)
      }

    } catch (error) {
      console.error('Error creating LinkedIn campaign group:', error)
      toast.error('Failed to create campaign group', {
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
          disabled={!selectedAccount}
        >
          <Plus className="mr-2 size-4" />
          Create New Campaign Group
        </Button>
        {!selectedAccount && (
          <p className="text-xs text-muted-foreground mt-2">
            Select an ad account first to create a campaign group
          </p>
        )}
      </div>
    )
  }

  return (
    <Card className="border-t-0 rounded-t-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Create New Campaign Group</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campaign Group Name */}
          <div className="grid gap-2">
            <Label htmlFor="campaign-group-name">Campaign Group Name *</Label>
            <Input
              id="campaign-group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter campaign group name"
              maxLength={100}
              required
            />
            <p className="text-xs text-muted-foreground">
              Maximum 100 characters
            </p>
          </div>

          {/* Objective Type */}
          <div className="grid gap-2">
            <Label htmlFor="objective-type">Campaign Objective *</Label>
            <Select value={objectiveType} onValueChange={(value) => setObjectiveType(value as typeof objectiveType)}>
              <SelectTrigger id="objective-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRAND_AWARENESS">Brand Awareness</SelectItem>
                <SelectItem value="ENGAGEMENT">Engagement</SelectItem>
                <SelectItem value="JOB_APPLICANT">Job Applicants</SelectItem>
                <SelectItem value="LEAD_GENERATION">Lead Generation</SelectItem>
                <SelectItem value="WEBSITE_CONVERSION">Website Conversions</SelectItem>
                <SelectItem value="WEBSITE_VISIT">Website Visits</SelectItem>
                <SelectItem value="VIDEO_VIEW">Video Views</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This cannot be changed after creation. All campaigns in this group will inherit this objective.
            </p>
          </div>

          {/* Campaign Group Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start-date">Start Date *</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} // Can't start in the past
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-date">End Date *</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate} // End date must be after start date
                required
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Campaign group will be active between these dates. Individual campaigns can have shorter durations within this range.
          </p>

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
                'Create Draft Campaign Group'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}