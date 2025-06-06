'use client'

import { Input } from '@/components/ui/input'
import { GoogleCampaignLockableField } from './google-campaign-lockable-field'

interface OriginalFormData {
  budgetType: string | null
  budgetAmount: string | null
  startDate: string | null
  endDate: string | null
}

interface GoogleCampaignDateSectionProps {
  startDate: string
  endDate: string
  isDateLocked: boolean
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onDateUnlock: () => void
  onStartDateFocus: () => void
  onStartDateBlur: () => void
  onEndDateFocus: () => void
  onEndDateBlur: () => void
  getTomorrowDate: () => string
  originalFormData?: OriginalFormData
  disabled?: boolean
}

export function GoogleCampaignDateSection({
  startDate,
  endDate,
  isDateLocked,
  onStartDateChange,
  onEndDateChange,
  onDateUnlock,
  onStartDateFocus,
  onStartDateBlur,
  onEndDateFocus,
  onEndDateBlur,
  getTomorrowDate,
  originalFormData,
  disabled = false
}: GoogleCampaignDateSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <GoogleCampaignLockableField
          label="Start Date"
          isLocked={isDateLocked}
          onToggleLock={onDateUnlock}
          disabled={disabled}
          originalValue={originalFormData?.startDate}
          fieldType="date"
        >
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            onFocus={onStartDateFocus}
            onBlur={onStartDateBlur}
            disabled={disabled || isDateLocked}
            min={getTomorrowDate()}
            className={isDateLocked ? 'opacity-50 cursor-not-allowed' : ''}
          />
          <p className="text-xs text-muted-foreground">
            Campaign start date (must be future)
          </p>
        </GoogleCampaignLockableField>

        <GoogleCampaignLockableField
          label="End Date"
          isLocked={isDateLocked}
          onToggleLock={onDateUnlock}
          disabled={disabled}
          originalValue={originalFormData?.endDate}
          fieldType="date"
        >
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            onFocus={onEndDateFocus}
            onBlur={onEndDateBlur}
            disabled={disabled || isDateLocked}
            min={startDate || getTomorrowDate()}
            className={isDateLocked ? 'opacity-50 cursor-not-allowed' : ''}
          />
          <p className="text-xs text-muted-foreground">
            Campaign end date
          </p>
        </GoogleCampaignLockableField>
      </div>

      {/* Date Warning when unlocked */}
      {!isDateLocked && (
        <div className="p-4 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
          <p className="text-amber-800 dark:text-amber-300 text-sm font-medium mb-2">
            ⚠️ Date fields are unlocked for manual editing
          </p>
          <div className="text-amber-800 dark:text-amber-300 text-xs">
            <p>Campaign start and end dates can be manually adjusted. Click the lock icon to secure these fields and prevent accidental changes.</p>
          </div>
        </div>
      )}
    </div>
  )
}