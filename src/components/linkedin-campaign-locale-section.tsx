import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  validateLinkedInTargeting, 
  LINKEDIN_GEO_MAPPINGS 
} from '@/lib/linkedin-geo-locale-utils'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface LinkedInCampaignLocaleSectionProps {
  country: string
  setCountry: (country: string) => void
  language: string
  setLanguage: (language: string) => void
  currency: string
  setCurrency: (currency: string) => void
}

export function LinkedInCampaignLocaleSection({
  country,
  setCountry,
  language,
  setLanguage,
  currency,
  setCurrency
}: LinkedInCampaignLocaleSectionProps) {
  // Validate current targeting combination
  const validation = validateLinkedInTargeting(country, language, currency)

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry)
    
    // Auto-adjust to USD for better LinkedIn compatibility  
    // Most LinkedIn ad accounts are USD-only regardless of geography
    if (currency !== 'USD') {
      setCurrency('USD')
    }
  }

  return (
    <>
      {/* Locale Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="country">Target Country</Label>
          <Select value={country} onValueChange={handleCountryChange}>
            <SelectTrigger id="country">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(LINKEDIN_GEO_MAPPINGS).map(mapping => (
                <SelectItem key={mapping.country} value={mapping.country}>
                  {mapping.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Geo-targeting for campaign delivery
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="language">Interface Language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger id="language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            User interface language preference
          </p>
        </div>
      </div>

      {/* Currency Selection with Validation */}
      <div className="grid gap-2">
        <Label htmlFor="currency">Campaign Currency</Label>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger id="currency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD (Recommended)</SelectItem>
            <SelectItem value="EUR">EUR (May require account match)</SelectItem>
            <SelectItem value="GBP">GBP (May require account match)</SelectItem>
            <SelectItem value="CAD">CAD (May require account match)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Most LinkedIn ad accounts use USD currency regardless of geography
        </p>
      </div>

      {/* Validation Status */}
      {validation.warnings.length > 0 ? (
        <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-300">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">LinkedIn Targeting Adjustments</p>
              {validation.warnings.map((warning, index) => (
                <p key={index} className="text-xs">{warning}</p>
              ))}
              {validation.corrections.suggestedCurrency && (
                <p className="text-xs font-medium">
                  💡 Tip: Switch to {validation.corrections.suggestedCurrency} to avoid currency mismatch errors.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-md bg-green-50 border border-green-200 text-green-800 dark:bg-green-950/20 dark:border-green-800 dark:text-green-300">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <p className="text-sm">Targeting configuration is optimal for LinkedIn!</p>
          </div>
        </div>
      )}

      {/* Targeting Preview */}
      <div className="p-3 rounded-md bg-gray-50 border border-gray-200 dark:bg-gray-900/50 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          LinkedIn Targeting Preview:
        </p>
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <p>• Target Location: {LINKEDIN_GEO_MAPPINGS[country]?.name || country}</p>
          <p>• Interface Locale: {validation.corrections.locale}</p>
          <p>• Campaign Currency: {currency}</p>
          {validation.corrections.locale === 'en_US' && (country === 'GB' || country === 'CA' || country === 'AU') && (
            <p className="text-amber-600 dark:text-amber-400">
              • Note: English-speaking countries use en_US locale in LinkedIn
            </p>
          )}
          {currency !== 'USD' && (
            <p className="text-amber-600 dark:text-amber-400">
              • Note: Most LinkedIn accounts require USD currency
            </p>
          )}
        </div>
      </div>
    </>
  )
}