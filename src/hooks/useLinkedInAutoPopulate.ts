import { useCallback } from 'react'
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

interface UseLinkedInAutoPopulateProps {
  formData?: StructuredData
  setName: (name: string) => void
  setCampaignType: (type: 'SPONSORED_UPDATES' | 'TEXT_AD' | 'SPONSORED_INMAILS' | 'DYNAMIC') => void
  setBudgetType: (type: 'daily' | 'total') => void
  setBudgetAmount: (amount: string) => void
  setCurrency: (currency: string) => void
  setCountry: (country: string) => void
  setLanguage: (language: string) => void
  setStartDate: (date: string) => void
  setEndDate: (date: string) => void
  setIsBudgetLocked: (locked: boolean) => void
  setIsDateLocked: (locked: boolean) => void
  campaignType: 'SPONSORED_UPDATES' | 'TEXT_AD' | 'SPONSORED_INMAILS' | 'DYNAMIC'
}

export function useLinkedInAutoPopulate({
  formData,
  setName,
  setCampaignType,
  setBudgetType,
  setBudgetAmount,
  setCurrency,
  setCountry,
  setLanguage,
  setStartDate,
  setEndDate,
  setIsBudgetLocked,
  setIsDateLocked,
  campaignType
}: UseLinkedInAutoPopulateProps) {
  
  const handleAutoPopulate = useCallback(() => {
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
  }, [
    formData,
    setName,
    setCampaignType,
    setBudgetType,
    setBudgetAmount,
    setCurrency,
    setCountry,
    setLanguage,
    setStartDate,
    setEndDate,
    setIsBudgetLocked,
    setIsDateLocked,
    campaignType
  ])

  return {
    handleAutoPopulate
  }
}