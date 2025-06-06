'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GoogleCampaignLockableField } from './google-campaign-lockable-field'

interface GoogleCampaignBudgetSectionProps {
  budgetType: 'daily' | 'total'
  budgetAmount: string
  isBudgetLocked: boolean
  onBudgetTypeChange: (value: 'daily' | 'total') => void
  onBudgetAmountChange: (value: string) => void
  onRequestBudgetUnlock: () => void
  disabled?: boolean
}

export function GoogleCampaignBudgetSection({
  budgetType,
  budgetAmount,
  isBudgetLocked,
  onBudgetTypeChange,
  onBudgetAmountChange,
  onRequestBudgetUnlock,
  disabled = false
}: GoogleCampaignBudgetSectionProps) {
  return (
    <div className="space-y-4">
      {/* Budget Type Selection */}
      <GoogleCampaignLockableField
        label="Budget Type"
        isLocked={isBudgetLocked}
        onRequestUnlock={onRequestBudgetUnlock}
        disabled={disabled}
      >
        <Select 
          value={budgetType} 
          onValueChange={onBudgetTypeChange}
          disabled={disabled || isBudgetLocked}
        >
          <SelectTrigger 
            id="budget-type"
            className={isBudgetLocked ? 'opacity-50 cursor-not-allowed' : ''}
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
            ? "Amount to spend per day. Google may spend up to 200% on high-opportunity days, but won't exceed your monthly limit (daily budget × 30.4)."
            : "Total amount to spend over the entire campaign duration"
          }
        </p>
      </GoogleCampaignLockableField>

      {/* Budget Amount */}
      <GoogleCampaignLockableField
        label={budgetType === 'daily' ? 'Daily Budget (USD)' : 'Total Budget (USD)'}
        isLocked={isBudgetLocked}
        onRequestUnlock={onRequestBudgetUnlock}
        disabled={disabled}
      >
        <Input
          id="budget-amount"
          type="number"
          step="0.01"
          min="0.01"
          value={budgetAmount}
          onChange={(e) => onBudgetAmountChange(e.target.value)}
          placeholder="100.00"
          disabled={disabled || isBudgetLocked}
          className={isBudgetLocked ? 'opacity-50 cursor-not-allowed' : ''}
        />
        <p className="text-xs text-muted-foreground">
          {budgetType === 'daily' 
            ? "Set the daily budget amount. Minimum $1.00 per day."
            : "Set the total budget for the entire campaign duration"
          }
        </p>
      </GoogleCampaignLockableField>

      {/* Budget Warning when unlocked */}
      {!isBudgetLocked && (
        <div className="p-4 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
          <p className="text-amber-800 dark:text-amber-300 text-sm font-medium mb-2">
            ⚠️ Budget fields are unlocked for manual editing
          </p>
          <div className="text-amber-800 dark:text-amber-300 text-xs">
            <p>Budget values can be manually adjusted. Click the lock icon to secure these fields and prevent accidental changes.</p>
          </div>
        </div>
      )}
    </div>
  )
}