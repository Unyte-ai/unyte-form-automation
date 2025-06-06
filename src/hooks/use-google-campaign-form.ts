import { useState, useCallback } from 'react'
import { extractGoogleBudgetFromForm, detectGoogleCampaignTypeFromForm } from '@/lib/google-budget-utils'
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

export interface CreatedGoogleCampaign {
  campaignId: string
  campaignName: string
}

export interface OriginalFormData {
  budgetType: string | null
  budgetAmount: string | null
  startDate: string | null
  endDate: string | null
}

export function useGoogleCampaignForm(formData?: StructuredData) {
  const [campaignName, setCampaignName] = useState('')
  const [campaignType, setCampaignType] = useState<'SEARCH' | 'DISPLAY'>('SEARCH')
  const [budgetType, setBudgetType] = useState<'daily' | 'total'>('total')
  const [budgetAmount, setBudgetAmount] = useState('100.00')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isBudgetLocked, setIsBudgetLocked] = useState(false)
  const [isDateLocked, setIsDateLocked] = useState(false)
  const [createdCampaign, setCreatedCampaign] = useState<CreatedGoogleCampaign | null>(null)
  
  // Track original form data to determine if fields had auto-populated values
  const [originalFormData, setOriginalFormData] = useState<OriginalFormData>({
    budgetType: null,
    budgetAmount: null,
    startDate: null,
    endDate: null
  })

  // Utility function to find answers by question keywords
  const findAnswerByQuestion = useCallback((formData: FormQuestion[], searchTerms: string[]): string => {
    if (!formData) return ''
    
    const found = formData.find(item => 
      searchTerms.some(term => 
        item.question.toLowerCase().includes(term.toLowerCase())
      )
    )
    return found?.answer || ''
  }, [])

  // Parse date from form data
  const parseDateFromForm = useCallback((dateString: string): string => {
    if (!dateString) return ''
    
    try {
      const date = new Date(dateString)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0] // Return YYYY-MM-DD format
      }
    } catch (error) {
      console.warn('Could not parse date:', dateString, error)
    }
    
    return ''
  }, [])

  // Get tomorrow's date as default start date
  const getTomorrowDate = useCallback(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }, [])

  // Get date one month from tomorrow as default end date
  const getDefaultEndDate = useCallback(() => {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 31) // Tomorrow + 30 days
    return endDate.toISOString().split('T')[0]
  }, [])

  // Auto-populate form from form data
  const handleAutoPopulate = useCallback(() => {
    if (!formData?.formData) {
      console.log('No form data available for auto-population')
      return
    }

    try {
      // Campaign Name - look for campaign name related questions
      const campaignNameFromForm = findAnswerByQuestion(formData.formData, [
        'campaign name', 
        'name of campaign',
        'campaign title'
      ])
      if (campaignNameFromForm) {
        setCampaignName(campaignNameFromForm)
      }

      // Extract comprehensive budget information using utility functions
      const budgetConfig = extractGoogleBudgetFromForm(formData)
      
      // Campaign Type - use utility function for more comprehensive detection
      const detectedCampaignType = detectGoogleCampaignTypeFromForm(formData)
      setCampaignType(detectedCampaignType)

      // Initialize originalFormData tracking
      const originalData: OriginalFormData = {
        budgetType: null,
        budgetAmount: null,
        startDate: null,
        endDate: null
      }

      // Budget Type - set from extracted config
      if (budgetConfig.budgetType) {
        setBudgetType(budgetConfig.budgetType)
        originalData.budgetType = budgetConfig.budgetType
      }

      // Budget Amount - use allocated budget if available, otherwise total budget
      if (budgetConfig.allocatedBudget > 0) {
        setBudgetAmount(budgetConfig.allocatedBudget.toString())
        originalData.budgetAmount = budgetConfig.allocatedBudget.toString()
      } else if (budgetConfig.totalBudget > 0) {
        setBudgetAmount(budgetConfig.totalBudget.toString())
        originalData.budgetAmount = budgetConfig.totalBudget.toString()
      }

      // Lock budget fields after auto-populate
      if (budgetConfig.budgetType || budgetConfig.allocatedBudget > 0 || budgetConfig.totalBudget > 0) {
        setIsBudgetLocked(true)
      }

      // Start Date
      const startDateFromForm = findAnswerByQuestion(formData.formData, [
        'start date',
        'campaign start',
        'begin date',
        'launch date'
      ])
      if (startDateFromForm) {
        const parsedStartDate = parseDateFromForm(startDateFromForm)
        if (parsedStartDate) {
          setStartDate(parsedStartDate)
          originalData.startDate = parsedStartDate
        }
      }

      // End Date
      const endDateFromForm = findAnswerByQuestion(formData.formData, [
        'end date',
        'campaign end',
        'finish date',
        'completion date'
      ])
      if (endDateFromForm) {
        const parsedEndDate = parseDateFromForm(endDateFromForm)
        if (parsedEndDate) {
          setEndDate(parsedEndDate)
          originalData.endDate = parsedEndDate
        }
      }

      // Lock date fields after auto-populate if dates were found
      if ((startDateFromForm && parseDateFromForm(startDateFromForm)) || 
          (endDateFromForm && parseDateFromForm(endDateFromForm))) {
        setIsDateLocked(true)
      }

      // Store original form data
      setOriginalFormData(originalData)

      // Show success message with what was populated
      const populatedFields = []
      if (campaignNameFromForm) populatedFields.push('Campaign Name')
      if (detectedCampaignType) populatedFields.push('Campaign Type')
      if (budgetConfig.budgetType) populatedFields.push('Budget Type')
      if (budgetConfig.allocatedBudget > 0 || budgetConfig.totalBudget > 0) populatedFields.push('Budget Amount')
      if (startDateFromForm && parseDateFromForm(startDateFromForm)) populatedFields.push('Start Date')
      if (endDateFromForm && parseDateFromForm(endDateFromForm)) populatedFields.push('End Date')

      if (populatedFields.length > 0) {
        toast.success('Form auto-populated successfully!', {
          description: `Filled: ${populatedFields.join(', ')}`
        })
      } else {
        console.log('No matching fields found in form data for auto-population')
      }

    } catch (error) {
      console.error('Error during auto-populate:', error)
      toast.error('Auto-populate failed', {
        description: 'An error occurred while processing the form data'
      })
    }
  }, [formData, findAnswerByQuestion, parseDateFromForm])

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setCampaignName('')
    setCampaignType('SEARCH')
    setBudgetType('total')
    setBudgetAmount('100.00')
    setStartDate(getTomorrowDate())
    setEndDate(getDefaultEndDate())
    setIsBudgetLocked(false)
    setIsDateLocked(false)
    setOriginalFormData({
      budgetType: null,
      budgetAmount: null,
      startDate: null,
      endDate: null
    })
  }, [getTomorrowDate, getDefaultEndDate])

  // Initialize default dates
  const initializeDefaultDates = useCallback(() => {
    if (!startDate) setStartDate(getTomorrowDate())
    if (!endDate) setEndDate(getDefaultEndDate())
  }, [startDate, endDate, getTomorrowDate, getDefaultEndDate])

  // Check if budget fields have original form data
  const hasBudgetOriginalData = useCallback(() => {
    return originalFormData.budgetType !== null || originalFormData.budgetAmount !== null
  }, [originalFormData])

  // Check if date fields have original form data
  const hasDateOriginalData = useCallback(() => {
    return originalFormData.startDate !== null || originalFormData.endDate !== null
  }, [originalFormData])

  return {
    // State
    campaignName,
    campaignType,
    budgetType,
    budgetAmount,
    startDate,
    endDate,
    isCreating,
    isBudgetLocked,
    isDateLocked,
    createdCampaign,
    originalFormData,
    
    // Setters
    setCampaignName,
    setCampaignType,
    setBudgetType,
    setBudgetAmount,
    setStartDate,
    setEndDate,
    setIsCreating,
    setIsBudgetLocked,
    setIsDateLocked,
    setCreatedCampaign,
    
    // Utilities
    getTomorrowDate,
    getDefaultEndDate,
    handleAutoPopulate,
    resetForm,
    initializeDefaultDates,
    hasBudgetOriginalData,
    hasDateOriginalData
  }
}