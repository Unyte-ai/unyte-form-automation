import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Lock } from 'lucide-react'

interface LinkedInCampaignBudgetSectionProps {
  budgetType: 'daily' | 'total'
  setBudgetType: (type: 'daily' | 'total') => void
  budgetAmount: string
  setBudgetAmount: (amount: string) => void
  currency: string
  setCurrency: (currency: string) => void
  isBudgetLocked: boolean
  toggleBudgetLock: () => void
  isCreating: boolean
}

export function LinkedInCampaignBudgetSection({
  budgetType,
  setBudgetType,
  budgetAmount,
  setBudgetAmount,
  currency,
  setCurrency,
  isBudgetLocked,
  toggleBudgetLock,
  isCreating
}: LinkedInCampaignBudgetSectionProps) {
  return (
    <>
      {/* Budget Type Selection */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="budget-type">Budget Type *</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleBudgetLock}
            disabled={isCreating}
            className="h-6 w-6 p-0"
          >
            {isBudgetLocked ? (
              <Lock className="h-3 w-3" />
            ) : (
              <Pencil className="h-3 w-3" />
            )}
          </Button>
        </div>
        <Select 
          value={budgetType} 
          onValueChange={(value) => setBudgetType(value as 'daily' | 'total')}
          disabled={isCreating || isBudgetLocked}
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
            ? "Amount to spend per day (resets at midnight UTC). LinkedIn may spend up to 150% on high-opportunity days."
            : "Total amount to spend over the campaign lifetime"
          }
        </p>
      </div>

      {/* Budget Amount and Currency */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="budget-amount">
              {budgetType === 'daily' ? 'Daily Budget *' : 'Total Budget *'}
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleBudgetLock}
              disabled={isCreating}
              className="h-6 w-6 p-0"
            >
              {isBudgetLocked ? (
                <Lock className="h-3 w-3" />
              ) : (
                <Pencil className="h-3 w-3" />
              )}
            </Button>
          </div>
          <Input
            id="budget-amount"
            type="number"
            step="0.01"
            min="0"
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(e.target.value)}
            placeholder="0.00"
            disabled={isCreating || isBudgetLocked}
            className={isBudgetLocked ? 'opacity-50 cursor-not-allowed' : ''}
            required
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="currency">Currency</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleBudgetLock}
              disabled={isCreating}
              className="h-6 w-6 p-0"
            >
              {isBudgetLocked ? (
                <Lock className="h-3 w-3" />
              ) : (
                <Pencil className="h-3 w-3" />
              )}
            </Button>
          </div>
          <Select 
            value={currency} 
            onValueChange={setCurrency}
            disabled={isCreating || isBudgetLocked}
          >
            <SelectTrigger 
              id="currency"
              className={isBudgetLocked ? 'opacity-50 cursor-not-allowed' : ''}
            >
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
    </>
  )
}