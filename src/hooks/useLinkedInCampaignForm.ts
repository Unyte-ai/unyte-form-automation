import { useState } from 'react'

export interface OriginalFormData {
  budgetType: string | null
  budgetAmount: string | null
  startDate: string | null
  endDate: string | null
}

export function useLinkedInCampaignForm() {
  // Form state
  const [name, setName] = useState('')
  const [campaignType, setCampaignType] = useState<'SPONSORED_UPDATES' | 'TEXT_AD' | 'SPONSORED_INMAILS' | 'DYNAMIC'>('SPONSORED_UPDATES')
  const [budgetType, setBudgetType] = useState<'daily' | 'total'>('total')
  const [budgetAmount, setBudgetAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [country, setCountry] = useState('US')
  const [language, setLanguage] = useState('en')

  // Individual lock states (changed from group locking)
  const [isBudgetTypeLocked, setIsBudgetTypeLocked] = useState(false)
  const [isBudgetAmountLocked, setIsBudgetAmountLocked] = useState(false)
  const [isStartDateLocked, setIsStartDateLocked] = useState(false)
  const [isEndDateLocked, setIsEndDateLocked] = useState(false)
  
  // Date state
  const [startDate, setStartDate] = useState(() => {
    // Default to tomorrow to avoid timezone issues
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState('')

  // Track original form data to determine if fields had auto-populated values
  const [originalFormData, setOriginalFormData] = useState<OriginalFormData>({
    budgetType: null,
    budgetAmount: null,
    startDate: null,
    endDate: null
  })

  // Individual toggle functions (changed from group toggles)
  const toggleBudgetTypeLock = () => {
    setIsBudgetTypeLocked(!isBudgetTypeLocked)
  }

  const toggleBudgetAmountLock = () => {
    setIsBudgetAmountLocked(!isBudgetAmountLocked)
  }

  const toggleStartDateLock = () => {
    setIsStartDateLocked(!isStartDateLocked)
  }

  const toggleEndDateLock = () => {
    setIsEndDateLocked(!isEndDateLocked)
  }

  // Reset form function
  const resetForm = () => {
    setName('')
    setBudgetAmount('')
    // Reset individual lock states
    setIsBudgetTypeLocked(false)
    setIsBudgetAmountLocked(false)
    setIsStartDateLocked(false)
    setIsEndDateLocked(false)
    // Reset dates
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setStartDate(tomorrow.toISOString().split('T')[0])
    setEndDate('')
    // Reset original form data
    setOriginalFormData({
      budgetType: null,
      budgetAmount: null,
      startDate: null,
      endDate: null
    })
  }

  // Check if budget fields have original form data
  const hasBudgetOriginalData = () => {
    return originalFormData.budgetType !== null || originalFormData.budgetAmount !== null
  }

  // Check if date fields have original form data
  const hasDateOriginalData = () => {
    return originalFormData.startDate !== null || originalFormData.endDate !== null
  }

  return {
    // Form state
    name,
    setName,
    campaignType,
    setCampaignType,
    budgetType,
    setBudgetType,
    budgetAmount,
    setBudgetAmount,
    currency,
    setCurrency,
    country,
    setCountry,
    language,
    setLanguage,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    
    // Individual lock states
    isBudgetTypeLocked,
    setIsBudgetTypeLocked,
    isBudgetAmountLocked,
    setIsBudgetAmountLocked,
    isStartDateLocked,
    setIsStartDateLocked,
    isEndDateLocked,
    setIsEndDateLocked,
    
    // Individual toggle functions
    toggleBudgetTypeLock,
    toggleBudgetAmountLock,
    toggleStartDateLock,
    toggleEndDateLock,
    resetForm,

    // Original form data tracking
    originalFormData,
    setOriginalFormData,
    hasBudgetOriginalData,
    hasDateOriginalData
  }
}