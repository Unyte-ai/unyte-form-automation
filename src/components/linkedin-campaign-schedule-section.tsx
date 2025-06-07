import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, Lock } from 'lucide-react'

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
  isCreating
}: LinkedInCampaignScheduleSectionProps) {
  return (
    <>
      {/* Campaign Schedule */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="start-date">Start Date *</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleStartDateLock}
              disabled={isCreating}
              className="h-6 w-6 p-0"
            >
              {isStartDateLocked ? (
                <Lock className="h-3 w-3" />
              ) : (
                <Pencil className="h-3 w-3" />
              )}
            </Button>
          </div>
          {/* Individual warning for start date - positioned between label and field */}
          {!isStartDateLocked && (
            <div className="p-4 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
              <p className="text-amber-800 dark:text-amber-300 text-sm font-medium mb-2">
                ⚠️ Start date field is unlocked
              </p>
              <div className="text-amber-800 dark:text-amber-300 text-xs">
                <p>Click the lock icon to secure this field and prevent accidental changes.</p>
              </div>
            </div>
          )}
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
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="end-date">End Date</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleEndDateLock}
              disabled={isCreating}
              className="h-6 w-6 p-0"
            >
              {isEndDateLocked ? (
                <Lock className="h-3 w-3" />
              ) : (
                <Pencil className="h-3 w-3" />
              )}
            </Button>
          </div>
          {/* Individual warning for end date - positioned between label and field */}
          {!isEndDateLocked && (
            <div className="p-4 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
              <p className="text-amber-800 dark:text-amber-300 text-sm font-medium mb-2">
                ⚠️ End date field is unlocked
              </p>
              <div className="text-amber-800 dark:text-amber-300 text-xs">
                <p>Click the lock icon to secure this field and prevent accidental changes.</p>
              </div>
            </div>
          )}
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
        </div>
      </div>
    </>
  )
}