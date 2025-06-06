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

interface OriginalFormData {
  budgetType: string | null
  budgetAmount: string | null
  startDate: string | null
  endDate: string | null
}

interface GoogleCampaignBudgetSectionProps {
  budgetType: 'daily' | 'total'
  budgetAmount: string
  
  // Individual lock states
  isBudgetTypeLocked: boolean
  isBudgetAmountLocked: boolean
  
  onBudgetTypeChange: (value: 'daily' | 'total') => void
  onBudgetAmountChange: (value: string) => void
  
  // Individual unlock handlers
  onBudgetTypeUnlock: () => void
  onBudgetAmountUnlock: () => void
  
  onBudgetTypeFocus: () => void
  onBudgetTypeBlur: () => void
  onBudgetAmountFocus: () => void
  onBudgetAmountBlur: () => void
  originalFormData?: OriginalFormData
  disabled?: boolean
}

export function GoogleCampaignBudgetSection({
  budgetType,
  budgetAmount,
  isBudgetTypeLocked,
  isBudgetAmountLocked,
  onBudgetTypeChange,
  onBudgetAmountChange,
  onBudgetTypeUnlock,
  onBudgetAmountUnlock,
  onBudgetTypeFocus,
  onBudgetTypeBlur,
  onBudgetAmountFocus,
  onBudgetAmountBlur,
  originalFormData,
  disabled = false
}: GoogleCampaignBudgetSectionProps) {
  
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
    <div className="space-y-4">
      {/* Budget Type Selection */}
      <GoogleCampaignLockableField
        label="Budget Type"
        isLocked={isBudgetTypeLocked}
        onToggleLock={onBudgetTypeUnlock}
        disabled={disabled}
        originalValue={originalFormData?.budgetType}
        fieldType="budget-type"
        warning={budgetTypeWarning}
      >
        <Select 
          value={budgetType} 
          onValueChange={onBudgetTypeChange}
          disabled={disabled || isBudgetTypeLocked}
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
            ? "Amount to spend per day. Google may spend up to 200% on high-opportunity days, but won't exceed your monthly limit (daily budget × 30.4)."
            : "Total amount to spend over the entire campaign duration"
          }
        </p>
      </GoogleCampaignLockableField>

      {/* Budget Amount */}
      <GoogleCampaignLockableField
        label={budgetType === 'daily' ? 'Daily Budget (USD)' : 'Total Budget (USD)'}
        isLocked={isBudgetAmountLocked}
        onToggleLock={onBudgetAmountUnlock}
        disabled={disabled}
        originalValue={originalFormData?.budgetAmount}
        fieldType="budget-amount"
        warning={budgetAmountWarning}
      >
        <Input
          id="budget-amount"
          type="number"
          step="0.01"
          min="0.01"
          value={budgetAmount}
          onChange={(e) => onBudgetAmountChange(e.target.value)}
          onFocus={onBudgetAmountFocus}
          onBlur={onBudgetAmountBlur}
          placeholder="100.00"
          disabled={disabled || isBudgetAmountLocked}
          className={isBudgetAmountLocked ? 'opacity-50 cursor-not-allowed' : ''}
        />
        <p className="text-xs text-muted-foreground">
          {budgetType === 'daily' 
            ? "Set the daily budget amount. Minimum $1.00 per day."
            : "Set the total budget for the entire campaign duration"
          }
        </p>
      </GoogleCampaignLockableField>
    </div>
  )
}