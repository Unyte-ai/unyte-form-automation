import { FacebookPublisherPlatform } from './facebook-campaign-utils'

// Define form data interfaces for type safety
interface FormQuestion {
  question: string;
  answer: string;
}

interface StructuredData {
  rawText: string;
  formData: FormQuestion[];
}

// Platform mapping configuration
const PLATFORM_MAPPINGS: Record<string, FacebookPublisherPlatform> = {
  // Facebook variations
  'facebook': 'facebook',
  'fb': 'facebook',
  'facebook ads': 'facebook',
  'facebook advertising': 'facebook',
  
  // Instagram variations  
  'instagram': 'instagram',
  'ig': 'instagram',
  'instagram ads': 'instagram',
  
  // Messenger variations
  'messenger': 'messenger',
  'facebook messenger': 'messenger',
  'whatsapp & messenger': 'messenger', // Common combined mention
  'whatsapp messenger': 'messenger',
  
  // Threads variations
  'threads': 'threads',
  'meta threads': 'threads',
  'threads app': 'threads'
}

// Fields that might contain publisher platform information
const PLATFORM_QUESTION_PATTERNS = [
  /preferred.*channels?/i,
  /preferred.*networks?/i,
  /channels?.*networks?/i,
  /platforms?/i,
  /social.*media/i,
  /advertising.*channels?/i,
  /marketing.*channels?/i,
  /promotion.*channels?/i
]

/**
 * Extracts and maps publisher platforms from form data
 * @param formData - The structured form submission data
 * @returns Array of FacebookPublisherPlatform values that should be selected
 */
export function extractPublisherPlatformsFromFormData(formData: StructuredData): FacebookPublisherPlatform[] {
  if (!formData?.formData?.length) {
    return []
  }

  const selectedPlatforms = new Set<FacebookPublisherPlatform>()

  // Find relevant form fields that might contain platform information
  const relevantFields = formData.formData.filter(item => {
    return PLATFORM_QUESTION_PATTERNS.some(pattern => 
      pattern.test(item.question)
    )
  })

  // Process each relevant field
  relevantFields.forEach(field => {
    if (!field.answer) return

    // Handle JSON array strings (like the example data)
    let platformText = field.answer
    try {
      if (field.answer.startsWith('[') && field.answer.endsWith(']')) {
        const parsed = JSON.parse(field.answer)
        if (Array.isArray(parsed)) {
          platformText = parsed.join(' ')
        }
      }
    } catch (error) {
      // If parsing fails, use the original answer
      console.warn('Failed to parse platform array:', error)
    }

    // Normalize the text for matching
    const normalizedText = platformText.toLowerCase()

    // Check each mapping
    Object.entries(PLATFORM_MAPPINGS).forEach(([key, platform]) => {
      if (normalizedText.includes(key.toLowerCase())) {
        selectedPlatforms.add(platform)
      }
    })
  })

  return Array.from(selectedPlatforms)
}

/**
 * Checks if a specific platform should be selected based on form data
 * @param formData - The structured form submission data  
 * @param platform - The platform to check for
 * @returns True if the platform should be selected
 */
export function shouldSelectPlatform(formData: StructuredData, platform: FacebookPublisherPlatform): boolean {
  const selectedPlatforms = extractPublisherPlatformsFromFormData(formData)
  return selectedPlatforms.includes(platform)
}

/**
 * Gets default publisher platforms if none are found in form data
 * @returns Default set of publisher platforms
 */
export function getDefaultPublisherPlatforms(): FacebookPublisherPlatform[] {
  return ['facebook', 'instagram'] // Conservative default
}

/**
 * Main function to get publisher platforms for auto-population
 * @param formData - The structured form submission data
 * @returns Array of FacebookPublisherPlatform values for the form
 */
export function getPublisherPlatformsForAutoPopulate(formData: StructuredData): FacebookPublisherPlatform[] {
  const extractedPlatforms = extractPublisherPlatformsFromFormData(formData)
  
  // If we found platforms in the data, use them
  if (extractedPlatforms.length > 0) {
    return extractedPlatforms
  }
  
  // Otherwise, return defaults
  return getDefaultPublisherPlatforms()
}