// Google Budget Utilities for extracting and calculating budgets from form data

// Define interfaces for form data (consistent with existing utils)
interface FormQuestion {
    question: string;
    answer: string;
  }
  
  interface StructuredData {
    rawText: string;
    formData: FormQuestion[];
  }
  
  // Google budget types (matching Google Ads API requirements)
  export type GoogleBudgetType = 'daily' | 'total' // Google uses 'daily' and 'total' (lifetime)
  
  // Google campaign types that affect budget handling
  export type GoogleCampaignType = 'SEARCH' | 'DISPLAY'
  
  // Google platform keywords for detection
  const GOOGLE_SEARCH_KEYWORDS = [
    'google search', 
    'search ads',
    'google ads search',
    'search campaigns',
    'paid search'
  ]
  
  const GOOGLE_DISPLAY_KEYWORDS = [
    'google display',
    'display ads', 
    'google ads display',
    'display campaigns',
    'display network'
  ]
  
  const GOOGLE_GENERAL_KEYWORDS = [
    'google ads',
    'google',
    'adwords'
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
        console.log(`🎯 Google Budget - Exact match found for "${term}":`, exactMatch.question, '=', exactMatch.answer)
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
      console.log(`🔍 Google Budget - Partial match found:`, found.question, '=', found.answer)
    }
    
    return found?.answer || ''
  }
  
  /**
   * Detects Google campaign type from form data with Search prioritization
   * @param formData - The structured form submission data
   * @returns 'SEARCH' or 'DISPLAY' based on form content, with Search prioritized
   */
  export function detectGoogleCampaignTypeFromForm(formData: StructuredData): GoogleCampaignType {
    if (!formData?.formData) return 'SEARCH'
    
    const platformFields = formData.formData.filter(item => {
      const question = item.question.toLowerCase()
      return question.includes('channel') || 
             question.includes('network') || 
             question.includes('platform') ||
             question.includes('preferred') ||
             question.includes('campaign type') ||
             question.includes('ad type')
    })
    
    console.log('🔍 Google Campaign Type Detection - Platform-related fields found:', platformFields)
    
    let hasGoogleSearch = false
    let hasGoogleDisplay = false
    
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
      
      // Check for Google Search
      const isSearchMentioned = GOOGLE_SEARCH_KEYWORDS.some(keyword => 
        platformText.includes(keyword)
      )
      
      // Check for Google Display  
      const isDisplayMentioned = GOOGLE_DISPLAY_KEYWORDS.some(keyword => 
        platformText.includes(keyword)
      )
      
      if (isSearchMentioned) {
        hasGoogleSearch = true
        console.log('✅ Google Campaign Type - Search found in:', field.question, '=', field.answer)
      }
      
      if (isDisplayMentioned) {
        hasGoogleDisplay = true
        console.log('✅ Google Campaign Type - Display found in:', field.question, '=', field.answer)
      }
    }
    
    // Priority logic: Search takes precedence over Display
    if (hasGoogleSearch) {
      console.log('🎯 Google Campaign Type - Prioritizing SEARCH (Search found)')
      return 'SEARCH'
    }
    
    if (hasGoogleDisplay) {
      console.log('🎯 Google Campaign Type - Using DISPLAY (Display found, no Search)')
      return 'DISPLAY'
    }
    
    console.log('⚠️ Google Campaign Type - Defaulting to SEARCH (no specific type found)')
    return 'SEARCH' // Default fallback
  }
  
  /**
   * Detects budget type from form data for Google campaigns
   * @param formData - The structured form submission data
   * @returns 'total' or 'daily' based on form content, defaults to 'total'
   */
  export function detectGoogleBudgetTypeFromForm(formData: StructuredData): GoogleBudgetType {
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
    
    console.log('🕒 Google Budget Type Debug - Period answer found:', budgetPeriodAnswer)
    
    if (!budgetPeriodAnswer) return 'total'
    
    const lowerAnswer = budgetPeriodAnswer.toLowerCase()
    
    // Check for daily indicators
    if (lowerAnswer.includes('daily') || 
        lowerAnswer.includes('per day') || 
        lowerAnswer.includes('day')) {
      console.log('✅ Google Budget Type Debug - Detected DAILY budget')
      return 'daily'
    }
    
    // Check for lifetime/total indicators  
    if (lowerAnswer.includes('lifetime') || 
        lowerAnswer.includes('total') || 
        lowerAnswer.includes('campaign total') ||
        lowerAnswer.includes('one-time')) {
      console.log('✅ Google Budget Type Debug - Detected TOTAL budget')
      return 'total'
    }
    
    console.log('⚠️ Google Budget Type Debug - Defaulting to TOTAL budget')
    return 'total' // Default fallback
  }
  
  /**
   * Extracts budget amount from form data
   * @param formData - The structured form submission data
   * @returns Budget amount as number, or 0 if not found/invalid
   */
  export function extractGoogleBudgetAmountFromForm(formData: StructuredData): number {
    if (!formData?.formData) return 0
    
    const budgetAnswer = findAnswerByQuestion(formData.formData, [
      'budget amount',           // Exact match first
      'total budget',           // More specific terms
      'campaign budget',
      'google budget',          // Google-specific
      'search budget',          // Search context
      'display budget',         // Display context
      'ads budget',            // Ads context
      'budget',                // Generic 'budget' after specific ones
      'total spend',           // More specific than just 'spend'
      'campaign spend',
      'investment',
      'cost'
    ])
    
    console.log('💵 Google Budget Amount Debug - Raw answer found:', budgetAnswer)
    
    if (!budgetAnswer) return 0
    
    // Remove currency symbols and extract number
    const cleanBudget = budgetAnswer.replace(/[£$€,\s]/g, '')
    const budgetNumber = parseFloat(cleanBudget)
    
    console.log('💵 Google Budget Amount Debug - Clean budget:', cleanBudget, '| Parsed number:', budgetNumber)
    
    return isNaN(budgetNumber) ? 0 : budgetNumber
  }
  
  /**
   * Extracts currency code from form data for Google campaigns
   * @param formData - The structured form submission data
   * @returns Currency code (USD, GBP, EUR, etc.)
   */
  export function extractGoogleCurrencyFromForm(formData: StructuredData): string {
    if (!formData?.formData) return 'USD'
    
    const currencyAnswer = findAnswerByQuestion(formData.formData, [
      'budget currency',
      'currency',
      'currency code',
      'payment currency'
    ])
    
    console.log('💱 Google Currency Debug - Raw answer found:', currencyAnswer)
    
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
   * Checks if Google platforms are mentioned as a target platform in form data
   * @param formData - The structured form submission data
   * @returns True if Google platforms are mentioned
   */
  export function isGooglePlatformInForm(formData: StructuredData): boolean {
    if (!formData?.formData) return false
    
    const platformFields = formData.formData.filter(item => {
      const question = item.question.toLowerCase()
      return question.includes('channel') || 
             question.includes('network') || 
             question.includes('platform') ||
             question.includes('preferred')
    })
    
    console.log('🔍 Google Platform Detection - Platform-related fields found:', platformFields)
    
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
      
      // Check if any Google platform is mentioned
      const isGoogleMentioned = [
        ...GOOGLE_SEARCH_KEYWORDS,
        ...GOOGLE_DISPLAY_KEYWORDS,
        ...GOOGLE_GENERAL_KEYWORDS
      ].some(keyword => platformText.includes(keyword))
      
      if (isGoogleMentioned) {
        console.log('✅ Google Platform Detection - Google found in:', field.question, '=', field.answer)
        return true
      }
    }
    
    console.log('❌ Google Platform Detection - Google not found in form data')
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
   * Calculates Google's allocated budget when running multi-platform campaigns
   * @param totalBudget - Total budget amount from form
   * @param formData - The structured form submission data for platform detection
   * @returns Google's allocated budget amount
   */
  export function calculateGoogleAllocatedBudget(
    totalBudget: number,
    formData: StructuredData
  ): number {
    if (totalBudget <= 0) return 0
    
    if (!isGooglePlatformInForm(formData)) {
      console.log('🚫 Google Budget Allocation - Google not mentioned in form, returning 0')
      return 0
    }
    
    const totalPlatformGroups = countTotalPlatformGroupsInForm(formData)
    
    if (totalPlatformGroups === 0) {
      console.log('⚠️ Google Budget Allocation - No platforms detected, using full budget')
      return totalBudget
    }
    
    const allocatedBudget = totalBudget / totalPlatformGroups
    
    console.log('🧮 Google Budget Allocation:', {
      totalBudget,
      totalPlatformGroups,
      allocatedBudget
    })
    
    return allocatedBudget
  }
  
  /**
   * Main function to extract and process Google budget from form data
   * @param formData - The structured form submission data
   * @returns Complete Google budget configuration
   */
  export function extractGoogleBudgetFromForm(formData: StructuredData): {
    campaignType: GoogleCampaignType
    budgetType: GoogleBudgetType
    totalBudget: number
    allocatedBudget: number
    currency: string
    isGooglePlatform: boolean
    platformGroups: number
  } {
    console.log('🚀 extractGoogleBudgetFromForm called with:', {
      formDataExists: !!formData?.formData,
      formDataLength: formData?.formData?.length || 0
    })
    
    // Show all form questions for debugging
    if (formData?.formData) {
      console.log('📋 Google Budget - All Form Questions:', formData.formData.map(item => ({
        question: item.question,
        answer: item.answer
      })))
    }
    
    const campaignType = detectGoogleCampaignTypeFromForm(formData)
    const budgetType = detectGoogleBudgetTypeFromForm(formData)
    const totalBudget = extractGoogleBudgetAmountFromForm(formData)
    const currency = extractGoogleCurrencyFromForm(formData)
    const isGooglePlatform = isGooglePlatformInForm(formData)
    const platformGroups = countTotalPlatformGroupsInForm(formData)
    const allocatedBudget = calculateGoogleAllocatedBudget(totalBudget, formData)
    
    const result = {
      campaignType,
      budgetType,
      totalBudget,
      allocatedBudget,
      currency,
      isGooglePlatform,
      platformGroups
    }
    
    console.log('🎯 extractGoogleBudgetFromForm result:', result)
    
    return result
  }
  
  /**
   * Generate human-readable budget allocation summary for Google
   * @param formData - The structured form submission data
   * @returns Human-readable breakdown of Google budget allocation
   */
  export function getGoogleBudgetAllocationSummary(formData: StructuredData): string {
    const result = extractGoogleBudgetFromForm(formData)
    
    if (result.totalBudget === 0) {
      return "No budget information found in form data"
    }
    
    if (!result.isGooglePlatform) {
      return `Total budget: ${result.currency} ${result.totalBudget} (${result.budgetType}) - Google not mentioned in form data`
    }
    
    if (result.platformGroups === 0) {
      return `Total budget: ${result.currency} ${result.totalBudget} (${result.budgetType}) - No platforms detected, using full budget for Google`
    }
    
    return `Total budget: ${result.currency} ${result.totalBudget} (${result.budgetType}) → ` +
           `${result.platformGroups} platform groups → ` +
           `${result.currency} ${result.allocatedBudget.toFixed(2)} allocated to Google ${result.campaignType}`
  }
  
  /**
   * Helper function to format budget for Google Ads API
   * Google Ads budgets are sent in micros (amount * 1,000,000)
   * @param budgetAmount - Budget amount as number
   * @returns Budget amount in micros for API
   */
  export function formatGoogleBudgetForAPI(budgetAmount: number): number {
    return Math.round(budgetAmount * 1000000) // Convert to micros
  }
  
  /**
   * Get suggested Google budget based on campaign type
   * @param campaignType - Google campaign type ('SEARCH' or 'DISPLAY')
   * @param budgetType - Budget type ('daily' or 'total')
   * @param currency - Currency code
   * @returns Suggested budget range
   */
  export function getGoogleBudgetSuggestions(
    campaignType: GoogleCampaignType,
    budgetType: GoogleBudgetType,
    currency: string = 'USD'
  ): {
    minimum: number
    suggested: number
    high: number
    reasoning: string
  } {
    const suggestions: Record<GoogleCampaignType, Record<GoogleBudgetType, Record<string, { min: number; suggested: number; high: number }>>> = {
      'SEARCH': {
        'daily': {
          'USD': { min: 1, suggested: 30, high: 150 },
          'GBP': { min: 1, suggested: 25, high: 120 },
          'EUR': { min: 1, suggested: 27, high: 135 }
        },
        'total': {
          'USD': { min: 30, suggested: 500, high: 3000 },
          'GBP': { min: 25, suggested: 400, high: 2400 },
          'EUR': { min: 27, suggested: 450, high: 2700 }
        }
      },
      'DISPLAY': {
        'daily': {
          'USD': { min: 1, suggested: 20, high: 100 },
          'GBP': { min: 1, suggested: 16, high: 80 },
          'EUR': { min: 1, suggested: 18, high: 90 }
        },
        'total': {
          'USD': { min: 30, suggested: 300, high: 2000 },
          'GBP': { min: 25, suggested: 240, high: 1600 },
          'EUR': { min: 27, suggested: 270, high: 1800 }
        }
      }
    }
    
    const currencyData = suggestions[campaignType]?.[budgetType]?.[currency] || suggestions[campaignType]?.[budgetType]?.['USD']
    
    if (!currencyData) {
      return {
        minimum: 1,
        suggested: 30,
        high: 150,
        reasoning: 'Default suggestions - specific campaign type not found'
      }
    }
    
    const reasoning = `${campaignType} campaigns with ${budgetType} budgets typically perform well in this range`
    
    return {
      minimum: currencyData.min,
      suggested: currencyData.suggested,
      high: currencyData.high,
      reasoning
    }
  }