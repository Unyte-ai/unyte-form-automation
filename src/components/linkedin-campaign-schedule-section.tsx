import { Input } from '@/components/ui/input'
import { LinkedInCampaignLockableField } from './linkedin-campaign-lockable-field'

interface OriginalFormData {
  budgetType: string | null
  budgetAmount: string | null
  startDate: string | null
  endDate: string | null
}

interface LinkedInCampaignScheduleSectionProps {
  startDate: string
  setStartDate: (date: string) => void
  endDate: string
  setEndDate: (date: string) => void
  // Individual lock states
  isStartDateLocked: boolean
  isEndDateLocked: boolean
  toggleStartDateLock: () => void
  toggleEndDateLock: () => void
  // Focus/blur handlers
  onStartDateFocus: () => void
  onStartDateBlur: () => void
  onEndDateFocus: () => void
  onEndDateBlur: () => void
  originalFormData?: OriginalFormData
  isCreating: boolean
}

export function LinkedInCampaignScheduleSection({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  isStartDateLocked,
  isEndDateLocked,
  toggleStartDateLock,
  toggleEndDateLock,
  onStartDateFocus,
  onStartDateBlur,
  onEndDateFocus,
  onEndDateBlur,
  originalFormData,
  isCreating
}: LinkedInCampaignScheduleSectionProps) {
  
  // Individual warnings for each field
  const startDateWarning = !isStartDateLocked ? (
    <>
      <p className="text-amber-800 dark:text-amber-300 text-sm font-medium mb-2">
        ⚠️ Start date field is unlocked
      </p>
      <div className="text-amber-800 dark:text-amber-300 text-xs">
        <p>Click the lock icon to secure this field and prevent accidental changes.</p>
      </div>
    </>
  ) : null

  const endDateWarning = !isEndDateLocked ? (
    <>
      <p className="text-amber-800 dark:text-amber-300 text-sm font-medium mb-2">
        ⚠️ End date field is unlocked
      </p>
      <div className="text-amber-800 dark:text-amber-300 text-xs">
        <p>Click the lock icon to secure this field and prevent accidental changes.</p>
      </div>
    </>
  ) : null

  return (
    <>
      {/* Campaign Schedule */}
      <div className="grid grid-cols-2 gap-4">
        <LinkedInCampaignLockableField
          label="Start Date *"
          isLocked={isStartDateLocked}
          onToggleLock={toggleStartDateLock}
          disabled={isCreating}
          originalValue={originalFormData?.startDate}
          fieldType="date"
          warning={startDateWarning}
        >
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            onFocus={onStartDateFocus}
            onBlur={onStartDateBlur}
            min={new Date().toISOString().split('T')[0]} // Can't start in the past
            disabled={isCreating || isStartDateLocked}
            className={isStartDateLocked ? 'opacity-50 cursor-not-allowed' : ''}
            required
          />
          <p className="text-xs text-muted-foreground">
            Campaign start date (must be future)
          </p>
        </LinkedInCampaignLockableField>

        <LinkedInCampaignLockableField
          label="End Date"
          isLocked={isEndDateLocked}
          onToggleLock={toggleEndDateLock}
          disabled={isCreating}
          originalValue={originalFormData?.endDate}
          fieldType="date"
          warning={endDateWarning}
        >
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            onFocus={onEndDateFocus}
            onBlur={onEndDateBlur}
            min={startDate} // End date must be after start date
            disabled={isCreating || isEndDateLocked}
            className={isEndDateLocked ? 'opacity-50 cursor-not-allowed' : ''}
          />
          <p className="text-xs text-muted-foreground">
            Campaign end date (optional)
          </p>
        </LinkedInCampaignLockableField>
      </div>
    </>
  )
}