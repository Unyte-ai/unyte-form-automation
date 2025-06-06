'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Loader2, Pencil, Lock } from 'lucide-react'
import { useLinkedInCampaignForm } from '@/hooks/useLinkedInCampaignForm'
import { useLinkedInAutoPopulate } from '@/hooks/useLinkedInAutoPopulate'
import { useLinkedInCampaignSubmission } from '@/hooks/useLinkedInCampaignSubmission'

interface FormQuestion {
  question: string;
  answer: string;
}

interface StructuredData {
  rawText: string;
  formData: FormQuestion[];
}

interface LinkedInCreateAdCampaignProps {
  organizationId: string
  selectedAccount: string // Ad Account URN
  selectedCampaignGroup: string // Campaign Group URN
  onCampaignCreated?: (campaign: { id: string; name: string }) => void
  formData?: StructuredData // Add formData prop
}

export function LinkedInCreateAdCampaign({ 
  organizationId, 
  selectedAccount, 
  selectedCampaignGroup,
  onCampaignCreated,
  formData // Add formData prop
}: LinkedInCreateAdCampaignProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Use custom hooks
  const {
    // Form state
    name,
    setName,
    campaignType,
    setCampaignType,
    budgetType,
    setBudgetType,
    budgetAmount,
    setBudgetAmount,
    currency,
    setCurrency,
    country,
    setCountry,
    language,
    setLanguage,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    
    // Lock states
    isBudgetLocked,
    setIsBudgetLocked,
    isDateLocked,
    setIsDateLocked,
    
    // Functions
    toggleBudgetLock,
    toggleDateLock,
    resetForm
  } = useLinkedInCampaignForm()

  // Auto-populate hook
  const { handleAutoPopulate } = useLinkedInAutoPopulate({
    formData,
    setName,
    setCampaignType,
    setBudgetType,
    setBudgetAmount,
    setCurrency,
    setCountry,
    setLanguage,
    setStartDate,
    setEndDate,
    setIsBudgetLocked,
    setIsDateLocked,
    campaignType
  })

  // Submission hook
  const { isCreating, handleSubmit } = useLinkedInCampaignSubmission({
    organizationId,
    selectedAccount,
    selectedCampaignGroup,
    name,
    campaignType,
    budgetType,
    budgetAmount,
    currency,
    country,
    language,
    startDate,
    endDate,
    resetForm,
    setIsExpanded,
    onCampaignCreated
  })

  // Handle expanding form and auto-populate
  const handleExpandAndAutoPopulate = () => {
    setIsExpanded(true)
    
    // Run auto-populate if form data is available
    if (formData?.formData) {
      handleAutoPopulate()
    }
  }

  if (!isExpanded) {
    return (
      <div className="border-t pt-4">
        <Button 
          variant="ghost" 
          onClick={handleExpandAndAutoPopulate}
          className="w-full justify-start text-sm"
        >
          <Plus className="mr-2 size-4" />
          Create New Campaign
        </Button>
      </div>
    )
  }

  return (
    <Card className="border-t-0 rounded-t-none">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">Create New Campaign</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campaign Name */}
          <div className="grid gap-2">
            <Label htmlFor="campaign-name">Campaign Name *</Label>
            <Input
              id="campaign-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter campaign name"
              required
            />
          </div>

          {/* Campaign Type */}
          <div className="grid gap-2">
            <Label htmlFor="campaign-type">Campaign Type *</Label>
            <Select value={campaignType} onValueChange={(value) => setCampaignType(value as 'SPONSORED_UPDATES' | 'TEXT_AD' | 'SPONSORED_INMAILS' | 'DYNAMIC')}>
              <SelectTrigger id="campaign-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SPONSORED_UPDATES">Sponsored Content</SelectItem>
                <SelectItem value="TEXT_AD">Text Ads</SelectItem>
                <SelectItem value="SPONSORED_INMAILS">Sponsored Messaging</SelectItem>
                <SelectItem value="DYNAMIC">Dynamic Ads</SelectItem>
              </SelectContent>
            </Select>
            {campaignType === 'SPONSORED_INMAILS' && (
              <p className="text-xs text-muted-foreground">
                Note: For Sponsored Messaging, Cost Per Send (CPS) is measured as CPM × 1000
              </p>
            )}
          </div>

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

          {/* Locale */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger id="country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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

          {/* Form Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setIsExpanded(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Draft Campaign'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}