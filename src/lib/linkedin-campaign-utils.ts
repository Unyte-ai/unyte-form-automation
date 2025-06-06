interface FormQuestion {
    question: string;
    answer: string;
  }
  
  interface StructuredData {
    rawText: string;
    formData: FormQuestion[];
  }
  
  /**
   * Find answer from form data by searching for specific question terms
   */
  export const findAnswerByQuestion = (
    formData: StructuredData | undefined,
    searchTerms: string[]
  ): string => {
    if (!formData?.formData) return ''
    
    const found = formData.formData.find(item => 
      searchTerms.some(term => 
        item.question.toLowerCase().includes(term.toLowerCase())
      )
    )
    return found?.answer || ''
  }
  
  /**
   * Parse date from form data string into YYYY-MM-DD format
   */
  export const parseDateFromForm = (dateString: string): string => {
    if (!dateString) return ''
    
    try {
      // Try to parse various date formats
      const date = new Date(dateString)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0] // Return YYYY-MM-DD format
      }
    } catch (error) {
      console.warn('Could not parse date:', dateString, error)
    }
    
    return ''
  }
  
  /**
   * Map objective from form data to LinkedIn campaign types
   */
  export const mapObjectiveToCampaignType = (
    objectiveString: string
  ): 'SPONSORED_UPDATES' | 'TEXT_AD' | 'SPONSORED_INMAILS' | 'DYNAMIC' => {
    if (!objectiveString) return 'SPONSORED_UPDATES'
    
    const lowerObjective = objectiveString.toLowerCase()
    
    if (lowerObjective.includes('awareness') || lowerObjective.includes('brand')) {
      return 'SPONSORED_UPDATES' // Good for brand awareness
    }
    if (lowerObjective.includes('engagement') || lowerObjective.includes('engage')) {
      return 'SPONSORED_UPDATES' // Good for engagement
    }
    if (lowerObjective.includes('job') || lowerObjective.includes('hiring') || lowerObjective.includes('recruit')) {
      return 'DYNAMIC' // Dynamic ads good for recruitment
    }
    if (lowerObjective.includes('lead') || lowerObjective.includes('generation')) {
      return 'SPONSORED_UPDATES' // Sponsored content good for lead gen
    }
    if (lowerObjective.includes('conversion') || lowerObjective.includes('convert')) {
      return 'SPONSORED_UPDATES' // Good for conversions
    }
    if (lowerObjective.includes('traffic') || lowerObjective.includes('visit') || lowerObjective.includes('website')) {
      return 'SPONSORED_UPDATES' // Good for traffic
    }
    if (lowerObjective.includes('video') || lowerObjective.includes('view')) {
      return 'SPONSORED_UPDATES' // Good for video content
    }
    if (lowerObjective.includes('message') || lowerObjective.includes('inmail') || lowerObjective.includes('direct')) {
      return 'SPONSORED_INMAILS' // For direct messaging
    }
    
    return 'SPONSORED_UPDATES' // Default fallback
  }
  
  /**
   * Map geography string to country code
   */
  export const mapGeographyToCountry = (geographyString: string): string => {
    if (!geographyString) return 'US'
    
    const lowerGeo = geographyString.toLowerCase()
    
    if (lowerGeo.includes('uk') || lowerGeo.includes('united kingdom') || lowerGeo.includes('britain') || lowerGeo.includes('england') || lowerGeo.includes('scotland') || lowerGeo.includes('wales')) {
      return 'GB'
    }
    if (lowerGeo.includes('canada') || lowerGeo.includes('canadian')) {
      return 'CA'
    }
    if (lowerGeo.includes('australia') || lowerGeo.includes('australian')) {
      return 'AU'
    }
    if (lowerGeo.includes('germany') || lowerGeo.includes('german') || lowerGeo.includes('deutschland')) {
      return 'DE'
    }
    if (lowerGeo.includes('france') || lowerGeo.includes('french') || lowerGeo.includes('français')) {
      return 'FR'
    }
    if (lowerGeo.includes('us') || lowerGeo.includes('usa') || lowerGeo.includes('united states') || lowerGeo.includes('america') || lowerGeo.includes('american')) {
      return 'US'
    }
    
    return 'US' // Default fallback
  }
  
  /**
   * Map language string to language code
   */
  export const mapLanguageCode = (languageString: string): string => {
    if (!languageString) return 'en'
    
    const lowerLang = languageString.toLowerCase()
    
    if (lowerLang.includes('french') || lowerLang.includes('français') || lowerLang.includes('fr')) {
      return 'fr'
    }
    if (lowerLang.includes('german') || lowerLang.includes('deutsch') || lowerLang.includes('de')) {
      return 'de'
    }
    if (lowerLang.includes('spanish') || lowerLang.includes('español') || lowerLang.includes('es')) {
      return 'es'
    }
    if (lowerLang.includes('english') || lowerLang.includes('en')) {
      return 'en'
    }
    
    return 'en' // Default fallback
  }