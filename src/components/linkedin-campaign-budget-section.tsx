import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LinkedInCampaignLockableField } from './linkedin-campaign-lockable-field'

interface OriginalFormData {
  budgetType: string | null
  budgetAmount: string | null
  startDate: string | null
  endDate: string | null
}

interface LinkedInCampaignBudgetSectionProps {
  budgetType: 'daily' | 'total'
  setBudgetType: (type: 'daily' | 'total') => void
  budgetAmount: string
  setBudgetAmount: (amount: string) => void
  currency: string
  setCurrency: (currency: string) => void
  // Individual lock states
  isBudgetTypeLocked: boolean
  isBudgetAmountLocked: boolean
  toggleBudgetTypeLock: () => void
  toggleBudgetAmountLock: () => void
  // Focus/blur handlers
  onBudgetTypeFocus: () => void
  onBudgetTypeBlur: () => void
  onBudgetAmountFocus: () => void
  onBudgetAmountBlur: () => void
  originalFormData?: OriginalFormData
  isCreating: boolean
}

export function LinkedInCampaignBudgetSection({
  budgetType,
  setBudgetType,
  budgetAmount,
  setBudgetAmount,
  currency,
  setCurrency,
  isBudgetTypeLocked,
  isBudgetAmountLocked,
  toggleBudgetTypeLock,
  toggleBudgetAmountLock,
  onBudgetTypeFocus,
  onBudgetTypeBlur,
  onBudgetAmountFocus,
  onBudgetAmountBlur,
  originalFormData,
  isCreating
}: LinkedInCampaignBudgetSectionProps) {
  
  // Individual warnings for each field
  const budgetTypeWarning = !isBudgetTypeLocked ? (
    <>
      <p className="text-amber-800 dark:text-amber-300 text-sm font-medium mb-2">
        ⚠️ Budget type field is unlocked for manual editing
      </p>
      <div className="text-amber-800 dark:text-amber-300 text-xs">
        <p>Budget type can be manually adjusted. Click the lock icon to secure this field and prevent accidental changes.</p>
      </div>
    </>
  ) : null

  const budgetAmountWarning = !isBudgetAmountLocked ? (
    <>
      <p className="text-amber-800 dark:text-amber-300 text-sm font-medium mb-2">
        ⚠️ Budget amount field is unlocked for manual editing
      </p>
      <div className="text-amber-800 dark:text-amber-300 text-xs">
        <p>Budget amount can be manually adjusted. Click the lock icon to secure this field and prevent accidental changes.</p>
      </div>
    </>
  ) : null

  return (
    <>
      {/* Budget Type Selection */}
      <LinkedInCampaignLockableField
        label="Budget Type *"
        isLocked={isBudgetTypeLocked}
        onToggleLock={toggleBudgetTypeLock}
        disabled={isCreating}
        originalValue={originalFormData?.budgetType}
        fieldType="budget-type"
        warning={budgetTypeWarning}
      >
        <Select 
          value={budgetType} 
          onValueChange={(value) => setBudgetType(value as 'daily' | 'total')}
          disabled={isCreating || isBudgetTypeLocked}
        >
          <SelectTrigger 
            id="budget-type"
            className={isBudgetTypeLocked ? 'opacity-50 cursor-not-allowed' : ''}
            onFocus={onBudgetTypeFocus}
            onBlur={onBudgetTypeBlur}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily Budget</SelectItem>
            <SelectItem value="total">Total Budget (Lifetime)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {budgetType === 'daily' 
            ? "Amount to spend per day (resets at midnight UTC). LinkedIn may spend up to 150% on high-opportunity days."
            : "Total amount to spend over the campaign lifetime"
          }
        </p>
      </LinkedInCampaignLockableField>

      {/* Budget Amount and Currency */}
      <div className="grid grid-cols-2 gap-4">
        <LinkedInCampaignLockableField
          label={budgetType === 'daily' ? 'Daily Budget *' : 'Total Budget *'}
          isLocked={isBudgetAmountLocked}
          onToggleLock={toggleBudgetAmountLock}
          disabled={isCreating}
          originalValue={originalFormData?.budgetAmount}
          fieldType="budget-amount"
          warning={budgetAmountWarning}
        >
          <Input
            id="budget-amount"
            type="number"
            step="0.01"
            min="0"
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(e.target.value)}
            onFocus={onBudgetAmountFocus}
            onBlur={onBudgetAmountBlur}
            placeholder="0.00"
            disabled={isCreating || isBudgetAmountLocked}
            className={isBudgetAmountLocked ? 'opacity-50 cursor-not-allowed' : ''}
            required
          />
        </LinkedInCampaignLockableField>
        
        <div className="grid gap-2">
          <Label htmlFor="currency">Currency</Label>
          <Select 
            value={currency} 
            onValueChange={setCurrency}
            disabled={isCreating}
          >
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="CAD">CAD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  )
}