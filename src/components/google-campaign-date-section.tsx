'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Pencil, Lock } from 'lucide-react'
import { OriginalValueDisplay } from './google-original-value-display'

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
      {/* Labels and Lock buttons */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center justify-between">
          <Label>Start Date</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDateUnlock}
            disabled={disabled}
            className="h-6 w-6 p-0"
            title={isDateLocked ? 'Click to unlock and edit this field' : 'Click to lock this field'}
          >
            {isDateLocked ? (
              <Lock className="h-3 w-3" />
            ) : (
              <Pencil className="h-3 w-3" />
            )}
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <Label>End Date</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDateUnlock}
            disabled={disabled}
            className="h-6 w-6 p-0"
            title={isDateLocked ? 'Click to unlock and edit this field' : 'Click to lock this field'}
          >
            {isDateLocked ? (
              <Lock className="h-3 w-3" />
            ) : (
              <Pencil className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Shared Date Warning when unlocked */}
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

      {/* Date Input Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
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
          <OriginalValueDisplay originalValue={originalFormData?.startDate} fieldType="date" />
        </div>

        <div className="grid gap-2">
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
          <OriginalValueDisplay originalValue={originalFormData?.endDate} fieldType="date" />
        </div>
      </div>
    </div>
  )
}