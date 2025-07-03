import { 
  FacebookCampaignData, 
  FacebookAdSetData,
  FacebookCampaignObjective,
  DEFAULT_ADSET_VALUES
} from './facebook-campaign-utils'
import { getPublisherPlatformsForAutoPopulate } from './meta-publisher-platform-utils'
import { extractMetaBudgetFromForm } from './meta-budget-utils'

// Define interfaces for form data
interface FormQuestion {
  question: string;
  answer: string;
}

interface StructuredData {
  rawText: string;
  formData: FormQuestion[];
}

// Helper function to find answers by question keywords
export function findAnswerByQuestion(formData: FormQuestion[], searchTerms: string[]): string {
  if (!formData) return ''
  
  const found = formData.find(item => 
    searchTerms.some(term => 
      item.question.toLowerCase().includes(term.toLowerCase())
    )
  )
  return found?.answer || ''
}

// Parse date from form data
export function parseDateFromForm(dateString: string): string {
  if (!dateString) return ''
  
  try {
    // Try to parse various date formats
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      return date.toISOString() // Return full ISO string for Meta API
    }
  } catch (error) {
    console.warn('Could not parse date:', dateString, error)
  }
  
  return ''
}

// Map objective from form data to Meta campaign objectives
export function mapObjectiveToMetaCampaignType(objectiveString: string): FacebookCampaignObjective {
  if (!objectiveString) return 'TRAFFIC' // Default fallback
  
  const lowerObjective = objectiveString.toLowerCase()
  
  // Brand awareness and reach
  if (lowerObjective.includes('awareness') || lowerObjective.includes('brand') || lowerObjective.includes('reach')) {
    return 'AWARENESS'
  }
  
  // Traffic and website visits
  if (lowerObjective.includes('traffic') || lowerObjective.includes('visit') || lowerObjective.includes('website') || lowerObjective.includes('click')) {
    return 'TRAFFIC'
  }
  
  // Sales, conversions, purchases
  if (lowerObjective.includes('sales') || lowerObjective.includes('conversion') || lowerObjective.includes('convert') || lowerObjective.includes('purchase') || lowerObjective.includes('revenue')) {
    return 'SALES'
  }
  
  // App promotion and installs
  if (lowerObjective.includes('app') || lowerObjective.includes('install') || lowerObjective.includes('download') || lowerObjective.includes('mobile')) {
    return 'APP_PROMOTION'
  }
  
  // Lead generation
  if (lowerObjective.includes('lead') || lowerObjective.includes('generation') || lowerObjective.includes('signup') || lowerObjective.includes('sign up') || lowerObjective.includes('contact')) {
    return 'LEAD_GENERATION'
  }
  
  // Engagement and social actions
  if (lowerObjective.includes('engagement') || lowerObjective.includes('engage') || lowerObjective.includes('like') || lowerObjective.includes('share') || lowerObjective.includes('comment')) {
    return 'POST_ENGAGEMENT'
  }
  
  return 'TRAFFIC' // Default fallback
}

// Map geography text to country codes (supporting multiple countries)
export function mapGeographyToCountries(geographyString: string): string[] {
  if (!geographyString) return ['US'] // Default fallback
  
  const lowerGeo = geographyString.toLowerCase()
  const countries: string[] = []
  
  // Check for multiple countries mentioned
  if (lowerGeo.includes('uk') || lowerGeo.includes('united kingdom') || lowerGeo.includes('britain') || lowerGeo.includes('england') || lowerGeo.includes('scotland') || lowerGeo.includes('wales')) {
    countries.push('GB')
  }
  if (lowerGeo.includes('us') || lowerGeo.includes('usa') || lowerGeo.includes('united states') || lowerGeo.includes('america') || lowerGeo.includes('american')) {
    countries.push('US')
  }
  if (lowerGeo.includes('canada') || lowerGeo.includes('canadian')) {
    countries.push('CA')
  }
  if (lowerGeo.includes('australia') || lowerGeo.includes('australian')) {
    countries.push('AU')
  }
  if (lowerGeo.includes('germany') || lowerGeo.includes('german') || lowerGeo.includes('deutschland')) {
    countries.push('DE')
  }
  if (lowerGeo.includes('france') || lowerGeo.includes('french') || lowerGeo.includes('français')) {
    countries.push('FR')
  }
  if (lowerGeo.includes('italy') || lowerGeo.includes('italian') || lowerGeo.includes('italia')) {
    countries.push('IT')
  }
  if (lowerGeo.includes('spain') || lowerGeo.includes('spanish') || lowerGeo.includes('españa')) {
    countries.push('ES')
  }
  
  // If no countries found, return default
  return countries.length > 0 ? countries : ['US']
}

// Map age range text to min/max ages
export function parseAgeRange(ageString: string): { age_min?: number, age_max?: number } {
  if (!ageString) return {}
  
  const lowerAge = ageString.toLowerCase()
  
  // Look for patterns like "18-65", "25-54", "MEN24-35", "WOMEN18-34"
  const rangeMatch = lowerAge.match(/(\d+)[^\d]*(\d+)/)
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1])
    const max = parseInt(rangeMatch[2])
    
    // Validate age ranges (Facebook minimum is 13, maximum is 65+)
    if (min >= 13 && max <= 99 && min <= max) {
      return { age_min: min, age_max: max }
    }
  }
  
  // Look for single age mentions
  const singleAgeMatch = lowerAge.match(/(\d+)/)
  if (singleAgeMatch) {
    const age = parseInt(singleAgeMatch[1])
    if (age >= 13 && age <= 99) {
      // If it's a young age, assume it's minimum; if older, assume it's maximum
      if (age <= 30) {
        return { age_min: age }
      } else {
        return { age_max: age }
      }
    }
  }
  
  return {}
}

// Extract application ID from various text formats
export function extractApplicationId(text: string): string {
  if (!text) return ''
  
  // Look for patterns that might be Facebook app IDs (typically numeric)
  const appIdMatch = text.match(/\b\d{10,20}\b/) // App IDs are usually 10-20 digits
  if (appIdMatch) {
    return appIdMatch[0]
  }
  
  // If it's a clean string that looks like an ID, return it
  const cleanText = text.trim()
  if (/^\d+$/.test(cleanText) && cleanText.length >= 10) {
    return cleanText
  }
  
  return ''
}

// Extract page ID from various text formats
export function extractPageId(text: string): string {
  if (!text) return ''
  
  // Look for patterns that might be Facebook page IDs (typically numeric)
  const pageIdMatch = text.match(/\b\d{10,20}\b/) // Page IDs are usually 10-20 digits
  if (pageIdMatch) {
    return pageIdMatch[0]
  }
  
  // If it's a clean string that looks like an ID, return it
  const cleanText = text.trim()
  if (/^\d+$/.test(cleanText) && cleanText.length >= 10) {
    return cleanText
  }
  
  return ''
}

// Main function to populate Meta campaign data from form
export function populateMetaCampaignFromForm(
  formData: StructuredData,
  currentCampaignData: Partial<FacebookCampaignData>
): Partial<FacebookCampaignData> {
  if (!formData?.formData) return currentCampaignData
  
  const populatedData = { ...currentCampaignData }
  
  // Campaign Name
  const campaignNameFromForm = findAnswerByQuestion(formData.formData, [
    'campaign name', 
    'name of campaign',
    'campaign title',
    'ad name',
    'advertisement name',
    'marketing campaign name'
  ])
  if (campaignNameFromForm) {
    populatedData.name = campaignNameFromForm
  }

  // Campaign Objective
  const objectiveFromForm = findAnswerByQuestion(formData.formData, [
    'objective',
    'goal',
    'key result',
    'kpi',
    'target',
    'purpose',
    'primary objective',
    'campaign objective',
    'marketing objective'
  ])
  if (objectiveFromForm) {
    populatedData.objective = mapObjectiveToMetaCampaignType(objectiveFromForm)
  }

  // Note: Budget will be handled in the main populate function after we have platform selection
  
  return populatedData
}

// Main function to populate Meta ad set data from form
export function populateMetaAdSetFromForm(
  formData: StructuredData,
  currentAdSetData: Partial<Omit<FacebookAdSetData, 'campaign_id'>>,
  campaignObjective?: FacebookCampaignObjective
): Partial<Omit<FacebookAdSetData, 'campaign_id'>> {
  if (!formData?.formData) return currentAdSetData
  
  const populatedData = { ...currentAdSetData }

  // In meta-autopopulate-utils.ts, add this at the start of populateMetaAdSetFromForm
  console.log('🔍 Form data questions:', formData.formData?.map(item => ({
    question: item.question,
    answer: item.answer
  })))
  
  // Ad Set Name (can derive from campaign name if not found specifically)
  const adSetNameFromForm = findAnswerByQuestion(formData.formData, [
    'ad set name',
    'adset name',
    'ad name',
    'campaign name', // Fallback to campaign name
    'advertisement name'
  ])
  if (adSetNameFromForm) {
    // Add "Ad Set" suffix if it's derived from campaign name
    const hasAdSetInName = adSetNameFromForm.toLowerCase().includes('ad set') || adSetNameFromForm.toLowerCase().includes('adset')
    populatedData.name = hasAdSetInName ? adSetNameFromForm : `${adSetNameFromForm} - Ad Set`
  }

  // Geographic Targeting
  const geographyFromForm = findAnswerByQuestion(formData.formData, [
    'geography',
    'target geography',
    'target geographies',
    'location',
    'country',
    'countries',
    'region',
    'target location',
    'target region'
  ])
  if (geographyFromForm) {
    const countries = mapGeographyToCountries(geographyFromForm)
    if (populatedData.targeting) {
      populatedData.targeting = {
        ...populatedData.targeting,
        geo_locations: {
          ...populatedData.targeting.geo_locations,
          countries
        }
      }
    } else {
      populatedData.targeting = {
        ...DEFAULT_ADSET_VALUES.targeting!,
        geo_locations: {
          countries
        }
      }
    }
  }

  // Age Targeting - WITH DEBUGGING
  console.log('🔍 AGE DEBUG - Starting age extraction...')
  
  const ageFromForm = findAnswerByQuestion(formData.formData, [
    'target audience age range',  // Most specific first
    'audience age range',
    'age range',
    'target age',
    'audience age',
    'demographic',
    'age group'
    // Removed generic 'age' to prevent matching 'agency'
  ])
  
  console.log('🔍 AGE DEBUG - Age answer found:', ageFromForm)
  
  if (ageFromForm) {
    console.log('🔍 AGE DEBUG - Parsing age range:', ageFromForm)
    const ageRange = parseAgeRange(ageFromForm)
    console.log('🔍 AGE DEBUG - Parsed age range:', ageRange)
    
    if (ageRange.age_min || ageRange.age_max) {
      console.log('🔍 AGE DEBUG - Age range valid, updating targeting...')
      console.log('🔍 AGE DEBUG - Current targeting before update:', populatedData.targeting)
      
      if (populatedData.targeting) {
        populatedData.targeting = {
          ...populatedData.targeting,
          age_min: ageRange.age_min || populatedData.targeting.age_min || DEFAULT_ADSET_VALUES.targeting!.age_min,
          age_max: ageRange.age_max || populatedData.targeting.age_max || DEFAULT_ADSET_VALUES.targeting!.age_max
        }
      } else {
        populatedData.targeting = {
          ...DEFAULT_ADSET_VALUES.targeting!,
          age_min: ageRange.age_min || DEFAULT_ADSET_VALUES.targeting!.age_min,
          age_max: ageRange.age_max || DEFAULT_ADSET_VALUES.targeting!.age_max
        }
      }
      
      console.log('🔍 AGE DEBUG - Updated targeting:', populatedData.targeting)
    } else {
      console.log('❌ AGE DEBUG - Age range not valid')
    }
  } else {
    console.log('❌ AGE DEBUG - No age answer found')
    
    // Let's check what questions contain "age"
    const ageQuestions = formData.formData.filter(item => 
      item.question.toLowerCase().includes('age')
    )
    console.log('🔍 AGE DEBUG - Questions containing "age":', ageQuestions)
    
    // Let's also check the findAnswerByQuestion function step by step
    console.log('🔍 AGE DEBUG - Testing search terms individually:')
    const searchTerms = ['age', 'age range', 'target age', 'audience age', 'demographic', 'age group']
    searchTerms.forEach(term => {
      const found = formData.formData.find(item => 
        item.question.toLowerCase().includes(term.toLowerCase())
      )
      console.log(`  - "${term}": ${found ? `Found: "${found.question}" = "${found.answer}"` : 'Not found'}`)
    })
  }

  // Publisher Platforms - Use the publisher platform utility
  const publisherPlatforms = getPublisherPlatformsForAutoPopulate(formData)
  if (publisherPlatforms.length > 0) {
    if (populatedData.targeting) {
      populatedData.targeting = {
        ...populatedData.targeting,
        publisher_platforms: publisherPlatforms
      }
    } else {
      populatedData.targeting = {
        ...DEFAULT_ADSET_VALUES.targeting!,
        publisher_platforms: publisherPlatforms
      }
    }
  }

  // Start Date
  const startDateFromForm = findAnswerByQuestion(formData.formData, [
    'start date',
    'campaign start',
    'begin date',
    'launch date',
    'go live date',
    'start time'
  ])
  if (startDateFromForm) {
    const parsedStartDate = parseDateFromForm(startDateFromForm)
    if (parsedStartDate) {
      populatedData.start_time = parsedStartDate
    }
  }

  // End Date
  const endDateFromForm = findAnswerByQuestion(formData.formData, [
    'end date',
    'campaign end',
    'finish date',
    'completion date',
    'close date',
    'end time'
  ])
  if (endDateFromForm) {
    const parsedEndDate = parseDateFromForm(endDateFromForm)
    if (parsedEndDate) {
      populatedData.end_time = parsedEndDate
    }
  }

  // App Promotion specific fields (only if campaign objective is APP_PROMOTION)
  if (campaignObjective === 'APP_PROMOTION') {
    // Application ID
    const appIdFromForm = findAnswerByQuestion(formData.formData, [
      'application id',
      'app id',
      'facebook app id',
      'mobile app id'
    ])
    if (appIdFromForm) {
      const extractedAppId = extractApplicationId(appIdFromForm)
      if (extractedAppId) {
        populatedData.application_id = extractedAppId
      }
    }

    // App Store URL
    const appUrlFromForm = findAnswerByQuestion(formData.formData, [
      'app store url',
      'app url',
      'store url',
      'download url',
      'app link',
      'application url'
    ])
    if (appUrlFromForm) {
      // Validate it looks like a URL
      if (appUrlFromForm.includes('http') || appUrlFromForm.includes('play.google.com') || appUrlFromForm.includes('apps.apple.com')) {
        populatedData.object_store_url = appUrlFromForm
      }
    }
  }

  // Lead Generation specific fields (only if campaign objective is LEAD_GENERATION)
  if (campaignObjective === 'LEAD_GENERATION') {
    // Facebook Page ID
    const pageIdFromForm = findAnswerByQuestion(formData.formData, [
      'page id',
      'facebook page id',
      'fb page id',
      'page identifier'
    ])
    if (pageIdFromForm) {
      const extractedPageId = extractPageId(pageIdFromForm)
      if (extractedPageId) {
        populatedData.page_id = extractedPageId
      }
    }
  }

  return populatedData
}

// Combined function to populate both campaign and ad set data
export function populateMetaFormFromFormData(
  formData: StructuredData,
  currentCampaignData: Partial<FacebookCampaignData>,
  currentAdSetData: Partial<Omit<FacebookAdSetData, 'campaign_id'>>
): {
  campaignData: Partial<FacebookCampaignData>
  adSetData: Partial<Omit<FacebookAdSetData, 'campaign_id'>>
  populatedFields: string[]
} {
  const populatedFields: string[] = []
  
  // Populate campaign data
  const originalCampaignData = { ...currentCampaignData }
  const newCampaignData = populateMetaCampaignFromForm(formData, currentCampaignData)
  
  // Track what campaign fields were populated
  if (newCampaignData.name !== originalCampaignData.name && newCampaignData.name) {
    populatedFields.push('Campaign Name')
  }
  if (newCampaignData.objective !== originalCampaignData.objective && newCampaignData.objective) {
    populatedFields.push('Campaign Objective')
  }

  // Populate ad set data
  const originalAdSetData = { ...currentAdSetData }
  const newAdSetData = populateMetaAdSetFromForm(formData, currentAdSetData, newCampaignData.objective)
  
  // Track what ad set fields were populated
  if (newAdSetData.name !== originalAdSetData.name && newAdSetData.name) {
    populatedFields.push('Ad Set Name')
  }
  if (newAdSetData.targeting?.geo_locations?.countries && 
      JSON.stringify(newAdSetData.targeting.geo_locations.countries) !== JSON.stringify(originalAdSetData.targeting?.geo_locations?.countries)) {
    populatedFields.push('Target Countries')
  }
  if ((newAdSetData.targeting?.age_min !== originalAdSetData.targeting?.age_min) || 
      (newAdSetData.targeting?.age_max !== originalAdSetData.targeting?.age_max)) {
    populatedFields.push('Age Range')
  }
  // Track publisher platforms changes
  if (newAdSetData.targeting?.publisher_platforms && 
      JSON.stringify(newAdSetData.targeting.publisher_platforms) !== JSON.stringify(originalAdSetData.targeting?.publisher_platforms)) {
    populatedFields.push('Publisher Platforms')
  }
  if (newAdSetData.start_time !== originalAdSetData.start_time && newAdSetData.start_time) {
    populatedFields.push('Start Date')
  }
  if (newAdSetData.end_time !== originalAdSetData.end_time && newAdSetData.end_time) {
    populatedFields.push('End Date')
  }
  if (newAdSetData.application_id !== originalAdSetData.application_id && newAdSetData.application_id) {
    populatedFields.push('Application ID')
  }
  if (newAdSetData.object_store_url !== originalAdSetData.object_store_url && newAdSetData.object_store_url) {
    populatedFields.push('App Store URL')
  }
  if (newAdSetData.page_id !== originalAdSetData.page_id && newAdSetData.page_id) {
    populatedFields.push('Facebook Page ID')
  }

  // NEW: Handle budget allocation after we have platform selection
  const selectedPlatforms = newAdSetData.targeting?.publisher_platforms || []
  
  console.log('🔍 Budget Debug - Selected platforms:', selectedPlatforms)
  
  if (selectedPlatforms.length > 0) {
    const budgetInfo = extractMetaBudgetFromForm(formData, selectedPlatforms)
    
    console.log('💰 Budget Debug - Extracted budget info:', {
      budgetType: budgetInfo.budgetType,
      totalBudget: budgetInfo.totalBudget,
      allocatedBudget: budgetInfo.allocatedBudget,
      allocatedBudgetCents: budgetInfo.allocatedBudgetCents,
      platformGroups: budgetInfo.platformGroups
    })
    
    if (budgetInfo.totalBudget > 0 && budgetInfo.allocatedBudgetCents > 0) {
      console.log('✅ Budget Debug - Setting budget in campaign data')
      
      // Set budget type
      newCampaignData.budget_type = budgetInfo.budgetType
      
      // Set the appropriate budget field based on type
      if (budgetInfo.budgetType === 'LIFETIME') {
        newCampaignData.lifetime_budget = budgetInfo.allocatedBudgetCents
        newCampaignData.daily_budget = undefined
        console.log(`📊 Budget Debug - Set lifetime budget: ${budgetInfo.allocatedBudgetCents} cents`)
      } else {
        newCampaignData.daily_budget = budgetInfo.allocatedBudgetCents
        newCampaignData.lifetime_budget = undefined
        console.log(`📊 Budget Debug - Set daily budget: ${budgetInfo.allocatedBudgetCents} cents`)
      }
      
      // Track budget field as populated
      const budgetLabel = budgetInfo.budgetType === 'LIFETIME' ? 'Lifetime Budget' : 'Daily Budget'
      populatedFields.push(budgetLabel)
    } else {
      console.log('❌ Budget Debug - Budget conditions not met:', {
        totalBudgetCondition: budgetInfo.totalBudget > 0,
        allocatedBudgetCondition: budgetInfo.allocatedBudgetCents > 0
      })
    }
  } else {
    console.log('❌ Budget Debug - No platforms selected, skipping budget allocation')
  }

  return {
    campaignData: newCampaignData,
    adSetData: newAdSetData,
    populatedFields
  }
}