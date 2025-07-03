import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MetaCampaignLockableField } from '@/components/meta-campaign-lockable-field'
import { getCurrencyLabel, SupportedCurrency } from '@/lib/meta-currency-utils'
import { 
  FacebookCampaignData,
  FacebookBudgetType,
  CAMPAIGN_OBJECTIVES,
  formatBudgetCents,
  parseBudgetToCents
} from '@/lib/facebook-campaign-utils'

interface OriginalMetaFormData {
  budgetType: string | null
  budgetAmount: string | null
  startDate: string | null
  endDate: string | null
}

interface MetaCampaignFieldsProps {
  value: Partial<FacebookCampaignData>
  onChange: (value: Partial<FacebookCampaignData>) => void
  errors?: Record<string, string>
  
  // Individual lock states (following Google pattern)
  isBudgetTypeLocked?: boolean
  isBudgetAmountLocked?: boolean
  
  // Individual lock toggle handlers (following Google pattern)
  onToggleBudgetTypeLock?: () => void
  onToggleBudgetAmountLock?: () => void
  
  // Focus/blur handlers for blur confirmation
  onBudgetTypeFocus?: () => void
  onBudgetTypeBlur?: () => void
  onBudgetAmountFocus?: () => void
  onBudgetAmountBlur?: () => void
  
  // Original form data for display
  originalFormData?: OriginalMetaFormData
  
  // NEW: Currency support (with fallback to USD for backwards compatibility)
  detectedCurrency?: SupportedCurrency
  
  disabled?: boolean
}

export function MetaCampaignFields({ 
  value, 
  onChange, 
  errors,
  
  // Individual lock props (following Google pattern)
  isBudgetTypeLocked = false,
  isBudgetAmountLocked = false,
  onToggleBudgetTypeLock,
  onToggleBudgetAmountLock,
  
  // Focus/blur handlers for blur confirmation
  onBudgetTypeFocus,
  onBudgetTypeBlur,
  onBudgetAmountFocus,
  onBudgetAmountBlur,
  
  // Original form data for display
  originalFormData,
  
  // NEW: Currency prop with fallback for backwards compatibility
  detectedCurrency = 'USD',
  
  disabled = false
}: MetaCampaignFieldsProps) {
  // Handle form field changes
  const handleFieldChange = (field: keyof FacebookCampaignData, fieldValue: FacebookCampaignData[keyof FacebookCampaignData]) => {
    onChange({
      ...value,
      [field]: fieldValue
    })
  }

  // Handle budget type change - transfer budget amount when switching types
  const handleBudgetTypeChange = (budgetType: FacebookBudgetType) => {
    const currentBudgetType = value.budget_type || 'LIFETIME'
    const currentBudgetAmount = currentBudgetType === 'LIFETIME' ? value.lifetime_budget : value.daily_budget
    
    const updates: Partial<FacebookCampaignData> = {
      ...value,
      budget_type: budgetType
    }

    // Transfer the budget amount to the new budget type, clear the old one
    if (budgetType === 'LIFETIME') {
      updates.lifetime_budget = currentBudgetAmount || 0
      updates.daily_budget = undefined
    } else {
      updates.daily_budget = currentBudgetAmount || 0
      updates.lifetime_budget = undefined
    }

    onChange(updates)
  }

  // Handle budget change with cent conversion
  const handleBudgetChange = (budgetString: string, budgetType: FacebookBudgetType) => {
    if (budgetString === '') {
      if (budgetType === 'LIFETIME') {
        handleFieldChange('lifetime_budget', 0)
      } else {
        handleFieldChange('daily_budget', 0)
      }
      return
    }
    
    const cents = parseBudgetToCents(budgetString)
    if (budgetType === 'LIFETIME') {
      handleFieldChange('lifetime_budget', cents)
    } else {
      handleFieldChange('daily_budget', cents)
    }
  }

  // Get current budget as string for display
  const getBudgetDisplayValue = (): string => {
    const currentBudgetType = value.budget_type || 'LIFETIME'
    const budgetAmount = currentBudgetType === 'LIFETIME' ? value.lifetime_budget : value.daily_budget
    
    if (!budgetAmount || budgetAmount === 0) {
      return ''
    }
    return formatBudgetCents(budgetAmount)
  }

  // Get the current budget type (default to LIFETIME)
  const currentBudgetType = value.budget_type || 'LIFETIME'

  // NEW: Generate dynamic currency labels
  const budgetCurrencyLabel = getCurrencyLabel(detectedCurrency)

  return (
    <div className="space-y-4">
      {/* Campaign Name */}
      <div className="grid gap-2">
        <Label htmlFor="campaign-name">Campaign Name *</Label>
        <Input
          id="campaign-name"
          value={value.name || ''}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          placeholder="Enter campaign name"
          disabled={disabled}
          className={errors?.name ? 'border-destructive' : ''}
        />
        {errors?.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Campaign Objective */}
      <div className="grid gap-2">
        <Label htmlFor="campaign-objective">Campaign Objective *</Label>
        <Select 
          value={value.objective || ''} 
          onValueChange={(selectedValue) => handleFieldChange('objective', selectedValue)}
          disabled={disabled}
        >
          <SelectTrigger id="campaign-objective" className={errors?.objective ? 'border-destructive' : ''}>
            <SelectValue placeholder="Select an objective" />
          </SelectTrigger>
          <SelectContent>
            {CAMPAIGN_OBJECTIVES.map(objective => (
              <SelectItem key={objective.value} value={objective.value}>
                {objective.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors?.objective && (
          <p className="text-xs text-destructive">{errors.objective}</p>
        )}
        <p className="text-xs text-muted-foreground">
          The billing event will be automatically set based on your objective
        </p>
      </div>

      {/* Budget Type Selection (following Google pattern with individual lock) */}
      <MetaCampaignLockableField
        label="Budget Type *"
        isLocked={isBudgetTypeLocked}
        onToggleLock={onToggleBudgetTypeLock || (() => {})}
        disabled={disabled}
        originalValue={originalFormData?.budgetType}
        fieldType="budget-type"
        warning={!isBudgetTypeLocked && onToggleBudgetTypeLock ? (
          <>
            <p className="text-amber-800 dark:text-amber-300 text-sm font-medium mb-2">
              ⚠️ Budget type field is unlocked for manual editing
            </p>
            <div className="text-amber-800 dark:text-amber-300 text-xs">
              <p>Budget type can be manually adjusted. Click the lock icon to secure this field and prevent accidental changes.</p>
            </div>
          </>
        ) : undefined}
      >
        <Select 
          value={currentBudgetType} 
          onValueChange={handleBudgetTypeChange}
          disabled={disabled || isBudgetTypeLocked}
        >
          <SelectTrigger 
            id="budget-type" 
            className={`${errors?.budget_type ? 'border-destructive' : ''} ${isBudgetTypeLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            onFocus={onBudgetTypeFocus}
            onBlur={onBudgetTypeBlur}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DAILY">Daily Budget</SelectItem>
            <SelectItem value="LIFETIME">Lifetime Budget</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {currentBudgetType === 'DAILY' 
            ? "Amount to spend per day. Facebook will continue spending until you pause the campaign or it reaches an end date."
            : "Total amount to spend over the campaign lifetime. Facebook will pace spending automatically."
          }
        </p>
        {errors?.budget_type && (
          <p className="text-xs text-destructive">{errors.budget_type}</p>
        )}
      </MetaCampaignLockableField>

      {/* Budget Amount (following Google pattern with individual lock) - NOW WITH DYNAMIC CURRENCY */}
      <MetaCampaignLockableField
        label={`${currentBudgetType === 'LIFETIME' ? 'Lifetime Budget' : 'Daily Budget'} ${budgetCurrencyLabel} *`}
        isLocked={isBudgetAmountLocked}
        onToggleLock={onToggleBudgetAmountLock || (() => {})}
        disabled={disabled}
        originalValue={originalFormData?.budgetAmount}
        fieldType="budget-amount"
        warning={!isBudgetAmountLocked && onToggleBudgetAmountLock ? (
          <>
            <p className="text-amber-800 dark:text-amber-300 text-sm font-medium mb-2">
              ⚠️ Budget amount field is unlocked for manual editing
            </p>
            <div className="text-amber-800 dark:text-amber-300 text-xs">
              <p>Budget amount can be manually adjusted. Click the lock icon to secure this field and prevent accidental changes.</p>
            </div>
          </>
        ) : undefined}
      >
        <Input
          id="campaign-budget"
          type="number"
          step="0.01"
          min="0"
          value={getBudgetDisplayValue()}
          onChange={(e) => handleBudgetChange(e.target.value, currentBudgetType)}
          onFocus={onBudgetAmountFocus}
          onBlur={onBudgetAmountBlur}
          placeholder="0.00"
          disabled={disabled || isBudgetAmountLocked}
          className={`${errors?.lifetime_budget || errors?.daily_budget ? 'border-destructive' : ''} ${isBudgetAmountLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {(errors?.lifetime_budget || errors?.daily_budget) && (
          <p className="text-xs text-destructive">
            {errors?.lifetime_budget || errors?.daily_budget}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {currentBudgetType === 'LIFETIME' 
            ? `Enter the total amount you want to spend on this campaign (in ${detectedCurrency})`
            : `Enter the maximum amount you want to spend per day (in ${detectedCurrency})`
          }
        </p>
      </MetaCampaignLockableField>

      {/* Campaign Status */}
      <div className="grid gap-2">
        <Label htmlFor="campaign-status">Campaign Status</Label>
        <div className="px-3 py-2 bg-muted text-muted-foreground rounded-md text-sm">
          Paused
        </div>
        <p className="text-xs text-muted-foreground">
          Campaigns start paused by default for safety
        </p>
      </div>

      {/* NEW: Currency Detection Info (only show if not USD) */}
      {detectedCurrency !== 'USD' && (
        <div className="p-3 rounded-md bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800">
          <p className="text-green-800 dark:text-green-300 text-sm">
            <strong>Currency Detected:</strong> {detectedCurrency}
            <br />
            <span className="text-xs">
              Budget amounts will be sent to Meta in {detectedCurrency}. The currency is detected from your form data.
            </span>
          </p>
        </div>
      )}
    </div>
  )
}