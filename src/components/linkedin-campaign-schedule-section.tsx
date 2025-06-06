import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, Lock } from 'lucide-react'

interface LinkedInCampaignScheduleSectionProps {
  startDate: string
  setStartDate: (date: string) => void
  endDate: string
  setEndDate: (date: string) => void
  isDateLocked: boolean
  toggleDateLock: () => void
  isCreating: boolean
}

export function LinkedInCampaignScheduleSection({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  isDateLocked,
  toggleDateLock,
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
              onClick={toggleDateLock}
              disabled={isCreating}
              className="h-6 w-6 p-0"
            >
              {isDateLocked ? (
                <Lock className="h-3 w-3" />
              ) : (
                <Pencil className="h-3 w-3" />
              )}
            </Button>
          </div>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]} // Can't start in the past
            disabled={isCreating || isDateLocked}
            className={isDateLocked ? 'opacity-50 cursor-not-allowed' : ''}
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
              onClick={toggleDateLock}
              disabled={isCreating}
              className="h-6 w-6 p-0"
            >
              {isDateLocked ? (
                <Lock className="h-3 w-3" />
              ) : (
                <Pencil className="h-3 w-3" />
              )}
            </Button>
          </div>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate} // End date must be after start date
            disabled={isCreating || isDateLocked}
            className={isDateLocked ? 'opacity-50 cursor-not-allowed' : ''}
          />
        </div>
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
    </>
  )
}