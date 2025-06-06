import { useState } from 'react'

export function useLinkedInCampaignForm() {
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

  // Reset form function
  const resetForm = () => {
    setName('')
    setBudgetAmount('')
    setIsBudgetLocked(false) // Reset budget lock state
    setIsDateLocked(false) // Reset date lock state
    // Reset dates
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setStartDate(tomorrow.toISOString().split('T')[0])
    setEndDate('')
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
    
    // Lock states
    isBudgetLocked,
    setIsBudgetLocked,
    isDateLocked,
    setIsDateLocked,
    
    // Functions
    toggleBudgetLock,
    toggleDateLock,
    resetForm
  }
}