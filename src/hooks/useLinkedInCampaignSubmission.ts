import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { createLinkedInCampaign, CreateLinkedInCampaignData } from '@/app/actions/linkedin-create-ad-campaign'
import { 
  validateLinkedInTargeting 
} from '@/lib/linkedin-geo-locale-utils'

interface UseLinkedInCampaignSubmissionProps {
  organizationId: string
  selectedAccount: string
  selectedCampaignGroup: string
  name: string
  campaignType: 'SPONSORED_UPDATES' | 'TEXT_AD' | 'SPONSORED_INMAILS' | 'DYNAMIC'
  budgetType: 'daily' | 'total'
  budgetAmount: string
  currency: string
  country: string
  language: string
  startDate: string
  endDate: string
  resetForm: () => void
  setIsExpanded: (expanded: boolean) => void
  onCampaignCreated?: (campaign: { id: string; name: string }) => void
}

export function useLinkedInCampaignSubmission({
  organizationId,
  selectedAccount,
  selectedCampaignGroup,
  name,
  campaignType,
  budgetType,
  budgetAmount,
  currency,
  country,
  language,
  startDate,
  endDate,
  resetForm,
  setIsExpanded,
  onCampaignCreated
}: UseLinkedInCampaignSubmissionProps) {
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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

      // Validate and get correct LinkedIn targeting values
      const validation = validateLinkedInTargeting(country, language, currency)
      
      // Show warnings if any
      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
          toast.warning('LinkedIn Targeting Adjustment', {
            description: warning
          })
        })
      }

      // Get correct geo URN and locale
      const geoUrn = validation.corrections.geoUrn
      const supportedLocale = validation.corrections.locale
      
      // Parse the locale for campaign field (LinkedIn expects separate country/language)
      const [localeLanguage, localeCountry] = supportedLocale.split('_')
      
      console.log('LinkedIn Targeting Validation:', {
        requested: { country, language, currency },
        corrected: { 
          geoUrn, 
          locale: supportedLocale,
          campaignLocale: { country: localeCountry, language: localeLanguage }
        },
        warnings: validation.warnings
      })

      // Prepare campaign data with correct targeting
      const campaignData: CreateLinkedInCampaignData = {
        account: selectedAccount,
        campaignGroup: selectedCampaignGroup,
        costType: 'CPM', // Use CPM as default - works for all campaign types
        name: name.trim(),
        type: campaignType,
        locale: {
          country: localeCountry, // Use the corrected locale country
          language: localeLanguage // Use the corrected locale language
        },
        budgetType: budgetType,
        budgetAmount: budgetAmount,
        currencyCode: currency,
        startDate: startDate,
        endDate: endDate || undefined,
        // Proper targeting criteria with matching geo and locale
        targetingCriteria: {
          include: {
            and: [
              {
                or: {
                  'urn:li:adTargetingFacet:locations': [geoUrn]
                }
              },
              {
                or: {
                  'urn:li:adTargetingFacet:interfaceLocales': [
                    `urn:li:locale:${supportedLocale}` // Must match campaign locale
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
      resetForm()
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
  }, [
    name,
    budgetAmount,
    startDate,
    endDate,
    organizationId,
    selectedAccount,
    selectedCampaignGroup,
    campaignType,
    country,
    language,
    budgetType,
    currency,
    resetForm,
    setIsExpanded,
    onCampaignCreated
  ])

  return {
    isCreating,
    handleSubmit
  }
}