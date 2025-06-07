import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { MetaAdSetTargeting } from '@/components/meta-adset-targeting'
import { MetaCampaignLockableField } from '@/components/meta-campaign-lockable-field'
import { 
  FacebookAdSetData,
  FacebookCampaignObjective,
  DEFAULT_ADSET_VALUES
} from '@/lib/facebook-campaign-utils'

interface OriginalMetaFormData {
  budgetType: string | null
  budgetAmount: string | null
  startDate: string | null
  endDate: string | null
}

interface MetaAdSetFieldsProps {
  value: Partial<Omit<FacebookAdSetData, 'campaign_id'>>
  onChange: (value: Partial<Omit<FacebookAdSetData, 'campaign_id'>>) => void
  errors?: Record<string, string>
  campaignObjective?: FacebookCampaignObjective
  
  // Individual lock states (following Google pattern)
  isStartDateLocked?: boolean
  isEndDateLocked?: boolean
  
  // Individual lock toggle handlers (following Google pattern)
  onToggleStartDateLock?: () => void
  onToggleEndDateLock?: () => void
  
  // Focus/blur handlers for blur confirmation
  onStartDateFocus?: () => void
  onStartDateBlur?: () => void
  onEndDateFocus?: () => void
  onEndDateBlur?: () => void
  
  // Original form data for display
  originalFormData?: OriginalMetaFormData
  disabled?: boolean
}

export function MetaAdSetFields({ 
  value, 
  onChange, 
  errors, 
  campaignObjective,
  
  // Individual lock props (following Google pattern)
  isStartDateLocked = false,
  isEndDateLocked = false,
  onToggleStartDateLock,
  onToggleEndDateLock,
  
  // Focus/blur handlers for blur confirmation
  onStartDateFocus,
  onStartDateBlur,
  onEndDateFocus,
  onEndDateBlur,
  
  // Original form data for display
  originalFormData,
  disabled = false
}: MetaAdSetFieldsProps) {
  // Handle form field changes  
  const handleFieldChange = (field: keyof Omit<FacebookAdSetData, 'campaign_id'>, fieldValue: Omit<FacebookAdSetData, 'campaign_id'>[keyof Omit<FacebookAdSetData, 'campaign_id'>]) => {
    onChange({
      ...value,
      [field]: fieldValue
    })
  }

  // Handle targeting changes
  const handleTargetingChange = (targeting: typeof DEFAULT_ADSET_VALUES.targeting) => {
    onChange({
      ...value,
      targeting
    })
  }

  // Get formatted date for input (YYYY-MM-DD) - avoid timezone issues
  const formatDateForInput = (isoString?: string): string => {
    if (!isoString) return ''
    // Extract just the date part from ISO string to avoid timezone conversion
    return isoString.split('T')[0]
  }

  // Handle date change - avoid timezone issues by parsing in UTC
  const handleDateChange = (field: 'start_time' | 'end_time', dateString: string) => {
    if (!dateString) {
      handleFieldChange(field, '')
      return
    }
    
    // Parse date in UTC to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10))
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
    handleFieldChange(field, date.toISOString())
  }

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
          disabled={disabled}
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
              disabled={disabled}
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
              disabled={disabled}
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
              disabled={disabled}
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

      {/* Targeting Section */}
      <MetaAdSetTargeting
        targeting={value.targeting || DEFAULT_ADSET_VALUES.targeting!}
        onChange={handleTargetingChange}
        errors={{
          countries: errors?.countries,
          age_min: errors?.age_min,
          age_max: errors?.age_max,
          publisher_platforms: errors?.publisher_platforms
        }}
      />

      {/* Ad Set Status */}
      <div className="grid gap-2">
        <Label htmlFor="adset-status">Ad Set Status</Label>
        <div className="px-3 py-2 bg-muted text-muted-foreground rounded-md text-sm">
          Paused
        </div>
        <p className="text-xs text-muted-foreground">
          Ad sets start paused by default for safety
        </p>
      </div>

      {/* Schedule (following Google pattern with individual locks and warnings) */}
      <div className="grid grid-cols-2 gap-4">
        <MetaCampaignLockableField
          label="Start Date *"
          isLocked={isStartDateLocked}
          onToggleLock={onToggleStartDateLock || (() => {})}
          disabled={disabled}
          originalValue={originalFormData?.startDate}
          fieldType="date"
          warning={!isStartDateLocked && onToggleStartDateLock ? (
            <>
              <p className="text-amber-800 dark:text-amber-300 text-sm font-medium mb-1">
                ⚠️ Start date field is unlocked
              </p>
              <p className="text-amber-800 dark:text-amber-300 text-xs">
                Click the lock icon to secure this field and prevent accidental changes.
              </p>
            </>
          ) : undefined}
        >
          <Input
            id="start-date"
            type="date"
            value={formatDateForInput(value.start_time)}
            onChange={(e) => handleDateChange('start_time', e.target.value)}
            onFocus={onStartDateFocus}
            onBlur={onStartDateBlur}
            min={new Date().toISOString().split('T')[0]} // Can't start in the past
            disabled={disabled || isStartDateLocked}
            className={`${errors?.start_time ? 'border-destructive' : ''} ${isStartDateLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          {errors?.start_time && (
            <p className="text-xs text-destructive">{errors.start_time}</p>
          )}
        </MetaCampaignLockableField>

        <MetaCampaignLockableField
          label="End Date *"
          isLocked={isEndDateLocked}
          onToggleLock={onToggleEndDateLock || (() => {})}
          disabled={disabled}
          originalValue={originalFormData?.endDate}
          fieldType="date"
          warning={!isEndDateLocked && onToggleEndDateLock ? (
            <>
              <p className="text-amber-800 dark:text-amber-300 text-sm font-medium mb-1">
                ⚠️ End date field is unlocked
              </p>
              <p className="text-amber-800 dark:text-amber-300 text-xs">
                Click the lock icon to secure this field and prevent accidental changes.
              </p>
            </>
          ) : undefined}
        >
          <Input
            id="end-date"
            type="date"
            value={formatDateForInput(value.end_time)}
            onChange={(e) => handleDateChange('end_time', e.target.value)}
            onFocus={onEndDateFocus}
            onBlur={onEndDateBlur}
            min={formatDateForInput(value.start_time) || new Date().toISOString().split('T')[0]}
            disabled={disabled || isEndDateLocked}
            className={`${errors?.end_time ? 'border-destructive' : ''} ${isEndDateLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          {errors?.end_time && (
            <p className="text-xs text-destructive">{errors.end_time}</p>
          )}
        </MetaCampaignLockableField>
      </div>
    </div>
  )
}