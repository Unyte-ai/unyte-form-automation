import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { 
  FacebookAdSetData,
  FacebookCampaignObjective,
  FacebookPublisherPlatform,
  COMMON_COUNTRIES,
  PUBLISHER_PLATFORMS,
  DEFAULT_ADSET_VALUES
} from '@/lib/facebook-campaign-utils'

interface MetaAdSetFieldsProps {
  value: Partial<Omit<FacebookAdSetData, 'campaign_id'>>
  onChange: (value: Partial<Omit<FacebookAdSetData, 'campaign_id'>>) => void
  errors?: Record<string, string>
  campaignObjective?: FacebookCampaignObjective // Add campaign objective prop
}

export function MetaAdSetFields({ value, onChange, errors, campaignObjective }: MetaAdSetFieldsProps) {
  // Handle form field changes  
  const handleFieldChange = (field: keyof Omit<FacebookAdSetData, 'campaign_id'>, fieldValue: Omit<FacebookAdSetData, 'campaign_id'>[keyof Omit<FacebookAdSetData, 'campaign_id'>]) => {
    onChange({
      ...value,
      [field]: fieldValue
    })
  }

  // Handle targeting changes - separate functions for type safety
  const handleCountriesChange = (countries: string[]) => {
    const currentTargeting = value.targeting || DEFAULT_ADSET_VALUES.targeting!
    onChange({
      ...value,
      targeting: {
        ...currentTargeting,
        geo_locations: {
          ...currentTargeting.geo_locations,
          countries
        }
      }
    })
  }

  const handleAgeChange = (field: 'age_min' | 'age_max', age: number) => {
    const currentTargeting = value.targeting || DEFAULT_ADSET_VALUES.targeting!
    onChange({
      ...value,
      targeting: {
        ...currentTargeting,
        [field]: age
      }
    })
  }

  const handlePublisherPlatformsChange = (platforms: FacebookPublisherPlatform[]) => {
    const currentTargeting = value.targeting || DEFAULT_ADSET_VALUES.targeting!
    onChange({
      ...value,
      targeting: {
        ...currentTargeting,
        publisher_platforms: platforms
      }
    })
  }

  // Add country to targeting
  const addCountry = (countryCode: string) => {
    const currentCountries = value.targeting?.geo_locations?.countries || DEFAULT_ADSET_VALUES.targeting!.geo_locations.countries
    if (!currentCountries.includes(countryCode)) {
      handleCountriesChange([...currentCountries, countryCode])
    }
  }

  // Remove country from targeting
  const removeCountry = (countryCode: string) => {
    const currentCountries = value.targeting?.geo_locations?.countries || DEFAULT_ADSET_VALUES.targeting!.geo_locations.countries
    handleCountriesChange(currentCountries.filter(c => c !== countryCode))
  }

  // Toggle publisher platform
  const togglePublisherPlatform = (platform: string) => {
    const currentPlatforms = value.targeting?.publisher_platforms || DEFAULT_ADSET_VALUES.targeting!.publisher_platforms
    if (currentPlatforms.includes(platform as FacebookPublisherPlatform)) {
      handlePublisherPlatformsChange(currentPlatforms.filter(p => p !== platform))
    } else {
      handlePublisherPlatformsChange([...currentPlatforms, platform as FacebookPublisherPlatform])
    }
  }

  // Get formatted date for input (YYYY-MM-DD)
  const formatDateForInput = (isoString?: string): string => {
    if (!isoString) return ''
    return new Date(isoString).toISOString().split('T')[0]
  }

  // Handle date change
  const handleDateChange = (field: 'start_time' | 'end_time', dateString: string) => {
    if (!dateString) {
      handleFieldChange(field, '')
      return
    }
    
    // Convert to ISO string for storage
    const date = new Date(dateString)
    date.setHours(0, 0, 0, 0) // Set to start of day
    handleFieldChange(field, date.toISOString())
  }

  const selectedCountries = value.targeting?.geo_locations?.countries || DEFAULT_ADSET_VALUES.targeting!.geo_locations.countries
  const selectedPlatforms = value.targeting?.publisher_platforms || DEFAULT_ADSET_VALUES.targeting!.publisher_platforms

  // Show app promotion fields when campaign objective is APP_PROMOTION
  const showAppPromotionFields = campaignObjective === 'APP_PROMOTION'
  
  // Show lead generation fields when campaign objective is LEAD_GENERATION
  const showLeadGenerationFields = campaignObjective === 'LEAD_GENERATION'

  return (
    <div className="space-y-4">
      {/* Ad Set Name */}
      <div className="grid gap-2">
        <Label htmlFor="adset-name">Ad Set Name *</Label>
        <Input
          id="adset-name"
          value={value.name || ''}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          placeholder="Enter ad set name"
          className={errors?.name ? 'border-destructive' : ''}
        />
        {errors?.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Budget Notice */}
      <div className="p-3 rounded-md bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
        <p className="text-blue-800 dark:text-blue-300 text-sm">
          <strong>Budget:</strong> This ad set will use the campaign budget. 
          Facebook will automatically distribute the campaign budget across all ad sets.
        </p>
      </div>

      {/* App Promotion Fields - Only show when objective is APP_PROMOTION */}
      {showAppPromotionFields && (
        <div className="space-y-4 p-4 rounded-md bg-purple-50 border border-purple-200 dark:bg-purple-950/20 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-sm text-purple-800 dark:text-purple-300">App Promotion Settings</h4>
          </div>
          
          {/* Application ID */}
          <div className="grid gap-2">
            <Label htmlFor="application-id">Application ID *</Label>
            <Input
              id="application-id"
              value={value.application_id || ''}
              onChange={(e) => handleFieldChange('application_id', e.target.value)}
              placeholder="Enter your app's Facebook application ID"
              className={errors?.application_id ? 'border-destructive' : ''}
            />
            {errors?.application_id && (
              <p className="text-xs text-destructive">{errors.application_id}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Your app&apos;s Facebook application ID (required for app promotion campaigns)
            </p>
          </div>

          {/* App Store URL */}
          <div className="grid gap-2">
            <Label htmlFor="object-store-url">App Store URL *</Label>
            <Input
              id="object-store-url"
              type="url"
              value={value.object_store_url || ''}
              onChange={(e) => handleFieldChange('object_store_url', e.target.value)}
              placeholder="https://apps.apple.com/... or https://play.google.com/..."
              className={errors?.object_store_url ? 'border-destructive' : ''}
            />
            {errors?.object_store_url && (
              <p className="text-xs text-destructive">{errors.object_store_url}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Direct link to your app in the App Store or Google Play
            </p>
          </div>
        </div>
      )}

      {/* Lead Generation Fields - Only show when objective is LEAD_GENERATION */}
      {showLeadGenerationFields && (
        <div className="space-y-4 p-4 rounded-md bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-sm text-green-800 dark:text-green-300">Lead Generation Settings</h4>
          </div>
          
          {/* Facebook Page ID */}
          <div className="grid gap-2">
            <Label htmlFor="page-id">Facebook Page ID *</Label>
            <Input
              id="page-id"
              value={value.page_id || ''}
              onChange={(e) => handleFieldChange('page_id', e.target.value)}
              placeholder="Enter your Facebook Page ID"
              className={errors?.page_id ? 'border-destructive' : ''}
            />
            {errors?.page_id && (
              <p className="text-xs text-destructive">{errors.page_id}</p>
            )}
            <p className="text-xs text-muted-foreground">
              The Facebook Page ID where leads will be collected (required for lead generation campaigns)
            </p>
          </div>
        </div>
      )}

      {/* Geographic Targeting */}
      <div className="grid gap-2">
        <Label>Target Countries *</Label>
        <Select onValueChange={addCountry}>
          <SelectTrigger className={errors?.countries ? 'border-destructive' : ''}>
            <SelectValue placeholder="Add countries to target" />
          </SelectTrigger>
          <SelectContent>
            {COMMON_COUNTRIES.map(country => (
              <SelectItem 
                key={country.value} 
                value={country.value}
                disabled={selectedCountries.includes(country.value)}
              >
                {country.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Selected Countries */}
        {selectedCountries.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedCountries.map(countryCode => {
              const country = COMMON_COUNTRIES.find(c => c.value === countryCode)
              return (
                <div key={countryCode} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                  {country?.label || countryCode}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-secondary-foreground/20"
                    onClick={() => removeCountry(countryCode)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}
        
        {errors?.countries && (
          <p className="text-xs text-destructive">{errors.countries}</p>
        )}
      </div>

      {/* Age Targeting */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="age-min">Minimum Age</Label>
          <Input
            id="age-min"
            type="number"
            min="13"
            max="99"
            value={value.targeting?.age_min || DEFAULT_ADSET_VALUES.targeting!.age_min}
            onChange={(e) => handleAgeChange('age_min', parseInt(e.target.value) || 13)}
            className={errors?.age_min ? 'border-destructive' : ''}
          />
          {errors?.age_min && (
            <p className="text-xs text-destructive">{errors.age_min}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="age-max">Maximum Age</Label>
          <Input
            id="age-max"
            type="number"
            min="13"
            max="99"
            value={value.targeting?.age_max || DEFAULT_ADSET_VALUES.targeting!.age_max}
            onChange={(e) => handleAgeChange('age_max', parseInt(e.target.value) || 65)}
            className={errors?.age_max ? 'border-destructive' : ''}
          />
          {errors?.age_max && (
            <p className="text-xs text-destructive">{errors.age_max}</p>
          )}
        </div>
      </div>

      {/* Publisher Platforms */}
      <div className="grid gap-2">
        <Label>Publisher Platforms *</Label>
        <div className="grid grid-cols-2 gap-2">
          {PUBLISHER_PLATFORMS.map(platform => (
            <label key={platform.value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedPlatforms.includes(platform.value as FacebookPublisherPlatform)}
                onChange={() => togglePublisherPlatform(platform.value)}
                className="rounded border border-input"
              />
              <span className="text-sm">{platform.label}</span>
            </label>
          ))}
        </div>
        {errors?.publisher_platforms && (
          <p className="text-xs text-destructive">{errors.publisher_platforms}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Select where you want your ads to appear
        </p>
      </div>

      {/* Ad Set Status */}
      <div className="grid gap-2">
        <Label htmlFor="adset-status">Ad Set Status</Label>
        <Select 
          value={value.status || DEFAULT_ADSET_VALUES.status} 
          onValueChange={(selectedValue) => handleFieldChange('status', selectedValue)}
        >
          <SelectTrigger id="adset-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PAUSED">Paused</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Ad sets start paused by default for safety
        </p>
      </div>

      {/* Schedule */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="start-date">Start Date *</Label>
          <Input
            id="start-date"
            type="date"
            value={formatDateForInput(value.start_time)}
            onChange={(e) => handleDateChange('start_time', e.target.value)}
            min={new Date().toISOString().split('T')[0]} // Can't start in the past
            className={errors?.start_time ? 'border-destructive' : ''}
          />
          {errors?.start_time && (
            <p className="text-xs text-destructive">{errors.start_time}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="end-date">End Date *</Label>
          <Input
            id="end-date"
            type="date"
            value={formatDateForInput(value.end_time)}
            onChange={(e) => handleDateChange('end_time', e.target.value)}
            min={formatDateForInput(value.start_time) || new Date().toISOString().split('T')[0]}
            className={errors?.end_time ? 'border-destructive' : ''}
          />
          {errors?.end_time && (
            <p className="text-xs text-destructive">{errors.end_time}</p>
          )}
        </div>
      </div>
    </div>
  )
}