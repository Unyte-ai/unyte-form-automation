import { FacebookBudgetType, FacebookPublisherPlatform } from './facebook-campaign-utils'

// Define interfaces for form data (same as in other utils)
interface FormQuestion {
  question: string;
  answer: string;
}

interface StructuredData {
  rawText: string;
  formData: FormQuestion[];
}

// Platform grouping - Meta platforms count as one allocation unit
const META_PLATFORM_GROUP: FacebookPublisherPlatform[] = [
  'facebook',
  'instagram', 
  'threads',
  'messenger'
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
      console.log(`🎯 Exact match found for "${term}":`, exactMatch.question, '=', exactMatch.answer)
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
    console.log(`🔍 Partial match found:`, found.question, '=', found.answer)
  }
  
  return found?.answer || ''
}

/**
 * Detects budget type from form data
 * @param formData - The structured form submission data
 * @returns 'LIFETIME' or 'DAILY' based on form content, defaults to 'LIFETIME'
 */
export function detectBudgetTypeFromForm(formData: StructuredData): FacebookBudgetType {
  if (!formData?.formData) return 'LIFETIME'
  
  const budgetPeriodAnswer = findAnswerByQuestion(formData.formData, [
    'budget period',
    'budget type',
    'period',
    'daily',
    'lifetime',
    'total budget',
    'budget duration'
  ])
  
  console.log('🕒 Budget Type Debug - Period answer found:', budgetPeriodAnswer)
  
  if (!budgetPeriodAnswer) return 'LIFETIME'
  
  const lowerAnswer = budgetPeriodAnswer.toLowerCase()
  
  // Check for daily indicators
  if (lowerAnswer.includes('daily') || 
      lowerAnswer.includes('per day') || 
      lowerAnswer.includes('day')) {
    console.log('✅ Budget Type Debug - Detected DAILY budget')
    return 'DAILY'
  }
  
  // Check for lifetime indicators  
  if (lowerAnswer.includes('lifetime') || 
      lowerAnswer.includes('total') || 
      lowerAnswer.includes('campaign total') ||
      lowerAnswer.includes('one-time')) {
    console.log('✅ Budget Type Debug - Detected LIFETIME budget')
    return 'LIFETIME'
  }
  
  console.log('⚠️ Budget Type Debug - Defaulting to LIFETIME budget')
  return 'LIFETIME' // Default fallback
}

/**
 * Extracts budget amount from form data
 * @param formData - The structured form submission data
 * @returns Budget amount as number, or 0 if not found/invalid
 */
export function extractBudgetAmountFromForm(formData: StructuredData): number {
  if (!formData?.formData) return 0
  
  const budgetAnswer = findAnswerByQuestion(formData.formData, [
    'budget amount',           // Exact match first
    'total budget',           // More specific terms
    'campaign budget',
    'budget',                 // Generic 'budget' after specific ones
    'total spend',            // More specific than just 'spend'
    'campaign spend',
    'investment',
    'cost'
  ])
  
  console.log('💵 Budget Amount Debug - Raw answer found:', budgetAnswer)
  
  if (!budgetAnswer) return 0
  
  // Remove currency symbols and extract number
  const cleanBudget = budgetAnswer.replace(/[£$€,\s]/g, '')
  const budgetNumber = parseFloat(cleanBudget)
  
  console.log('💵 Budget Amount Debug - Clean budget:', cleanBudget, '| Parsed number:', budgetNumber)
  
  return isNaN(budgetNumber) ? 0 : budgetNumber
}

/**
 * Groups platforms for budget allocation
 * Meta platforms (Facebook, Instagram, Threads, Messenger) count as one group
 * @param selectedPlatforms - Array of selected publisher platforms
 * @returns Number of platform groups for budget allocation
 */
export function countPlatformGroups(selectedPlatforms: FacebookPublisherPlatform[]): number {
  if (!selectedPlatforms?.length) return 0
  
  let groups = 0
  
  // Check if any Meta platforms are selected
  const hasMetaPlatforms = selectedPlatforms.some(platform => 
    META_PLATFORM_GROUP.includes(platform)
  )
  
  if (hasMetaPlatforms) {
    groups += 1 // All Meta platforms count as 1 group
  }
  
  // Count other platforms individually
  const otherPlatforms = selectedPlatforms.filter(platform => 
    !META_PLATFORM_GROUP.includes(platform)
  )
  groups += otherPlatforms.length
  
  console.log('🏷️ Platform Groups Debug:', {
    selectedPlatforms,
    hasMetaPlatforms,
    otherPlatforms,
    totalGroups: groups
  })
  
  return groups
}

/**
 * Checks if the selected platforms include Meta platforms
 * @param selectedPlatforms - Array of selected publisher platforms
 * @returns True if Meta platforms are selected
 */
export function hasMetaPlatformsSelected(selectedPlatforms: FacebookPublisherPlatform[]): boolean {
  return selectedPlatforms.some(platform => META_PLATFORM_GROUP.includes(platform))
}

/**
 * Calculates budget allocation per platform group
 * @param totalBudget - Total budget amount
 * @param selectedPlatforms - Array of selected publisher platforms
 * @returns Budget amount per group, or 0 if no platforms selected
 */
export function calculateBudgetPerGroup(
  totalBudget: number, 
  selectedPlatforms: FacebookPublisherPlatform[]
): number {
  if (totalBudget <= 0 || !selectedPlatforms?.length) return 0
  
  const groupCount = countPlatformGroups(selectedPlatforms)
  
  if (groupCount === 0) return 0
  
  const budgetPerGroup = totalBudget / groupCount
  
  console.log('🧮 Budget Calculation Debug:', {
    totalBudget,
    groupCount,
    budgetPerGroup
  })
  
  return budgetPerGroup
}

/**
 * Converts budget amount to cents for Facebook API
 * @param budgetAmount - Budget amount in dollars/pounds
 * @returns Budget amount in cents
 */
export function convertBudgetToCents(budgetAmount: number): number {
  const cents = Math.round(budgetAmount * 100)
  console.log('💱 Currency Conversion Debug:', budgetAmount, '→', cents, 'cents')
  return cents
}

/**
 * Main function to extract and calculate budget for Meta campaigns
 * @param formData - The structured form submission data
 * @param selectedPlatforms - Array of selected publisher platforms
 * @returns Object with budget type, total amount, and allocated amount in cents
 */
export function extractMetaBudgetFromForm(
  formData: StructuredData,
  selectedPlatforms: FacebookPublisherPlatform[]
): {
  budgetType: FacebookBudgetType
  totalBudget: number
  allocatedBudget: number
  allocatedBudgetCents: number
  platformGroups: number
} {
  console.log('🚀 extractMetaBudgetFromForm called with:', {
    formDataExists: !!formData?.formData,
    formDataLength: formData?.formData?.length || 0,
    selectedPlatforms
  })
  
  // Show all form questions for debugging
  if (formData?.formData) {
    console.log('📋 All Form Questions:', formData.formData.map(item => ({
      question: item.question,
      answer: item.answer
    })))
  }
  
  const budgetType = detectBudgetTypeFromForm(formData)
  const totalBudget = extractBudgetAmountFromForm(formData)
  
  // NEW: Extract ALL platforms mentioned in the form data first
  const allPlatformsInForm = extractAllPlatformsFromForm(formData)
  console.log('🌐 All platforms detected in form data:', allPlatformsInForm)
  
  // Count total platform groups (Meta = 1 group, all others = individual groups)
  const totalPlatformGroups = countTotalPlatformGroups(allPlatformsInForm)
  console.log('📊 Total platform groups in form:', totalPlatformGroups)
  
  // Calculate allocation based on whether Meta is the only platform group
  const isMetaOnlyScenario = totalPlatformGroups === 1 && hasMetaPlatformsSelected(selectedPlatforms)
  const allocatedBudget = hasMetaPlatformsSelected(selectedPlatforms) && totalPlatformGroups > 0
    ? (isMetaOnlyScenario ? totalBudget : totalBudget / totalPlatformGroups)
    : 0
  
  const allocatedBudgetCents = convertBudgetToCents(allocatedBudget)
  
  const result = {
    budgetType,
    totalBudget,
    allocatedBudget,
    allocatedBudgetCents,
    platformGroups: totalPlatformGroups
  }
  
  console.log('🎯 extractMetaBudgetFromForm result:', {
    ...result,
    isMetaOnlyScenario,
    allocationLogic: isMetaOnlyScenario ? 'Full budget (Meta only)' : `Divided by ${totalPlatformGroups} groups`
  })  
  return result
}

/**
 * Extract all platforms mentioned in form data
 * @param formData - The structured form submission data
 * @returns Array of all platform names found in the form
 */
function extractAllPlatformsFromForm(formData: StructuredData): string[] {
  if (!formData?.formData) return []
  
  const platformFields = formData.formData.filter(item => {
    const question = item.question.toLowerCase()
    // More specific patterns for advertising platform questions
    return (question.includes('preferred') && (question.includes('channel') || question.includes('network'))) ||
           question.includes('advertising') && (question.includes('channel') || question.includes('platform')) ||
           question.includes('marketing') && (question.includes('channel') || question.includes('platform')) ||
           (question.includes('channel') && question.includes('network')) // "Channels / Networks"
  })
  
  console.log('🔍 Platform-related fields found:', platformFields)
  
  const allPlatforms: string[] = []
  
  platformFields.forEach(field => {
    if (!field.answer) return
    
    let platformText = field.answer
    
    // Handle JSON array strings
    try {
      if (field.answer.startsWith('[') && field.answer.endsWith(']')) {
        const parsed = JSON.parse(field.answer)
        if (Array.isArray(parsed)) {
          platformText = parsed.join(',')
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
  
  console.log('🧹 Cleaned platforms:', cleanPlatforms)
  return cleanPlatforms
}

/**
 * Count total platform groups across all detected platforms
 * Meta platforms count as 1 group, all others count individually
 * @param allPlatforms - Array of all platform names detected
 * @returns Number of total platform groups
 */
function countTotalPlatformGroups(allPlatforms: string[]): number {
  if (!allPlatforms.length) return 0
  
  const metaPlatformKeywords = [
    'facebook', 'instagram', 'messenger', 'threads', 'meta'
  ]
 
  let hasMetaPlatforms = false
  const otherPlatforms = new Set<string>()
  
  allPlatforms.forEach(platform => {
    const lowerPlatform = platform.toLowerCase()
    
    // Check if it's a Meta platform
    const isMetaPlatform = metaPlatformKeywords.some(keyword => 
      lowerPlatform.includes(keyword)
    )
    
    if (isMetaPlatform) {
      hasMetaPlatforms = true
    } else {
      // Add non-Meta platforms to the set (automatically deduplicates)
      otherPlatforms.add(lowerPlatform)
    }
  })
  
  const metaGroupCount = hasMetaPlatforms ? 1 : 0
  const otherGroupCount = otherPlatforms.size
  const totalGroups = metaGroupCount + otherGroupCount
  
  console.log('🏷️ Platform Group Analysis:', {
    hasMetaPlatforms,
    metaGroupCount,
    otherPlatforms: Array.from(otherPlatforms),
    otherGroupCount,
    totalGroups
  })
  
  return totalGroups
}

/**
 * Example usage and validation function
 * @param formData - The structured form submission data
 * @param selectedPlatforms - Array of selected publisher platforms
 * @returns Human-readable breakdown of budget allocation
 */
export function getBudgetAllocationSummary(
  formData: StructuredData,
  selectedPlatforms: FacebookPublisherPlatform[]
): string {
  const result = extractMetaBudgetFromForm(formData, selectedPlatforms)
  
  if (result.totalBudget === 0) {
    return "No budget information found in form data"
  }
  
  if (!hasMetaPlatformsSelected(selectedPlatforms)) {
    return `Total budget: £${result.totalBudget} (${result.budgetType.toLowerCase()}) - No Meta platforms selected`
  }
  
  if (result.platformGroups === 0) {
    return `Total budget: £${result.totalBudget} (${result.budgetType.toLowerCase()}) - No platforms detected in form data`
  }
  
  const metaPlatformsInSelection = selectedPlatforms.filter(p => META_PLATFORM_GROUP.includes(p))
  const isMetaOnlyScenario = result.platformGroups === 1 && hasMetaPlatformsSelected(selectedPlatforms)
  
  const allocationDescription = isMetaOnlyScenario 
    ? `Full budget allocated to Meta platforms (${metaPlatformsInSelection.join(', ')})`
    : `${result.platformGroups} platform groups → £${result.allocatedBudget.toFixed(2)} allocated to Meta platforms (${metaPlatformsInSelection.join(', ')})`

  return `Total budget: £${result.totalBudget} (${result.budgetType.toLowerCase()}) → ${allocationDescription}`
}