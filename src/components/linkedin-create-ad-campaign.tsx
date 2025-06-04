'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Loader2 } from 'lucide-react'
import { createLinkedInCampaign, CreateLinkedInCampaignData } from '@/app/actions/linkedin-create-ad-campaign'
import { LinkedInAutoPopulateButton } from '@/components/linkedin-autopopulate'
import { toast } from 'sonner'

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
  
  // Date state
  const [startDate, setStartDate] = useState(() => {
    // Default to tomorrow to avoid timezone issues
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState('')

  // Auto-populate helper function
  const findAnswerByQuestion = (searchTerms: string[]): string => {
    if (!formData?.formData) return ''
    
    const found = formData.formData.find(item => 
      searchTerms.some(term => 
        item.question.toLowerCase().includes(term.toLowerCase())
      )
    )
    return found?.answer || ''
  }

  // Parse date from form data
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

  // Map objective from form data to LinkedIn campaign types
  const mapObjectiveToCampaignType = (objectiveString: string): typeof campaignType => {
    if (!objectiveString) return 'SPONSORED_UPDATES'
    
    const lowerObjective = objectiveString.toLowerCase()
    
    if (lowerObjective.includes('awareness') || lowerObjective.includes('brand')) {
      return 'SPONSORED_UPDATES' // Good for brand awareness
    }
    if (lowerObjective.includes('engagement') || lowerObjective.includes('engage')) {
      return 'SPONSORED_UPDATES' // Good for engagement
    }
    if (lowerObjective.includes('job') || lowerObjective.includes('hiring') || lowerObjective.includes('recruit')) {
      return 'DYNAMIC' // Dynamic ads good for recruitment
    }
    if (lowerObjective.includes('lead') || lowerObjective.includes('generation')) {
      return 'SPONSORED_UPDATES' // Sponsored content good for lead gen
    }
    if (lowerObjective.includes('conversion') || lowerObjective.includes('convert')) {
      return 'SPONSORED_UPDATES' // Good for conversions
    }
    if (lowerObjective.includes('traffic') || lowerObjective.includes('visit') || lowerObjective.includes('website')) {
      return 'SPONSORED_UPDATES' // Good for traffic
    }
    if (lowerObjective.includes('video') || lowerObjective.includes('view')) {
      return 'SPONSORED_UPDATES' // Good for video content
    }
    if (lowerObjective.includes('message') || lowerObjective.includes('inmail') || lowerObjective.includes('direct')) {
      return 'SPONSORED_INMAILS' // For direct messaging
    }
    
    return 'SPONSORED_UPDATES' // Default fallback
  }

  // Map currency from form data
  const mapCurrencyCode = (currencyString: string): string => {
    if (!currencyString) return 'USD'
    
    const lowerCurrency = currencyString.toLowerCase()
    
    if (lowerCurrency.includes('gbp') || lowerCurrency.includes('pound') || lowerCurrency.includes('£')) {
      return 'GBP'
    }
    if (lowerCurrency.includes('eur') || lowerCurrency.includes('euro') || lowerCurrency.includes('€')) {
      return 'EUR'
    }
    if (lowerCurrency.includes('cad') || lowerCurrency.includes('canadian')) {
      return 'CAD'
    }
    if (lowerCurrency.includes('usd') || lowerCurrency.includes('dollar') || lowerCurrency.includes('$')) {
      return 'USD'
    }
    
    return 'USD' // Default fallback
  }

  // Map geography to country code
  const mapGeographyToCountry = (geographyString: string): string => {
    if (!geographyString) return 'US'
    
    const lowerGeo = geographyString.toLowerCase()
    
    if (lowerGeo.includes('uk') || lowerGeo.includes('united kingdom') || lowerGeo.includes('britain') || lowerGeo.includes('england') || lowerGeo.includes('scotland') || lowerGeo.includes('wales')) {
      return 'GB'
    }
    if (lowerGeo.includes('canada') || lowerGeo.includes('canadian')) {
      return 'CA'
    }
    if (lowerGeo.includes('australia') || lowerGeo.includes('australian')) {
      return 'AU'
    }
    if (lowerGeo.includes('germany') || lowerGeo.includes('german') || lowerGeo.includes('deutschland')) {
      return 'DE'
    }
    if (lowerGeo.includes('france') || lowerGeo.includes('french') || lowerGeo.includes('français')) {
      return 'FR'
    }
    if (lowerGeo.includes('us') || lowerGeo.includes('usa') || lowerGeo.includes('united states') || lowerGeo.includes('america') || lowerGeo.includes('american')) {
      return 'US'
    }
    
    return 'US' // Default fallback
  }

  // Map language from form data
  const mapLanguageCode = (languageString: string): string => {
    if (!languageString) return 'en'
    
    const lowerLang = languageString.toLowerCase()
    
    if (lowerLang.includes('french') || lowerLang.includes('français') || lowerLang.includes('fr')) {
      return 'fr'
    }
    if (lowerLang.includes('german') || lowerLang.includes('deutsch') || lowerLang.includes('de')) {
      return 'de'
    }
    if (lowerLang.includes('spanish') || lowerLang.includes('español') || lowerLang.includes('es')) {
      return 'es'
    }
    if (lowerLang.includes('english') || lowerLang.includes('en')) {
      return 'en'
    }
    
    return 'en' // Default fallback
  }

  // Auto-populate handler
  const handleAutoPopulate = () => {
    if (!formData?.formData) {
      toast.error('No form data available for auto-population')
      return
    }

    try {
      // Campaign Name
      const campaignNameFromForm = findAnswerByQuestion([
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
      const objectiveFromForm = findAnswerByQuestion([
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

      // Currency
      const currencyFromForm = findAnswerByQuestion([
        'currency',
        'budget currency',
        'currency code'
      ])
      if (currencyFromForm) {
        const mappedCurrency = mapCurrencyCode(currencyFromForm)
        setCurrency(mappedCurrency)
      }

      // Country
      const geographyFromForm = findAnswerByQuestion([
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
      const languageFromForm = findAnswerByQuestion([
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
      const startDateFromForm = findAnswerByQuestion([
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
      const endDateFromForm = findAnswerByQuestion([
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

      // Show success message with what was populated
      const populatedFields = []
      if (campaignNameFromForm) populatedFields.push('Campaign Name')
      if (objectiveFromForm) populatedFields.push('Campaign Type')
      if (currencyFromForm) populatedFields.push('Currency')
      if (geographyFromForm) populatedFields.push('Country')
      if (languageFromForm) populatedFields.push('Language')
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
          onClick={() => setIsExpanded(true)}
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
          <LinkedInAutoPopulateButton 
            onAutoPopulate={handleAutoPopulate}
            disabled={isCreating}
          />
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
            <Label htmlFor="budget-type">Budget Type *</Label>
            <Select value={budgetType} onValueChange={(value) => setBudgetType(value as 'daily' | 'total')}>
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
                ? "Amount to spend per day (resets at midnight UTC). LinkedIn may spend up to 150% on high-opportunity days."
                : "Total amount to spend over the campaign lifetime"
              }
            </p>
          </div>

          {/* Budget Amount and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="budget-amount">
                {budgetType === 'daily' ? 'Daily Budget *' : 'Total Budget *'}
              </Label>
              <Input
                id="budget-amount"
                type="number"
                step="0.01"
                min="0"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
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
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate} // End date must be after start date
              />
            </div>
          </div>

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