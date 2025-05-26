'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Loader2 } from 'lucide-react'
import { createFacebookAdSet, CreateFacebookAdSetData } from '@/app/actions/facebook-create-adset'
import { toast } from 'sonner'

interface MetaCreateAdSetProps {
  organizationId: string
  selectedAccount: string // Ad Account ID
  selectedCampaign: string // Campaign ID
  onAdSetCreated?: (adSet: { id: string; name: string }) => void
}

export function MetaCreateAdSet({ 
  organizationId, 
  selectedAccount,
  selectedCampaign,
  onAdSetCreated 
}: MetaCreateAdSetProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [dailyBudgetDollars, setDailyBudgetDollars] = useState('')
  const [ageMin, setAgeMin] = useState(18)
  const [ageMax, setAgeMax] = useState(65)
  
  // Targeting state
  const [countries, setCountries] = useState<string[]>(['US'])
  const [placements, setPlacements] = useState<('facebook' | 'instagram' | 'messenger')[]>(['facebook', 'instagram'])
  
  // Date state
  const [startTime, setStartTime] = useState(() => {
    // Default to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [endTime, setEndTime] = useState('')

  // Available countries (you can expand this list)
  const availableCountries = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'SE', name: 'Sweden' }
  ]

  const handleCountryChange = (countryCode: string, checked: boolean) => {
    if (checked) {
      setCountries(prev => [...prev, countryCode])
    } else {
      setCountries(prev => prev.filter(c => c !== countryCode))
    }
  }

  const handlePlacementChange = (placement: 'facebook' | 'instagram' | 'messenger', checked: boolean) => {
    if (checked) {
      setPlacements(prev => [...prev, placement])
    } else {
      setPlacements(prev => prev.filter(p => p !== placement))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !dailyBudgetDollars.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    const dailyBudgetCents = Math.round(parseFloat(dailyBudgetDollars) * 100)
    
    if (dailyBudgetCents <= 0) {
      toast.error('Daily budget must be greater than $0.00')
      return
    }

    if (countries.length === 0) {
      toast.error('Please select at least one target country')
      return
    }

    if (placements.length === 0) {
      toast.error('Please select at least one placement')
      return
    }

    if (ageMin < 13 || ageMin > 65) {
      toast.error('Minimum age must be between 13 and 65')
      return
    }

    if (ageMax < ageMin || ageMax > 65) {
      toast.error('Maximum age must be greater than minimum age and not exceed 65')
      return
    }

    if (!startTime) {
      toast.error('Please select a start date')
      return
    }

    if (endTime && new Date(endTime) <= new Date(startTime)) {
      toast.error('End date must be after start date')
      return
    }

    try {
      setIsCreating(true)

      // Prepare ad set data
      const adSetData: CreateFacebookAdSetData = {
        campaignId: selectedCampaign,
        name: name.trim(),
        dailyBudget: dailyBudgetCents,
        targeting: {
          countries,
          ageMin,
          ageMax,
          placements
        },
        startTime: startTime,
        endTime: endTime || undefined
      }

      // Call server action
      const result = await createFacebookAdSet(organizationId, selectedAccount, adSetData)

      if (!result.success) {
        throw new Error(result.error || 'Failed to create ad set')
      }

      // Success
      toast.success('Ad set created successfully', {
        description: `Ad set "${name}" has been created and is paused by default for safety.`
      })

      // Reset form
      setName('')
      setDailyBudgetDollars('')
      setAgeMin(18)
      setAgeMax(65)
      setCountries(['US'])
      setPlacements(['facebook', 'instagram'])
      // Reset dates
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setStartTime(tomorrow.toISOString().split('T')[0])
      setEndTime('')
      setIsExpanded(false)

      // Notify parent component
      if (onAdSetCreated && result.data) {
        onAdSetCreated(result.data)
      }

    } catch (error) {
      console.error('Error creating Facebook ad set:', error)
      toast.error('Failed to create ad set', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setIsCreating(false)
    }
  }

  if (!isExpanded) {
    return (
      <div className="border-t pt-4">
        <Button 
          variant="ghost" 
          onClick={() => setIsExpanded(true)}
          className="w-full justify-start text-sm"
          disabled={!selectedAccount || !selectedCampaign}
        >
          <Plus className="mr-2 size-4" />
          Create New Ad Set
        </Button>
        {(!selectedAccount || !selectedCampaign) && (
          <p className="text-xs text-muted-foreground mt-2 px-2">
            Select an account and campaign first to create an ad set
          </p>
        )}
      </div>
    )
  }

  return (
    <Card className="border-t-0 rounded-t-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Create New Ad Set</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ad Set Name */}
          <div className="grid gap-2">
            <Label htmlFor="adset-name">Ad Set Name *</Label>
            <Input
              id="adset-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter ad set name"
              required
            />
          </div>

          {/* Daily Budget */}
          <div className="grid gap-2">
            <Label htmlFor="daily-budget">Daily Budget (USD) *</Label>
            <Input
              id="daily-budget"
              type="number"
              step="0.01"
              min="0.01"
              value={dailyBudgetDollars}
              onChange={(e) => setDailyBudgetDollars(e.target.value)}
              placeholder="10.00"
              required
            />
            <p className="text-xs text-muted-foreground">
              Minimum daily budget is $1.00
            </p>
          </div>

          {/* Age Targeting */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="age-min">Minimum Age *</Label>
              <Input
                id="age-min"
                type="number"
                min="13"
                max="65"
                value={ageMin}
                onChange={(e) => setAgeMin(parseInt(e.target.value) || 18)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="age-max">Maximum Age *</Label>
              <Input
                id="age-max"
                type="number"
                min="13"
                max="65"
                value={ageMax}
                onChange={(e) => setAgeMax(parseInt(e.target.value) || 65)}
                required
              />
            </div>
          </div>

          {/* Countries */}
          <div className="grid gap-2">
            <Label>Target Countries *</Label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
              {availableCountries.map(country => (
                <label key={country.code} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={countries.includes(country.code)}
                    onChange={(e) => handleCountryChange(country.code, e.target.checked)}
                    className="rounded"
                  />
                  <span>{country.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Selected: {countries.join(', ')}
            </p>
          </div>

          {/* Placements */}
          <div className="grid gap-2">
            <Label>Placements *</Label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={placements.includes('facebook')}
                  onChange={(e) => handlePlacementChange('facebook', e.target.checked)}
                  className="rounded"
                />
                <span>Facebook</span>
              </label>
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={placements.includes('instagram')}
                  onChange={(e) => handlePlacementChange('instagram', e.target.checked)}
                  className="rounded"
                />
                <span>Instagram</span>
              </label>
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={placements.includes('messenger')}
                  onChange={(e) => handlePlacementChange('messenger', e.target.checked)}
                  className="rounded"
                />
                <span>Messenger</span>
              </label>
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start-time">Start Date *</Label>
              <Input
                id="start-time"
                type="date"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-time">End Date</Label>
              <Input
                id="end-time"
                type="date"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                min={startTime}
              />
            </div>
          </div>

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
                'Create Ad Set'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}