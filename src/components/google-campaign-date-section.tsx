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
  
  // Individual lock states
  isStartDateLocked: boolean
  isEndDateLocked: boolean
  
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  
  // Individual unlock handlers
  onStartDateUnlock: () => void
  onEndDateUnlock: () => void
  
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
  isStartDateLocked,
  isEndDateLocked,
  onStartDateChange,
  onEndDateChange,
  onStartDateUnlock,
  onEndDateUnlock,
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
            onClick={onStartDateUnlock}
            disabled={disabled}
            className="h-6 w-6 p-0"
            title={isStartDateLocked ? 'Click to unlock and edit this field' : 'Click to lock this field'}
          >
            {isStartDateLocked ? (
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
            onClick={onEndDateUnlock}
            disabled={disabled}
            className="h-6 w-6 p-0"
            title={isEndDateLocked ? 'Click to unlock and edit this field' : 'Click to lock this field'}
          >
            {isEndDateLocked ? (
              <Lock className="h-3 w-3" />
            ) : (
              <Pencil className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Date Input Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          {/* Warning for start date field - positioned above the input, below the label */}
          {!isStartDateLocked && (
            <div className="p-3 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
              <p className="text-amber-800 dark:text-amber-300 text-sm font-medium mb-1">
                ⚠️ Start date field is unlocked
              </p>
              <p className="text-amber-800 dark:text-amber-300 text-xs">
                Click the lock icon to secure this field and prevent accidental changes.
              </p>
            </div>
          )}
          
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            onFocus={onStartDateFocus}
            onBlur={onStartDateBlur}
            disabled={disabled || isStartDateLocked}
            min={getTomorrowDate()}
            className={isStartDateLocked ? 'opacity-50 cursor-not-allowed' : ''}
          />
          <p className="text-xs text-muted-foreground">
            Campaign start date (must be future)
          </p>
          <OriginalValueDisplay originalValue={originalFormData?.startDate} fieldType="date" />
        </div>

        <div className="grid gap-2">
          {/* Warning for end date field - positioned above the input, below the label */}
          {!isEndDateLocked && (
            <div className="p-3 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
              <p className="text-amber-800 dark:text-amber-300 text-sm font-medium mb-1">
                ⚠️ End date field is unlocked
              </p>
              <p className="text-amber-800 dark:text-amber-300 text-xs">
                Click the lock icon to secure this field and prevent accidental changes.
              </p>
            </div>
          )}
          
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            onFocus={onEndDateFocus}
            onBlur={onEndDateBlur}
            disabled={disabled || isEndDateLocked}
            min={startDate || getTomorrowDate()}
            className={isEndDateLocked ? 'opacity-50 cursor-not-allowed' : ''}
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