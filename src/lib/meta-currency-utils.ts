// Currency detection and formatting utilities for Meta campaign forms

// Define interfaces for form data (consistent with existing utils)
interface FormQuestion {
    question: string;
    answer: string;
  }
  
  interface StructuredData {
    rawText: string;
    formData: FormQuestion[];
  }
  
  // Supported currencies
  export type SupportedCurrency = 'USD' | 'GBP' | 'EUR'
  
  // Currency configuration
  export interface CurrencyConfig {
    code: SupportedCurrency
    symbol: string
    name: string
    position: 'before' | 'after' // Where to place the symbol
  }
  
  // Currency configurations
  export const CURRENCY_CONFIGS: Record<SupportedCurrency, CurrencyConfig> = {
    USD: {
      code: 'USD',
      symbol: '$',
      name: 'US Dollar',
      position: 'before'
    },
    GBP: {
      code: 'GBP',
      symbol: '£',
      name: 'British Pound',
      position: 'before'
    },
    EUR: {
      code: 'EUR',
      symbol: '€',
      name: 'Euro',
      position: 'before'
    }
  }
  
  // Currency detection patterns
  const CURRENCY_PATTERNS = {
    // Currency codes (case insensitive)
    codes: {
      'USD': 'USD',
      'DOLLAR': 'USD',
      'DOLLARS': 'USD',
      'US DOLLAR': 'USD',
      'US DOLLARS': 'USD',
      
      'GBP': 'GBP',
      'POUND': 'GBP',
      'POUNDS': 'GBP',
      'BRITISH POUND': 'GBP',
      'BRITISH POUNDS': 'GBP',
      'STERLING': 'GBP',
      
      'EUR': 'EUR',
      'EURO': 'EUR',
      'EUROS': 'EUR'
    },
    
    // Currency symbols
    symbols: {
      '$': 'USD',
      '£': 'GBP',
      '€': 'EUR'
    }
  } as const
  
  // Helper function to find answers by question keywords (consistent with existing utils)
  function findAnswerByQuestion(formData: FormQuestion[], searchTerms: string[]): string {
    if (!formData) return ''
    
    // First, try exact matches (case insensitive)
    for (const term of searchTerms) {
      const exactMatch = formData.find(item => 
        item.question.toLowerCase() === term.toLowerCase()
      )
      if (exactMatch) {
        console.log(`🎯 Currency - Exact match found for "${term}":`, exactMatch.question, '=', exactMatch.answer)
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
      console.log(`🔍 Currency - Partial match found:`, found.question, '=', found.answer)
    }
    
    return found?.answer || ''
  }
  
  /**
   * Detects currency from form data by looking at budget-related answers
   * @param formData - The structured form submission data
   * @returns Detected currency code or 'USD' as fallback
   */
  export function detectCurrencyFromForm(formData: StructuredData): SupportedCurrency {
    if (!formData?.formData) {
      console.log('💱 Currency Detection - No form data available, defaulting to USD')
      return 'USD'
    }
    
    console.log('🔍 Currency Detection - Starting analysis...')
    
    // Look for currency in budget-related fields
    const budgetAnswer = findAnswerByQuestion(formData.formData, [
      'budget amount',
      'total budget',
      'campaign budget',
      'budget',
      'cost',
      'investment',
      'spend',
      'currency'
    ])
    
    console.log('💰 Currency Detection - Budget answer found:', budgetAnswer)
    
    if (budgetAnswer) {
      const detectedCurrency = extractCurrencyFromText(budgetAnswer)
      if (detectedCurrency) {
        console.log('✅ Currency Detection - Found currency in budget answer:', detectedCurrency)
        return detectedCurrency
      }
    }
    
    // Look for currency in any other field that might contain budget information
    const allAnswers = formData.formData.map(item => item.answer).join(' ')
    console.log('🔍 Currency Detection - Checking all answers for currency indicators...')
    
    const fallbackDetection = extractCurrencyFromText(allAnswers)
    if (fallbackDetection) {
      console.log('✅ Currency Detection - Found currency in general form data:', fallbackDetection)
      return fallbackDetection
    }
    
    console.log('⚠️ Currency Detection - No currency found, defaulting to USD')
    return 'USD'
  }
  
  /**
   * Extracts currency from a text string by looking for symbols and codes
   * @param text - Text to analyze for currency indicators
   * @returns Detected currency code or null if not found
   */
  export function extractCurrencyFromText(text: string): SupportedCurrency | null {
    if (!text) return null
    
    const upperText = text.toUpperCase()
    
    // First check for currency symbols (most reliable)
    for (const [symbol, currency] of Object.entries(CURRENCY_PATTERNS.symbols)) {
      if (text.includes(symbol)) {
        console.log(`💱 Currency Extraction - Found symbol "${symbol}" → ${currency}`)
        return currency as SupportedCurrency
      }
    }
    
    // Then check for currency codes/names
    for (const [pattern, currency] of Object.entries(CURRENCY_PATTERNS.codes)) {
      if (upperText.includes(pattern)) {
        console.log(`💱 Currency Extraction - Found pattern "${pattern}" → ${currency}`)
        return currency as SupportedCurrency
      }
    }
    
    return null
  }
  
  /**
   * Gets the currency symbol for a given currency code
   * @param currency - Currency code
   * @returns Currency symbol
   */
  export function getCurrencySymbol(currency: SupportedCurrency): string {
    return CURRENCY_CONFIGS[currency].symbol
  }
  
  /**
   * Gets the currency name for a given currency code
   * @param currency - Currency code
   * @returns Currency name
   */
  export function getCurrencyName(currency: SupportedCurrency): string {
    return CURRENCY_CONFIGS[currency].name
  }
  
  /**
   * Formats a budget amount with the appropriate currency symbol
   * @param amount - Numeric amount
   * @param currency - Currency code
   * @param showCode - Whether to show currency code alongside symbol
   * @returns Formatted currency string
   */
  export function formatCurrencyAmount(
    amount: number, 
    currency: SupportedCurrency,
    showCode: boolean = false
  ): string {
    const config = CURRENCY_CONFIGS[currency]
    const formattedAmount = amount.toFixed(2)
    
    const currencyDisplay = showCode ? `${config.symbol} (${config.code})` : config.symbol
    
    if (config.position === 'before') {
      return `${currencyDisplay}${formattedAmount}`
    } else {
      return `${formattedAmount}${currencyDisplay}`
    }
  }
  
  /**
   * Gets the currency label for form fields (e.g., "Budget (GBP)")
   * @param currency - Currency code
   * @param showSymbol - Whether to include the symbol
   * @returns Currency label for forms
   */
  export function getCurrencyLabel(currency: SupportedCurrency, showSymbol: boolean = false): string {
    const config = CURRENCY_CONFIGS[currency]
    
    if (showSymbol) {
      return `(${config.symbol} ${config.code})`
    } else {
      return `(${config.code})`
    }
  }
  
  /**
   * Checks if a currency code is supported
   * @param currency - Currency code to check
   * @returns True if currency is supported
   */
  export function isSupportedCurrency(currency: string): currency is SupportedCurrency {
    return currency in CURRENCY_CONFIGS
  }
  
  /**
   * Gets the default currency
   * @returns Default currency code
   */
  export function getDefaultCurrency(): SupportedCurrency {
    return 'USD'
  }
  
  /**
   * Gets all supported currencies
   * @returns Array of supported currency configurations
   */
  export function getSupportedCurrencies(): CurrencyConfig[] {
    return Object.values(CURRENCY_CONFIGS)
  }
  
  /**
   * Validates and normalizes a currency code
   * @param currency - Currency code to validate
   * @returns Normalized currency code or default if invalid
   */
  export function validateAndNormalizeCurrency(currency: string): SupportedCurrency {
    const upperCurrency = currency.toUpperCase()
    
    if (isSupportedCurrency(upperCurrency)) {
      return upperCurrency
    }
    
    console.warn(`⚠️ Currency Validation - Unsupported currency "${currency}", defaulting to USD`)
    return getDefaultCurrency()
  }
  
  /**
   * Debug function to analyze form data for currency information
   * @param formData - The structured form submission data
   * @returns Debug information about currency detection
   */
  export function debugCurrencyDetection(formData: StructuredData): {
    detectedCurrency: SupportedCurrency
    budgetFields: Array<{ question: string; answer: string; detectedCurrency: SupportedCurrency | null }>
    allCurrencyMentions: string[]
  } {
    const detectedCurrency = detectCurrencyFromForm(formData)
    
    const budgetFields = formData.formData
      ?.filter(item => {
        const question = item.question.toLowerCase()
        return question.includes('budget') || 
               question.includes('cost') || 
               question.includes('spend') ||
               question.includes('currency') ||
               question.includes('investment')
      })
      .map(item => ({
        question: item.question,
        answer: item.answer,
        detectedCurrency: extractCurrencyFromText(item.answer)
      })) || []
    
    const allCurrencyMentions: string[] = []
    formData.formData?.forEach(item => {
      // Check for any currency symbols or codes in answers
      const currencyFound = extractCurrencyFromText(item.answer)
      if (currencyFound) {
        allCurrencyMentions.push(`${item.question}: ${item.answer} (${currencyFound})`)
      }
    })
    
    return {
      detectedCurrency,
      budgetFields,
      allCurrencyMentions
    }
  }