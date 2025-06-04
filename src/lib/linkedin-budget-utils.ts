// LinkedIn Budget Utilities for extracting and calculating budgets from form data

// Define interfaces for form data (consistent with existing utils)
interface FormQuestion {
    question: string;
    answer: string;
  }
  
  interface StructuredData {
    rawText: string;
    formData: FormQuestion[];
  }
  
  // LinkedIn budget types (matching LinkedIn API requirements)
  export type LinkedInBudgetType = 'daily' | 'total' // LinkedIn uses 'daily' and 'total' (lifetime)
  
  // LinkedIn campaign types that affect budget handling
  export type LinkedInCampaignType = 'SPONSORED_UPDATES' | 'TEXT_AD' | 'SPONSORED_INMAILS' | 'DYNAMIC'
  
  // LinkedIn doesn't group platforms like Meta, but we track it as one platform for multi-platform allocation
  const LINKEDIN_PLATFORM_KEYWORDS = [
    'linkedin', 
    'linked in', 
    'professional network',
    'b2b'
  ]
  
  // Helper function to find answers by question keywords (consistent with existing utils)
  function findAnswerByQuestion(formData: FormQuestion[], searchTerms: string[]): string {
    if (!formData) return ''
    
    // First, try exact matches (case insensitive)
    for (const term of searchTerms) {
      const exactMatch = formData.find(item => 
        item.question.toLowerCase() === term.toLowerCase()
      )
      if (exactMatch) {
        console.log(`🎯 LinkedIn Budget - Exact match found for "${term}":`, exactMatch.question, '=', exactMatch.answer)
        return exactMatch.answer
      }
    }
    
    // Then try partial matches
    const found = formData.find(item => 
      searchTerms.some(term => 
        item.question.toLowerCase().includes(term.toLowerCase())
      )
    )
    
    if (found) {
      console.log(`🔍 LinkedIn Budget - Partial match found:`, found.question, '=', found.answer)
    }
    
    return found?.answer || ''
  }
  
  /**
   * Detects budget type from form data for LinkedIn campaigns
   * @param formData - The structured form submission data
   * @returns 'total' or 'daily' based on form content, defaults to 'total'
   */
  export function detectLinkedInBudgetTypeFromForm(formData: StructuredData): LinkedInBudgetType {
    if (!formData?.formData) return 'total'
    
    const budgetPeriodAnswer = findAnswerByQuestion(formData.formData, [
      'budget period',
      'budget type',
      'period',
      'daily',
      'lifetime',
      'total budget',
      'budget duration'
    ])
    
    console.log('🕒 LinkedIn Budget Type Debug - Period answer found:', budgetPeriodAnswer)
    
    if (!budgetPeriodAnswer) return 'total'
    
    const lowerAnswer = budgetPeriodAnswer.toLowerCase()
    
    // Check for daily indicators
    if (lowerAnswer.includes('daily') || 
        lowerAnswer.includes('per day') || 
        lowerAnswer.includes('day')) {
      console.log('✅ LinkedIn Budget Type Debug - Detected DAILY budget')
      return 'daily'
    }
    
    // Check for lifetime/total indicators  
    if (lowerAnswer.includes('lifetime') || 
        lowerAnswer.includes('total') || 
        lowerAnswer.includes('campaign total') ||
        lowerAnswer.includes('one-time')) {
      console.log('✅ LinkedIn Budget Type Debug - Detected TOTAL budget')
      return 'total'
    }
    
    console.log('⚠️ LinkedIn Budget Type Debug - Defaulting to TOTAL budget')
    return 'total' // Default fallback
  }
  
  /**
   * Extracts budget amount from form data
   * @param formData - The structured form submission data
   * @returns Budget amount as number, or 0 if not found/invalid
   */
  export function extractLinkedInBudgetAmountFromForm(formData: StructuredData): number {
    if (!formData?.formData) return 0
    
    const budgetAnswer = findAnswerByQuestion(formData.formData, [
      'budget amount',           // Exact match first
      'total budget',           // More specific terms
      'campaign budget',
      'linkedin budget',        // LinkedIn-specific
      'b2b budget',            // B2B context
      'professional budget',   // Professional context
      'budget',                // Generic 'budget' after specific ones
      'total spend',           // More specific than just 'spend'
      'campaign spend',
      'investment',
      'cost'
    ])
    
    console.log('💵 LinkedIn Budget Amount Debug - Raw answer found:', budgetAnswer)
    
    if (!budgetAnswer) return 0
    
    // Remove currency symbols and extract number
    const cleanBudget = budgetAnswer.replace(/[£$€,\s]/g, '')
    const budgetNumber = parseFloat(cleanBudget)
    
    console.log('💵 LinkedIn Budget Amount Debug - Clean budget:', cleanBudget, '| Parsed number:', budgetNumber)
    
    return isNaN(budgetNumber) ? 0 : budgetNumber
  }
  
  /**
   * Extracts currency code from form data for LinkedIn campaigns
   * @param formData - The structured form submission data
   * @returns Currency code (USD, GBP, EUR, etc.)
   */
  export function extractLinkedInCurrencyFromForm(formData: StructuredData): string {
    if (!formData?.formData) return 'USD'
    
    const currencyAnswer = findAnswerByQuestion(formData.formData, [
      'budget currency',
      'currency',
      'currency code',
      'payment currency'
    ])
    
    console.log('💱 LinkedIn Currency Debug - Raw answer found:', currencyAnswer)
    
    if (!currencyAnswer) return 'USD'
    
    const lowerCurrency = currencyAnswer.toLowerCase()
    
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
  
  /**
   * Checks if LinkedIn is mentioned as a target platform in form data
   * @param formData - The structured form submission data
   * @returns True if LinkedIn platforms are mentioned
   */
  export function isLinkedInPlatformInForm(formData: StructuredData): boolean {
    if (!formData?.formData) return false
    
    const platformFields = formData.formData.filter(item => {
      const question = item.question.toLowerCase()
      return question.includes('channel') || 
             question.includes('network') || 
             question.includes('platform') ||
             question.includes('preferred')
    })
    
    console.log('🔍 LinkedIn Platform Detection - Platform-related fields found:', platformFields)
    
    for (const field of platformFields) {
      if (!field.answer) continue
      
      let platformText = field.answer.toLowerCase()
      
      // Handle JSON array strings
      try {
        if (field.answer.startsWith('[') && field.answer.endsWith(']')) {
          const parsed = JSON.parse(field.answer)
          if (Array.isArray(parsed)) {
            platformText = parsed.join(',').toLowerCase()
          }
        }
      } catch (error) {
        console.warn('Failed to parse platform array:', error)
      }
      
      // Check if LinkedIn is mentioned
      const isLinkedInMentioned = LINKEDIN_PLATFORM_KEYWORDS.some(keyword => 
        platformText.includes(keyword)
      )
      
      if (isLinkedInMentioned) {
        console.log('✅ LinkedIn Platform Detection - LinkedIn found in:', field.question, '=', field.answer)
        return true
      }
    }
    
    console.log('❌ LinkedIn Platform Detection - LinkedIn not found in form data')
    return false
  }
  
/**
 * Counts total platform groups mentioned in form data
 * Used for budget allocation when running multi-platform campaigns
 * @param formData - The structured form submission data
 * @returns Number of total platform groups detected
 */
export function countTotalPlatformGroupsInForm(formData: StructuredData): number {
  if (!formData?.formData) return 0
  
  const platformFields = formData.formData.filter(item => {
    const question = item.question.toLowerCase()
    return question.includes('channel') || 
           question.includes('network') || 
           question.includes('platform') ||
           question.includes('preferred')
  })
  
  console.log('🔍 Platform Count - Platform-related fields found:', platformFields)
  
  const allPlatforms: string[] = []
  
  platformFields.forEach(field => {
    if (!field.answer) return
    
    const platformText = field.answer
    
    // Handle JSON array strings
    try {
      if (field.answer.startsWith('[') && field.answer.endsWith(']')) {
        const parsed = JSON.parse(field.answer)
        if (Array.isArray(parsed)) {
          allPlatforms.push(...parsed)
          return
        }
      }
    } catch (error) {
      console.warn('Failed to parse platform array:', error)
    }
    
    // Handle comma-separated strings
    if (platformText.includes(',')) {
      const platforms = platformText.split(',').map(p => p.trim())
      allPlatforms.push(...platforms)
    } else {
      allPlatforms.push(platformText.trim())
    }
  })
  
  // Clean and normalize platform names
  const cleanPlatforms = allPlatforms
    .filter(p => p && p.length > 0)
    .map(p => p.toLowerCase().trim())
  
  console.log('🧹 Platform Count - All platforms found:', cleanPlatforms)
  
  // Group platforms by major categories
  const platformGroups = new Set<string>()
  
  cleanPlatforms.forEach(platform => {
    const lowerPlatform = platform.toLowerCase()
    
    // Meta group (Facebook, Instagram, etc.) - ONLY grouping we keep
    if (['facebook', 'instagram', 'messenger', 'threads', 'meta'].some(keyword => 
      lowerPlatform.includes(keyword))) {
      platformGroups.add('meta')
    }
    // All other platforms as individual groups (no more grouping)
    else {
      platformGroups.add(lowerPlatform)
    }
  })
  
  const totalGroups = platformGroups.size
  
  console.log('🏷️ Platform Group Analysis:', {
    platformGroups: Array.from(platformGroups),
    totalGroups
  })
  
  return totalGroups
}
  
  /**
   * Calculates LinkedIn's allocated budget when running multi-platform campaigns
   * @param totalBudget - Total budget amount from form
   * @param formData - The structured form submission data for platform detection
   * @returns LinkedIn's allocated budget amount
   */
  export function calculateLinkedInAllocatedBudget(
    totalBudget: number,
    formData: StructuredData
  ): number {
    if (totalBudget <= 0) return 0
    
    if (!isLinkedInPlatformInForm(formData)) {
      console.log('🚫 LinkedIn Budget Allocation - LinkedIn not mentioned in form, returning 0')
      return 0
    }
    
    const totalPlatformGroups = countTotalPlatformGroupsInForm(formData)
    
    if (totalPlatformGroups === 0) {
      console.log('⚠️ LinkedIn Budget Allocation - No platforms detected, using full budget')
      return totalBudget
    }
    
    const allocatedBudget = totalBudget / totalPlatformGroups
    
    console.log('🧮 LinkedIn Budget Allocation:', {
      totalBudget,
      totalPlatformGroups,
      allocatedBudget
    })
    
    return allocatedBudget
  }
  
  /**
   * Validates budget amount meets LinkedIn minimum requirements
   * @param budgetAmount - Budget amount to validate
   * @param budgetType - Budget type ('daily' or 'total')
   * @param currency - Currency code
   * @returns Object with validation result and minimum required amount
   */
  export function validateLinkedInBudgetMinimums(
    budgetAmount: number,
    budgetType: LinkedInBudgetType,
    currency: string = 'USD'
  ): {
    isValid: boolean
    minimumRequired: number
    message: string
  } {
    // LinkedIn minimum budget requirements (approximate values)
    const minimums: Record<string, { daily: number; total: number }> = {
      'USD': { daily: 10, total: 100 },
      'GBP': { daily: 8, total: 80 },
      'EUR': { daily: 9, total: 90 },
      'CAD': { daily: 12, total: 120 }
    }
    
    const currencyMinimums = minimums[currency] || minimums['USD']
    const minimumRequired = budgetType === 'daily' ? currencyMinimums.daily : currencyMinimums.total
    
    const isValid = budgetAmount >= minimumRequired
    
    const message = isValid 
      ? `Budget meets LinkedIn ${budgetType} minimum of ${currency} ${minimumRequired}`
      : `Budget below LinkedIn ${budgetType} minimum. Required: ${currency} ${minimumRequired}, Provided: ${currency} ${budgetAmount}`
    
    console.log('✅ LinkedIn Budget Validation:', {
      budgetAmount,
      budgetType,
      currency,
      minimumRequired,
      isValid,
      message
    })
    
    return {
      isValid,
      minimumRequired,
      message
    }
  }
  
  /**
   * Main function to extract and process LinkedIn budget from form data
   * @param formData - The structured form submission data
   * @returns Complete LinkedIn budget configuration
   */
  export function extractLinkedInBudgetFromForm(formData: StructuredData): {
    budgetType: LinkedInBudgetType
    totalBudget: number
    allocatedBudget: number
    currency: string
    isLinkedInPlatform: boolean
    platformGroups: number
    validation: {
      isValid: boolean
      minimumRequired: number
      message: string
    }
  } {
    console.log('🚀 extractLinkedInBudgetFromForm called with:', {
      formDataExists: !!formData?.formData,
      formDataLength: formData?.formData?.length || 0
    })
    
    // Show all form questions for debugging
    if (formData?.formData) {
      console.log('📋 LinkedIn Budget - All Form Questions:', formData.formData.map(item => ({
        question: item.question,
        answer: item.answer
      })))
    }
    
    const budgetType = detectLinkedInBudgetTypeFromForm(formData)
    const totalBudget = extractLinkedInBudgetAmountFromForm(formData)
    const currency = extractLinkedInCurrencyFromForm(formData)
    const isLinkedInPlatform = isLinkedInPlatformInForm(formData)
    const platformGroups = countTotalPlatformGroupsInForm(formData)
    const allocatedBudget = calculateLinkedInAllocatedBudget(totalBudget, formData)
    const validation = validateLinkedInBudgetMinimums(allocatedBudget, budgetType, currency)
    
    const result = {
      budgetType,
      totalBudget,
      allocatedBudget,
      currency,
      isLinkedInPlatform,
      platformGroups,
      validation
    }
    
    console.log('🎯 extractLinkedInBudgetFromForm result:', result)
    
    return result
  }
  
  /**
   * Generate human-readable budget allocation summary for LinkedIn
   * @param formData - The structured form submission data
   * @returns Human-readable breakdown of LinkedIn budget allocation
   */
  export function getLinkedInBudgetAllocationSummary(formData: StructuredData): string {
    const result = extractLinkedInBudgetFromForm(formData)
    
    if (result.totalBudget === 0) {
      return "No budget information found in form data"
    }
    
    if (!result.isLinkedInPlatform) {
      return `Total budget: ${result.currency} ${result.totalBudget} (${result.budgetType}) - LinkedIn not mentioned in form data`
    }
    
    if (result.platformGroups === 0) {
      return `Total budget: ${result.currency} ${result.totalBudget} (${result.budgetType}) - No platforms detected, using full budget for LinkedIn`
    }
    
    const validationStatus = result.validation.isValid ? '✅' : '❌'
    
    return `Total budget: ${result.currency} ${result.totalBudget} (${result.budgetType}) → ` +
           `${result.platformGroups} platform groups → ` +
           `${result.currency} ${result.allocatedBudget.toFixed(2)} allocated to LinkedIn ` +
           `${validationStatus} ${result.validation.message}`
  }
  
  /**
   * Helper function to format budget for LinkedIn API
   * LinkedIn budgets are sent as strings with decimal values
   * @param budgetAmount - Budget amount as number
   * @returns Formatted budget string for API
   */
  export function formatLinkedInBudgetForAPI(budgetAmount: number): string {
    return budgetAmount.toFixed(2)
  }
  
  /**
   * Get suggested LinkedIn budget based on campaign type and objective
   * @param campaignType - LinkedIn campaign type
   * @param budgetType - Budget type ('daily' or 'total')
   * @param currency - Currency code
   * @returns Suggested budget range
   */
  export function getLinkedInBudgetSuggestions(
    campaignType: LinkedInCampaignType,
    budgetType: LinkedInBudgetType,
    currency: string = 'USD'
  ): {
    minimum: number
    suggested: number
    high: number
    reasoning: string
  } {
    const suggestions: Record<LinkedInCampaignType, Record<LinkedInBudgetType, Record<string, { min: number; suggested: number; high: number }>>> = {
      'SPONSORED_UPDATES': {
        'daily': {
          'USD': { min: 10, suggested: 50, high: 200 },
          'GBP': { min: 8, suggested: 40, high: 160 },
          'EUR': { min: 9, suggested: 45, high: 180 }
        },
        'total': {
          'USD': { min: 100, suggested: 1000, high: 5000 },
          'GBP': { min: 80, suggested: 800, high: 4000 },
          'EUR': { min: 90, suggested: 900, high: 4500 }
        }
      },
      'TEXT_AD': {
        'daily': {
          'USD': { min: 10, suggested: 25, high: 100 },
          'GBP': { min: 8, suggested: 20, high: 80 },
          'EUR': { min: 9, suggested: 22, high: 90 }
        },
        'total': {
          'USD': { min: 100, suggested: 500, high: 2000 },
          'GBP': { min: 80, suggested: 400, high: 1600 },
          'EUR': { min: 90, suggested: 450, high: 1800 }
        }
      },
      'SPONSORED_INMAILS': {
        'daily': {
          'USD': { min: 10, suggested: 75, high: 300 },
          'GBP': { min: 8, suggested: 60, high: 240 },
          'EUR': { min: 9, suggested: 67, high: 270 }
        },
        'total': {
          'USD': { min: 100, suggested: 1500, high: 7500 },
          'GBP': { min: 80, suggested: 1200, high: 6000 },
          'EUR': { min: 90, suggested: 1350, high: 6750 }
        }
      },
      'DYNAMIC': {
        'daily': {
          'USD': { min: 10, suggested: 40, high: 150 },
          'GBP': { min: 8, suggested: 32, high: 120 },
          'EUR': { min: 9, suggested: 36, high: 135 }
        },
        'total': {
          'USD': { min: 100, suggested: 800, high: 3000 },
          'GBP': { min: 80, suggested: 640, high: 2400 },
          'EUR': { min: 90, suggested: 720, high: 2700 }
        }
      }
    }
    
    const currencyData = suggestions[campaignType]?.[budgetType]?.[currency] || suggestions[campaignType]?.[budgetType]?.['USD']
    
    if (!currencyData) {
      return {
        minimum: 10,
        suggested: 50,
        high: 200,
        reasoning: 'Default suggestions - specific campaign type not found'
      }
    }
    
    const reasoning = `${campaignType.replace('_', ' ')} campaigns with ${budgetType} budgets typically perform well in this range`
    
    return {
      minimum: currencyData.min,
      suggested: currencyData.suggested,
      high: currencyData.high,
      reasoning
    }
  }