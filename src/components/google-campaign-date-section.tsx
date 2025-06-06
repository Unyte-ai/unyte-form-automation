'use client'

import { Input } from '@/components/ui/input'
import { GoogleCampaignLockableField } from './google-campaign-lockable-field'

interface GoogleCampaignDateSectionProps {
  startDate: string
  endDate: string
  isDateLocked: boolean
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onRequestDateUnlock: () => void
  getTomorrowDate: () => string
  disabled?: boolean
}

export function GoogleCampaignDateSection({
  startDate,
  endDate,
  isDateLocked,
  onStartDateChange,
  onEndDateChange,
  onRequestDateUnlock,
  getTomorrowDate,
  disabled = false
}: GoogleCampaignDateSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <GoogleCampaignLockableField
          label="Start Date"
          isLocked={isDateLocked}
          onRequestUnlock={onRequestDateUnlock}
          disabled={disabled}
        >
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
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
          onRequestUnlock={onRequestDateUnlock}
          disabled={disabled}
        >
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
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