import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FacebookCampaignData,
  CAMPAIGN_OBJECTIVES,
  formatBudgetCents,
  parseBudgetToCents
} from '@/lib/facebook-campaign-utils'

interface MetaCampaignFieldsProps {
  value: Partial<FacebookCampaignData>
  onChange: (value: Partial<FacebookCampaignData>) => void
  errors?: Record<string, string>
}

export function MetaCampaignFields({ value, onChange, errors }: MetaCampaignFieldsProps) {
  // Handle form field changes
  const handleFieldChange = (field: keyof FacebookCampaignData, fieldValue: FacebookCampaignData[keyof FacebookCampaignData]) => {
    onChange({
      ...value,
      [field]: fieldValue
    })
  }

  // Handle budget change with cent conversion
  const handleBudgetChange = (budgetString: string) => {
    if (budgetString === '') {
      handleFieldChange('lifetime_budget', 0)
      return
    }
    
    const cents = parseBudgetToCents(budgetString)
    handleFieldChange('lifetime_budget', cents)
  }

  // Get current budget as string for display
  const getBudgetDisplayValue = (): string => {
    if (!value.lifetime_budget || value.lifetime_budget === 0) {
      return ''
    }
    return formatBudgetCents(value.lifetime_budget)
  }

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

      {/* Lifetime Budget */}
      <div className="grid gap-2">
        <Label htmlFor="campaign-budget">Lifetime Budget (USD) *</Label>
        <Input
          id="campaign-budget"
          type="number"
          step="0.01"
          min="0"
          value={getBudgetDisplayValue()}
          onChange={(e) => handleBudgetChange(e.target.value)}
          placeholder="0.00"
          className={errors?.lifetime_budget ? 'border-destructive' : ''}
        />
        {errors?.lifetime_budget && (
          <p className="text-xs text-destructive">{errors.lifetime_budget}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Enter the total amount you want to spend on this campaign
        </p>
      </div>
    </div>
  )
}