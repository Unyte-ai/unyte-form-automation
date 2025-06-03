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
import { GoogleAutoPopulateButton } from '@/components/google-autopopulate'
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
  const [campaignName, setCampaignName] = useState('')
  const [campaignType, setCampaignType] = useState<'SEARCH' | 'DISPLAY'>('SEARCH')
  const [budgetType, setBudgetType] = useState<'daily' | 'total'>('total')
  const [budgetAmount, setBudgetAmount] = useState('100.00')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createdCampaign, setCreatedCampaign] = useState<{
    campaignId: string
    campaignName: string
  } | null>(null)

  // Get tomorrow's date as default start date
  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  // Get date one month from tomorrow as default end date
  const getDefaultEndDate = () => {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 31) // Tomorrow + 30 days
    return endDate.toISOString().split('T')[0]
  }

  // Set default dates on first render
  useState(() => {
    if (!startDate) setStartDate(getTomorrowDate())
    if (!endDate) setEndDate(getDefaultEndDate())
  })

  // Auto-populate logic
  const findAnswerByQuestion = (searchTerms: string[]): string => {
    if (!formData?.formData) return ''
    
    const found = formData.formData.find(item => 
      searchTerms.some(term => 
        item.question.toLowerCase().includes(term.toLowerCase())
      )
    )
    return found?.answer || ''
  }

  const parseDateFromForm = (dateString: string): string => {
    if (!dateString) return ''
    
    try {
      // Try to parse various date formats
      const date = new Date(dateString)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0] // Return YYYY-MM-DD format
      }
    } catch (error) {
      console.warn('Could not parse date:', dateString, error)
    }
    
    return ''
  }

  const determineCampaignTypeFromChannels = (channelsString: string): 'SEARCH' | 'DISPLAY' => {
    if (!channelsString) return 'SEARCH'
    
    const lowerChannels = channelsString.toLowerCase()
    
    // Parse JSON array if it looks like one
    if (channelsString.includes('[') && channelsString.includes(']')) {
      try {
        const channelsArray = JSON.parse(channelsString)
        if (Array.isArray(channelsArray)) {
          const joinedChannels = channelsArray.join(' ').toLowerCase()
          // If contains search terms but not display, prefer search
          if (joinedChannels.includes('search') && !joinedChannels.includes('display')) {
            return 'SEARCH'
          }
          // If contains display terms, prefer display
          if (joinedChannels.includes('display')) {
            return 'DISPLAY'
          }
        }
      } catch (e) {
        // If JSON parsing fails, continue with string analysis
        console.warn('Failed to parse channels as JSON:', channelsString, e)
      }
    }
    
    // Fallback to string analysis
    if (lowerChannels.includes('display')) {
      return 'DISPLAY'
    }
    
    return 'SEARCH' // Default to search
  }

  const handleAutoPopulate = () => {
    if (!formData?.formData) {
      toast.error('No form data available for auto-population')
      return
    }

    try {
      // Campaign Name - look for campaign name related questions
      const campaignNameFromForm = findAnswerByQuestion([
        'campaign name', 
        'name of campaign',
        'campaign title'
      ])
      if (campaignNameFromForm) {
        setCampaignName(campaignNameFromForm)
      }

      // Campaign Type - analyze preferred channels
      const preferredChannels = findAnswerByQuestion([
        'preferred channels',
        'channels',
        'networks',
        'preferred networks'
      ])
      if (preferredChannels) {
        const detectedType = determineCampaignTypeFromChannels(preferredChannels)
        setCampaignType(detectedType)
      }

      // Start Date
      const startDateFromForm = findAnswerByQuestion([
        'start date',
        'campaign start',
        'begin date',
        'launch date'
      ])
      if (startDateFromForm) {
        const parsedStartDate = parseDateFromForm(startDateFromForm)
        if (parsedStartDate) {
          setStartDate(parsedStartDate)
        }
      }

      // End Date
      const endDateFromForm = findAnswerByQuestion([
        'end date',
        'campaign end',
        'finish date',
        'completion date'
      ])
      if (endDateFromForm) {
        const parsedEndDate = parseDateFromForm(endDateFromForm)
        if (parsedEndDate) {
          setEndDate(parsedEndDate)
        }
      }

      // Show success message with what was populated
      const populatedFields = []
      if (campaignNameFromForm) populatedFields.push('Campaign Name')
      if (preferredChannels) populatedFields.push('Campaign Type')
      if (startDateFromForm && parseDateFromForm(startDateFromForm)) populatedFields.push('Start Date')
      if (endDateFromForm && parseDateFromForm(endDateFromForm)) populatedFields.push('End Date')

      if (populatedFields.length > 0) {
        toast.success('Auto-populated successfully!', {
          description: `Filled: ${populatedFields.join(', ')}`
        })
      } else {
        toast.info('No matching fields found in form data', {
          description: 'Form data may not contain the expected campaign information'
        })
      }

    } catch (error) {
      console.error('Error during auto-populate:', error)
      toast.error('Auto-populate failed', {
        description: 'An error occurred while processing the form data'
      })
    }
  }

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
        budgetType, // Pass the budget type to backend
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
        
        // Reset form
        setCampaignName('')
        setCampaignType('SEARCH')
        setBudgetType('total')
        setBudgetAmount('100.00')
        setStartDate(getTomorrowDate())
        setEndDate(getDefaultEndDate())
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Create Campaign</h3>
          <GoogleAutoPopulateButton 
            onAutoPopulate={handleAutoPopulate}
            disabled={isCreating}
          />
        </div>
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

            {/* Budget Type Selection */}
            <div className="grid gap-2">
              <Label htmlFor="budget-type">Budget Type</Label>
              <Select 
                value={budgetType} 
                onValueChange={(value: 'daily' | 'total') => setBudgetType(value)}
                disabled={isCreating}
              >
                <SelectTrigger id="budget-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Budget</SelectItem>
                  <SelectItem value="total">Total Budget (Lifetime)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {budgetType === 'daily' 
                  ? "Amount to spend per day. Google may spend up to 200% on high-opportunity days, but won't exceed your monthly limit (daily budget × 30.4)."
                  : "Total amount to spend over the entire campaign duration"
                }
              </p>
            </div>

            {/* Budget Amount */}
            <div className="grid gap-2">
              <Label htmlFor="budget-amount">
                {budgetType === 'daily' ? 'Daily Budget (USD)' : 'Total Budget (USD)'}
              </Label>
              <Input
                id="budget-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="100.00"
                disabled={isCreating}
              />
              <p className="text-xs text-muted-foreground">
                {budgetType === 'daily' 
                  ? "Set the daily budget amount. Minimum $1.00 per day."
                  : "Set the total budget for the entire campaign duration"
                }
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isCreating}
                  min={getTomorrowDate()}
                />
                <p className="text-xs text-muted-foreground">
                  Campaign start date (must be future)
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isCreating}
                  min={startDate || getTomorrowDate()}
                />
                <p className="text-xs text-muted-foreground">
                  Campaign end date
                </p>
              </div>
            </div>

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