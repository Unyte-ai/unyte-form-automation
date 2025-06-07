import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Lock } from 'lucide-react'
import { 
  FacebookCampaignData,
  FacebookBudgetType,
  CAMPAIGN_OBJECTIVES,
  formatBudgetCents,
  parseBudgetToCents
} from '@/lib/facebook-campaign-utils'

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
}

export function MetaCampaignFields({ 
  value, 
  onChange, 
  errors,
  
  // Individual lock props (following Google pattern)
  isBudgetTypeLocked = false,
  isBudgetAmountLocked = false,
  onToggleBudgetTypeLock,
  onToggleBudgetAmountLock
}: MetaCampaignFieldsProps) {
  // Handle form field changes
  const handleFieldChange = (field: keyof FacebookCampaignData, fieldValue: FacebookCampaignData[keyof FacebookCampaignData]) => {
    onChange({
      ...value,
      [field]: fieldValue
    })
  }

  // Handle budget type change - clear the opposite budget when switching types
  const handleBudgetTypeChange = (budgetType: FacebookBudgetType) => {
    const updates: Partial<FacebookCampaignData> = {
      ...value,
      budget_type: budgetType
    }

    // Clear the budget that's not being used
    if (budgetType === 'LIFETIME') {
      updates.daily_budget = undefined
    } else {
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

  // Individual warnings (following Google pattern - positioned between title and field)
  const budgetTypeWarning = !isBudgetTypeLocked && onToggleBudgetTypeLock ? (
    <div className="p-4 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
      <p className="text-amber-800 dark:text-amber-300 text-sm font-medium mb-2">
        ⚠️ Budget type field is unlocked for manual editing
      </p>
      <div className="text-amber-800 dark:text-amber-300 text-xs">
        <p>Budget type can be manually adjusted. Click the lock icon to secure this field and prevent accidental changes.</p>
      </div>
    </div>
  ) : null

  const budgetAmountWarning = !isBudgetAmountLocked && onToggleBudgetAmountLock ? (
    <div className="p-4 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
      <p className="text-amber-800 dark:text-amber-300 text-sm font-medium mb-2">
        ⚠️ Budget amount field is unlocked for manual editing
      </p>
      <div className="text-amber-800 dark:text-amber-300 text-xs">
        <p>Budget amount can be manually adjusted. Click the lock icon to secure this field and prevent accidental changes.</p>
      </div>
    </div>
  ) : null

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
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="budget-type">Budget Type *</Label>
          {onToggleBudgetTypeLock && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onToggleBudgetTypeLock}
              className="h-6 w-6 p-0"
            >
              {isBudgetTypeLocked ? (
                <Lock className="h-3 w-3" />
              ) : (
                <Pencil className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
        {/* Warning positioned between title and field (following Google pattern) */}
        {budgetTypeWarning}
        <Select 
          value={currentBudgetType} 
          onValueChange={handleBudgetTypeChange}
          disabled={isBudgetTypeLocked}
        >
          <SelectTrigger 
            id="budget-type" 
            className={`${errors?.budget_type ? 'border-destructive' : ''} ${isBudgetTypeLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
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
      </div>

      {/* Budget Amount (following Google pattern with individual lock) */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="campaign-budget">
            {currentBudgetType === 'LIFETIME' ? 'Lifetime Budget (USD) *' : 'Daily Budget (USD) *'}
          </Label>
          {onToggleBudgetAmountLock && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onToggleBudgetAmountLock}
              className="h-6 w-6 p-0"
            >
              {isBudgetAmountLocked ? (
                <Lock className="h-3 w-3" />
              ) : (
                <Pencil className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
        {/* Warning positioned between title and field (following Google pattern) */}
        {budgetAmountWarning}
        <Input
          id="campaign-budget"
          type="number"
          step="0.01"
          min="0"
          value={getBudgetDisplayValue()}
          onChange={(e) => handleBudgetChange(e.target.value, currentBudgetType)}
          placeholder="0.00"
          disabled={isBudgetAmountLocked}
          className={`${errors?.lifetime_budget || errors?.daily_budget ? 'border-destructive' : ''} ${isBudgetAmountLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {(errors?.lifetime_budget || errors?.daily_budget) && (
          <p className="text-xs text-destructive">
            {errors?.lifetime_budget || errors?.daily_budget}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {currentBudgetType === 'LIFETIME' 
            ? 'Enter the total amount you want to spend on this campaign'
            : 'Enter the maximum amount you want to spend per day'
          }
        </p>
      </div>

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
    </div>
  )
}