'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Loader2, Pencil, Lock } from 'lucide-react'
import { createLinkedInCampaign, CreateLinkedInCampaignData } from '@/app/actions/linkedin-create-ad-campaign'
import { toast } from 'sonner'
import { 
  extractLinkedInBudgetFromForm,
  getLinkedInBudgetAllocationSummary,
  getLinkedInBudgetSuggestions
} from '@/lib/linkedin-budget-utils'
import {
  findAnswerByQuestion,
  parseDateFromForm,
  mapObjectiveToCampaignType,
  mapGeographyToCountry,
  mapLanguageCode
} from '@/lib/linkedin-campaign-utils'

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
  const [isCreating, setIsCreating] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [campaignType, setCampaignType] = useState<'SPONSORED_UPDATES' | 'TEXT_AD' | 'SPONSORED_INMAILS' | 'DYNAMIC'>('SPONSORED_UPDATES')
  const [budgetType, setBudgetType] = useState<'daily' | 'total'>('total')
  const [budgetAmount, setBudgetAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [country, setCountry] = useState('US')
  const [language, setLanguage] = useState('en')

  // Budget lock state
  const [isBudgetLocked, setIsBudgetLocked] = useState(false) // Budget starts unlocked

  // Date lock state
  const [isDateLocked, setIsDateLocked] = useState(false) // Dates start unlocked
  
  // Date state
  const [startDate, setStartDate] = useState(() => {
    // Default to tomorrow to avoid timezone issues
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState('')

  // Toggle budget lock function
  const toggleBudgetLock = () => {
    setIsBudgetLocked(!isBudgetLocked)
  }

  // Toggle date lock function
  const toggleDateLock = () => {
    setIsDateLocked(!isDateLocked)
  }

  // Auto-populate handler
  const handleAutoPopulate = () => {
    if (!formData?.formData) {
      toast.error('No form data available for auto-population')
      return
    }

    try {
      // Use the budget utilities to get comprehensive budget info
      const budgetInfo = extractLinkedInBudgetFromForm(formData)
      
      // Log the budget allocation summary for debugging
      console.log('💰 LinkedIn Campaign Budget Analysis:', getLinkedInBudgetAllocationSummary(formData))

      // Campaign Name
      const campaignNameFromForm = findAnswerByQuestion(formData, [
        'campaign name', 
        'name of campaign',
        'campaign title',
        'ad name',
        'advertisement name'
      ])
      if (campaignNameFromForm) {
        setName(campaignNameFromForm)
      }

      // Campaign Type based on objective
      const objectiveFromForm = findAnswerByQuestion(formData, [
        'objective',
        'goal',
        'key result',
        'kpi',
        'target',
        'purpose'
      ])
      if (objectiveFromForm) {
        const mappedCampaignType = mapObjectiveToCampaignType(objectiveFromForm)
        setCampaignType(mappedCampaignType)
      }

      // Budget Type - Use the budget utilities detection
      if (budgetInfo.totalBudget > 0) {
        setBudgetType(budgetInfo.budgetType)
        console.log('📊 Auto-populated budget type:', budgetInfo.budgetType)
      }

      // Budget Amount - Use the allocated budget from utilities
      if (budgetInfo.allocatedBudget > 0) {
        setBudgetAmount(budgetInfo.allocatedBudget.toString())
        console.log('💰 Auto-populated budget amount:', budgetInfo.allocatedBudget)
      }

      // Currency - Use the budget utilities detection
      if (budgetInfo.currency) {
        setCurrency(budgetInfo.currency)
        console.log('💱 Auto-populated currency:', budgetInfo.currency)
      }

      // Country
      const geographyFromForm = findAnswerByQuestion(formData, [
        'geography',
        'target geography',
        'target geographies',
        'location',
        'country',
        'region'
      ])
      if (geographyFromForm) {
        const mappedCountry = mapGeographyToCountry(geographyFromForm)
        setCountry(mappedCountry)
      }

      // Language
      const languageFromForm = findAnswerByQuestion(formData, [
        'language',
        'languages',
        'target language',
        'audience language'
      ])
      if (languageFromForm) {
        const mappedLanguage = mapLanguageCode(languageFromForm)
        setLanguage(mappedLanguage)
      }

      // Start Date
      const startDateFromForm = findAnswerByQuestion(formData, [
        'start date',
        'campaign start',
        'begin date',
        'launch date',
        'go live date'
      ])
      if (startDateFromForm) {
        const parsedStartDate = parseDateFromForm(startDateFromForm)
        if (parsedStartDate) {
          setStartDate(parsedStartDate)
        }
      }

      // End Date
      const endDateFromForm = findAnswerByQuestion(formData, [
        'end date',
        'campaign end',
        'finish date',
        'completion date',
        'close date'
      ])
      if (endDateFromForm) {
        const parsedEndDate = parseDateFromForm(endDateFromForm)
        if (parsedEndDate) {
          setEndDate(parsedEndDate)
        }
      }

      // Budget validation and feedback
      if (budgetInfo.totalBudget > 0) {
        if (!budgetInfo.isLinkedInPlatform) {
          toast.warning('LinkedIn not mentioned in form platforms', {
            description: 'Consider if LinkedIn is the right platform for this campaign'
          })
        } else if (!budgetInfo.validation.isValid) {
          // Get budget suggestions for better recommendations
          const suggestions = getLinkedInBudgetSuggestions(campaignType, budgetInfo.budgetType, budgetInfo.currency)
          
          toast.error('Budget below LinkedIn minimums', {
            description: `Current: ${budgetInfo.currency} ${budgetInfo.allocatedBudget.toFixed(2)}. Minimum: ${budgetInfo.currency} ${budgetInfo.validation.minimumRequired}. Suggested: ${budgetInfo.currency} ${suggestions.suggested}`
          })
        } else {
          toast.success('Budget allocation validated!', {
            description: `${budgetInfo.currency} ${budgetInfo.allocatedBudget.toFixed(2)} allocated for LinkedIn (${budgetInfo.budgetType})`
          })
        }

        // Show platform allocation breakdown if multiple platforms
        if (budgetInfo.platformGroups > 1) {
          toast.info('Multi-platform budget detected', {
            description: `Total budget split across ${budgetInfo.platformGroups} platform groups`
          })
        }
      }

      // Show success message with what was populated
      const populatedFields = []
      if (campaignNameFromForm) populatedFields.push('Campaign Name')
      if (objectiveFromForm) populatedFields.push('Campaign Type')
      if (budgetInfo.totalBudget > 0) {
        populatedFields.push('Budget Type', 'Budget Amount')
      }
      if (budgetInfo.currency) populatedFields.push('Currency')
      if (geographyFromForm) populatedFields.push('Country')
      if (languageFromForm) populatedFields.push('Language')
      if (startDateFromForm && parseDateFromForm(startDateFromForm)) populatedFields.push('Start Date')
      if (endDateFromForm && parseDateFromForm(endDateFromForm)) populatedFields.push('End Date')

      // Lock budget fields after auto-populate if budget data was populated
      if (budgetInfo.budgetType || budgetInfo.allocatedBudget > 0 || budgetInfo.totalBudget > 0) {
        setIsBudgetLocked(true)
      }

      // Lock date fields after auto-populate if dates were found
      if ((startDateFromForm && parseDateFromForm(startDateFromForm)) || 
      (endDateFromForm && parseDateFromForm(endDateFromForm))) {
      setIsDateLocked(true)
      }

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

  // Handle expanding form and auto-populate
  const handleExpandAndAutoPopulate = () => {
    setIsExpanded(true)
    
    // Run auto-populate if form data is available
    if (formData?.formData) {
      handleAutoPopulate()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !budgetAmount.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    if (parseFloat(budgetAmount) <= 0) {
      toast.error('Budget amount must be greater than 0')
      return
    }

    if (!startDate) {
      toast.error('Please select a start date')
      return
    }

    if (endDate && new Date(endDate) <= new Date(startDate)) {
      toast.error('End date must be after start date')
      return
    }

    try {
      setIsCreating(true)

      // Prepare campaign data
      const campaignData: CreateLinkedInCampaignData = {
        account: selectedAccount,
        campaignGroup: selectedCampaignGroup,
        costType: 'CPM', // Use CPM as default - works for all campaign types
        name: name.trim(),
        type: campaignType,
        locale: {
          country,
          language
        },
        budgetType: budgetType,
        budgetAmount: budgetAmount,
        currencyCode: currency,
        startDate: startDate,
        endDate: endDate || undefined,
        // Basic targeting criteria - can be expanded later
        targetingCriteria: {
          include: {
            and: [
              {
                or: {
                  'urn:li:adTargetingFacet:locations': [
                    `urn:li:geo:103644278` // Default to United States
                  ]
                }
              },
              {
                or: {
                  'urn:li:adTargetingFacet:interfaceLocales': [
                    `urn:li:locale:${language}_${country}`
                  ]
                }
              }
            ]
          }
        }
      }

      // Call server action
      const result = await createLinkedInCampaign(organizationId, campaignData)

      if (!result.success) {
        throw new Error(result.error || 'Failed to create campaign')
      }

      // Success
      toast.success('Campaign created successfully', {
        description: `Draft campaign "${name}" has been created and can be edited in LinkedIn Campaign Manager.`
      })

      // Reset form
      setName('')
      setBudgetAmount('')
      setIsBudgetLocked(false) // Reset budget lock state
      setIsDateLocked(false) // Reset date lock state
      // Reset dates
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setStartDate(tomorrow.toISOString().split('T')[0])
      setEndDate('')
      setIsExpanded(false)

      // Notify parent component
      if (onCampaignCreated && result.data) {
        onCampaignCreated(result.data)
      }

    } catch (error) {
      console.error('Error creating LinkedIn campaign:', error)
      toast.error('Failed to create campaign', {
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
          {/* Campaign Name */}
          <div className="grid gap-2">
            <Label htmlFor="campaign-name">Campaign Name *</Label>
            <Input
              id="campaign-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter campaign name"
              required
            />
          </div>

          {/* Campaign Type */}
          <div className="grid gap-2">
            <Label htmlFor="campaign-type">Campaign Type *</Label>
            <Select value={campaignType} onValueChange={(value) => setCampaignType(value as 'SPONSORED_UPDATES' | 'TEXT_AD' | 'SPONSORED_INMAILS' | 'DYNAMIC')}>
              <SelectTrigger id="campaign-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SPONSORED_UPDATES">Sponsored Content</SelectItem>
                <SelectItem value="TEXT_AD">Text Ads</SelectItem>
                <SelectItem value="SPONSORED_INMAILS">Sponsored Messaging</SelectItem>
                <SelectItem value="DYNAMIC">Dynamic Ads</SelectItem>
              </SelectContent>
            </Select>
            {campaignType === 'SPONSORED_INMAILS' && (
              <p className="text-xs text-muted-foreground">
                Note: For Sponsored Messaging, Cost Per Send (CPS) is measured as CPM × 1000
              </p>
            )}
          </div>

          {/* Budget Type Selection */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="budget-type">Budget Type *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleBudgetLock}
                disabled={isCreating}
                className="h-6 w-6 p-0"
              >
                {isBudgetLocked ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  <Pencil className="h-3 w-3" />
                )}
              </Button>
            </div>
            <Select 
              value={budgetType} 
              onValueChange={(value) => setBudgetType(value as 'daily' | 'total')}
              disabled={isCreating || isBudgetLocked}
            >
              <SelectTrigger 
                id="budget-type"
                className={isBudgetLocked ? 'opacity-50 cursor-not-allowed' : ''}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Budget</SelectItem>
                <SelectItem value="total">Total Budget (Lifetime)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {budgetType === 'daily' 
                ? "Amount to spend per day (resets at midnight UTC). LinkedIn may spend up to 150% on high-opportunity days."
                : "Total amount to spend over the campaign lifetime"
              }
            </p>
          </div>

          {/* Budget Amount and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="budget-amount">
                  {budgetType === 'daily' ? 'Daily Budget *' : 'Total Budget *'}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleBudgetLock}
                  disabled={isCreating}
                  className="h-6 w-6 p-0"
                >
                  {isBudgetLocked ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    <Pencil className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <Input
                id="budget-amount"
                type="number"
                step="0.01"
                min="0"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="0.00"
                disabled={isCreating || isBudgetLocked}
                className={isBudgetLocked ? 'opacity-50 cursor-not-allowed' : ''}
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="currency">Currency</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleBudgetLock}
                  disabled={isCreating}
                  className="h-6 w-6 p-0"
                >
                  {isBudgetLocked ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    <Pencil className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <Select 
                value={currency} 
                onValueChange={setCurrency}
                disabled={isCreating || isBudgetLocked}
              >
                <SelectTrigger 
                  id="currency"
                  className={isBudgetLocked ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Budget Warning when unlocked */}
          {!isBudgetLocked && (
            <div className="p-4 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
              <p className="text-amber-800 dark:text-amber-300 text-sm font-medium mb-2">
                ⚠️ Budget fields are unlocked for manual editing
              </p>
              <div className="text-amber-800 dark:text-amber-300 text-xs">
                <p>Budget values can be manually adjusted. Click the lock icon to secure these fields and prevent accidental changes.</p>
              </div>
            </div>
          )}

          {/* Locale */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger id="country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Campaign Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="start-date">Start Date *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleDateLock}
                  disabled={isCreating}
                  className="h-6 w-6 p-0"
                >
                  {isDateLocked ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    <Pencil className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} // Can't start in the past
                disabled={isCreating || isDateLocked}
                className={isDateLocked ? 'opacity-50 cursor-not-allowed' : ''}
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="end-date">End Date</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleDateLock}
                  disabled={isCreating}
                  className="h-6 w-6 p-0"
                >
                  {isDateLocked ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    <Pencil className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate} // End date must be after start date
                disabled={isCreating || isDateLocked}
                className={isDateLocked ? 'opacity-50 cursor-not-allowed' : ''}
              />
            </div>
          </div>

          {/* Date Warning when unlocked */}
          {!isDateLocked && (
            <div className="p-4 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
              <p className="text-amber-800 dark:text-amber-300 text-sm font-medium mb-2">
                ⚠️ Date fields are unlocked for manual editing
              </p>
              <div className="text-amber-800 dark:text-amber-300 text-xs">
                <p>Campaign start and end dates can be manually adjusted. Click the lock icon to secure these fields and prevent accidental changes.</p>
              </div>
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
                'Create Draft Campaign'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}