// LinkedIn Geo and Locale Mapping Utilities
// This file provides correct LinkedIn URNs for targeting

export interface LinkedInGeoMapping {
    country: string
    name: string
    geoUrn: string
    supportedCurrencies: string[]
    supportedLocales: string[]
  }
  
  // LinkedIn geo URNs and supported locales mapping
  // Note: LinkedIn targeting requires interface locale to match campaign locale exactly
  // LinkedIn primarily supports core locales (en_US, de_DE, fr_FR) not regional variants
  export const LINKEDIN_GEO_MAPPINGS: Record<string, LinkedInGeoMapping> = {
    'US': {
      country: 'US',
      name: 'United States',
      geoUrn: 'urn:li:geo:103644278',
      supportedCurrencies: ['USD'],
      supportedLocales: ['en_US'] // LinkedIn's primary supported locale
    },
    'GB': {
      country: 'GB',
      name: 'United Kingdom',
      geoUrn: 'urn:li:geo:101165590',
      supportedCurrencies: ['USD'], // Account currency constraint - most LinkedIn accounts are USD
      supportedLocales: ['en_US'] // LinkedIn fallback - GB uses en_US locale for targeting
    },
    'CA': {
      country: 'CA',
      name: 'Canada',
      geoUrn: 'urn:li:geo:101174742',
      supportedCurrencies: ['USD'], // Account currency constraint
      supportedLocales: ['en_US'] // LinkedIn fallback - CA uses en_US locale for targeting
    },
    'AU': {
      country: 'AU',
      name: 'Australia',
      geoUrn: 'urn:li:geo:101452733',
      supportedCurrencies: ['USD'], // Account currency constraint
      supportedLocales: ['en_US'] // LinkedIn fallback - AU uses en_US locale for targeting
    },
    'DE': {
      country: 'DE',
      name: 'Germany',
      geoUrn: 'urn:li:geo:101282230',
      supportedCurrencies: ['USD'], // Account currency constraint
      supportedLocales: ['de_DE', 'en_US'] // German locale supported, English fallback
    },
    'FR': {
      country: 'FR',
      name: 'France',
      geoUrn: 'urn:li:geo:105015875',
      supportedCurrencies: ['USD'], // Account currency constraint
      supportedLocales: ['fr_FR', 'en_US'] // French locale supported, English fallback
    }
  }
  
  /**
   * Get LinkedIn geo URN for a country
   */
  export function getLinkedInGeoUrn(country: string): string {
    const mapping = LINKEDIN_GEO_MAPPINGS[country.toUpperCase()]
    return mapping?.geoUrn || LINKEDIN_GEO_MAPPINGS['US'].geoUrn // Fallback to US
  }
  
  /**
   * Get supported LinkedIn locale for country and language combination
   * NOTE: LinkedIn requires targeting interfaceLocales to match campaign locale exactly
   * LinkedIn primarily supports core locales (en_US, de_DE, fr_FR) not regional variants
   */
  export function getLinkedInSupportedLocale(country: string, language: string): string {
    const mapping = LINKEDIN_GEO_MAPPINGS[country.toUpperCase()]
    if (!mapping) return 'en_US' // Fallback
    
    // For German language, try to use de_DE if available
    if (language.toLowerCase() === 'de' && mapping.supportedLocales.includes('de_DE')) {
      return 'de_DE'
    }
    
    // For French language, try to use fr_FR if available  
    if (language.toLowerCase() === 'fr' && mapping.supportedLocales.includes('fr_FR')) {
      return 'fr_FR'
    }
    
    // For all English-speaking countries and other languages, use en_US
    // This is because LinkedIn doesn't support regional variants like en_GB, en_CA, en_AU
    return 'en_US'
  }
  
  /**
   * Check if currency is supported for the country
   * NOTE: Most LinkedIn ad accounts are USD-only regardless of geography
   */
  export function isCurrencySupportedForCountry(currency: string, country: string): boolean {
    const mapping = LINKEDIN_GEO_MAPPINGS[country.toUpperCase()]
    return mapping?.supportedCurrencies.includes(currency.toUpperCase()) || false
  }
  
  /**
   * Get primary currency for a country  
   * NOTE: Returns USD for most countries due to LinkedIn account constraints
   */
  export function getPrimaryCurrencyForCountry(country: string): string {
    const mapping = LINKEDIN_GEO_MAPPINGS[country.toUpperCase()]
    return mapping?.supportedCurrencies[0] || 'USD'
  }
  
  /**
   * Get all supported currencies for a country
   * NOTE: Most LinkedIn ad accounts only support USD regardless of target geography
   */
  export function getSupportedCurrenciesForCountry(country: string): string[] {
    const mapping = LINKEDIN_GEO_MAPPINGS[country.toUpperCase()]
    return mapping?.supportedCurrencies || ['USD']
  }
  
  /**
   * Validate and suggest corrections for geo/locale/currency combinations
   * NOTE: LinkedIn has strict account currency constraints and interface locale requirements
   */
  export function validateLinkedInTargeting(
    country: string, 
    language: string, 
    currency: string
  ): {
    isValid: boolean
    corrections: {
      geoUrn: string
      locale: string
      suggestedCurrency?: string
    }
    warnings: string[]
  } {
    const warnings: string[] = []
    const geoUrn = getLinkedInGeoUrn(country)
    const locale = getLinkedInSupportedLocale(country, language)
    
    let suggestedCurrency: string | undefined
    
    // LinkedIn account currency constraint - most accounts are USD
    if (currency !== 'USD') {
      suggestedCurrency = 'USD'
      warnings.push(
        `Most LinkedIn ad accounts use USD currency. If campaign creation fails with currency mismatch, the account is likely USD-only.`
      )
    }
    
    // Check if locale was adjusted from regional variant
    const requestedLocale = `${language}_${country.toUpperCase()}`
    if (locale !== requestedLocale) {
      if (country === 'GB' || country === 'CA' || country === 'AU') {
        warnings.push(
          `LinkedIn doesn't support ${requestedLocale} locale. Using ${locale} for targeting (English-speaking countries use en_US).`
        )
      } else {
        warnings.push(
          `Locale adjusted from ${requestedLocale} to ${locale} (LinkedIn supported locale).`
        )
      }
    }
    
    return {
      isValid: warnings.length === 0,
      corrections: {
        geoUrn,
        locale,
        suggestedCurrency
      },
      warnings
    }
  }