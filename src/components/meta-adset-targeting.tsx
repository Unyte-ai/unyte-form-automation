import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { 
  FacebookPublisherPlatform,
  FacebookTargeting,
  COMMON_COUNTRIES,
  PUBLISHER_PLATFORMS,
  DEFAULT_ADSET_VALUES
} from '@/lib/facebook-campaign-utils'

interface MetaAdSetTargetingProps {
  targeting: FacebookTargeting
  onChange: (targeting: FacebookTargeting) => void
  errors?: {
    countries?: string
    age_min?: string
    age_max?: string
    publisher_platforms?: string
  }
}

export function MetaAdSetTargeting({ targeting, onChange, errors }: MetaAdSetTargetingProps) {
  // Handle targeting changes - separate functions for type safety
  const handleCountriesChange = (countries: string[]) => {
    onChange({
      ...targeting,
      geo_locations: {
        ...targeting.geo_locations,
        countries
      }
    })
  }

  const handleAgeChange = (field: 'age_min' | 'age_max', age: number) => {
    onChange({
      ...targeting,
      [field]: age
    })
  }

  const handlePublisherPlatformsChange = (platforms: FacebookPublisherPlatform[]) => {
    onChange({
      ...targeting,
      publisher_platforms: platforms
    })
  }

  // Add country to targeting
  const addCountry = (countryCode: string) => {
    const currentCountries = targeting.geo_locations?.countries || DEFAULT_ADSET_VALUES.targeting!.geo_locations.countries
    if (!currentCountries.includes(countryCode)) {
      handleCountriesChange([...currentCountries, countryCode])
    }
  }

  // Remove country from targeting
  const removeCountry = (countryCode: string) => {
    const currentCountries = targeting.geo_locations?.countries || DEFAULT_ADSET_VALUES.targeting!.geo_locations.countries
    handleCountriesChange(currentCountries.filter((c: string) => c !== countryCode))
  }

  // Toggle publisher platform
  const togglePublisherPlatform = (platform: string) => {
    const currentPlatforms = targeting.publisher_platforms || DEFAULT_ADSET_VALUES.targeting!.publisher_platforms
    if (currentPlatforms.includes(platform as FacebookPublisherPlatform)) {
      handlePublisherPlatformsChange(currentPlatforms.filter((p: FacebookPublisherPlatform) => p !== platform))
    } else {
      handlePublisherPlatformsChange([...currentPlatforms, platform as FacebookPublisherPlatform])
    }
  }

  const selectedCountries = targeting.geo_locations?.countries || DEFAULT_ADSET_VALUES.targeting!.geo_locations.countries
  const selectedPlatforms = targeting.publisher_platforms || DEFAULT_ADSET_VALUES.targeting!.publisher_platforms

  return (
    <div className="space-y-4">
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
            {selectedCountries.map((countryCode: string) => {
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
            value={targeting.age_min || DEFAULT_ADSET_VALUES.targeting!.age_min}
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
            value={targeting.age_max || DEFAULT_ADSET_VALUES.targeting!.age_max}
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
        {/* Show selected platforms info or hint when none selected */}
        {selectedPlatforms.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Select at least one platform where you want your ads to appear. Use auto-populate to detect platforms from form data.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Your ads will appear on: {selectedPlatforms.map((p: FacebookPublisherPlatform) => PUBLISHER_PLATFORMS.find(plat => plat.value === p)?.label).join(', ')}
          </p>
        )}
        {errors?.publisher_platforms && (
          <p className="text-xs text-destructive">{errors.publisher_platforms}</p>
        )}
      </div>
    </div>
  )
}