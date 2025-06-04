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
  
  const found = formData.find(item => 
    searchTerms.some(term => 
      item.question.toLowerCase().includes(term.toLowerCase())
    )
  )
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
  
  if (!budgetPeriodAnswer) return 'LIFETIME'
  
  const lowerAnswer = budgetPeriodAnswer.toLowerCase()
  
  // Check for daily indicators
  if (lowerAnswer.includes('daily') || 
      lowerAnswer.includes('per day') || 
      lowerAnswer.includes('day')) {
    return 'DAILY'
  }
  
  // Check for lifetime indicators  
  if (lowerAnswer.includes('lifetime') || 
      lowerAnswer.includes('total') || 
      lowerAnswer.includes('campaign total') ||
      lowerAnswer.includes('one-time')) {
    return 'LIFETIME'
  }
  
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
    'budget amount',
    'budget',
    'total budget',
    'campaign budget',
    'spend',
    'investment',
    'cost'
  ])
  
  if (!budgetAnswer) return 0
  
  // Remove currency symbols and extract number
  const cleanBudget = budgetAnswer.replace(/[£$€,\s]/g, '')
  const budgetNumber = parseFloat(cleanBudget)
  
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
  
  return totalBudget / groupCount
}

/**
 * Converts budget amount to cents for Facebook API
 * @param budgetAmount - Budget amount in dollars/pounds
 * @returns Budget amount in cents
 */
export function convertBudgetToCents(budgetAmount: number): number {
  return Math.round(budgetAmount * 100)
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
  const budgetType = detectBudgetTypeFromForm(formData)
  const totalBudget = extractBudgetAmountFromForm(formData)
  const platformGroups = countPlatformGroups(selectedPlatforms)
  
  // Only calculate allocation if Meta platforms are selected
  const allocatedBudget = hasMetaPlatformsSelected(selectedPlatforms) 
    ? calculateBudgetPerGroup(totalBudget, selectedPlatforms)
    : 0
  
  const allocatedBudgetCents = convertBudgetToCents(allocatedBudget)
  
  return {
    budgetType,
    totalBudget,
    allocatedBudget,
    allocatedBudgetCents,
    platformGroups
  }
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
  
  const metaPlatformsInSelection = selectedPlatforms.filter(p => META_PLATFORM_GROUP.includes(p))
  
  return `Total budget: £${result.totalBudget} (${result.budgetType.toLowerCase()}) → ` +
         `${result.platformGroups} platform groups → ` +
         `£${result.allocatedBudget.toFixed(2)} allocated to Meta platforms ` +
         `(${metaPlatformsInSelection.join(', ')})`
}