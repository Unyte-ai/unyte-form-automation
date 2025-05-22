'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Loader2 } from 'lucide-react'
import { createLinkedInCampaign, CreateLinkedInCampaignData } from '@/app/actions/linkedin-create-ad-campaign'
import { toast } from 'sonner'

interface LinkedInCreateAdCampaignProps {
  organizationId: string
  selectedAccount: string // Ad Account URN
  selectedCampaignGroup: string // Campaign Group URN
  onCampaignCreated?: (campaign: { id: string; name: string }) => void
}

export function LinkedInCreateAdCampaign({ 
  organizationId, 
  selectedAccount, 
  selectedCampaignGroup,
  onCampaignCreated 
}: LinkedInCreateAdCampaignProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [campaignType, setCampaignType] = useState<'SPONSORED_UPDATES' | 'TEXT_AD' | 'SPONSORED_INMAILS' | 'DYNAMIC'>('SPONSORED_UPDATES')
  const [budgetAmount, setBudgetAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [country, setCountry] = useState('US')
  const [language, setLanguage] = useState('en')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !budgetAmount.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    if (parseFloat(budgetAmount) <= 0) {
      toast.error('Budget amount must be greater than 0')
      return
    }

    try {
      setIsCreating(true)

      // Prepare campaign data
      const campaignData: CreateLinkedInCampaignData = {
        account: selectedAccount,
        campaignGroup: selectedCampaignGroup,
        costType: 'CPM', // Use CPM as default - works for all campaign types
        name: name.trim(),
        type: campaignType,
        locale: {
          country,
          language
        },
        totalBudget: {
          amount: budgetAmount,
          currencyCode: currency
        },
        // Basic targeting criteria - can be expanded later
        targetingCriteria: {
          include: {
            and: [
              {
                or: {
                  'urn:li:adTargetingFacet:locations': [
                    `urn:li:geo:103644278` // Default to United States
                  ]
                }
              },
              {
                or: {
                  'urn:li:adTargetingFacet:interfaceLocales': [
                    `urn:li:locale:${language}_${country}`
                  ]
                }
              }
            ]
          }
        }
      }

      // Call server action
      const result = await createLinkedInCampaign(organizationId, campaignData)

      if (!result.success) {
        throw new Error(result.error || 'Failed to create campaign')
      }

      // Success
      toast.success('Campaign created successfully', {
        description: `Draft campaign "${name}" has been created and can be edited in LinkedIn Campaign Manager.`
      })

      // Reset form
      setName('')
      setBudgetAmount('')
      setIsExpanded(false)

      // Notify parent component
      if (onCampaignCreated && result.data) {
        onCampaignCreated(result.data)
      }

    } catch (error) {
      console.error('Error creating LinkedIn campaign:', error)
      toast.error('Failed to create campaign', {
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
        <CardTitle className="text-base">Create New Campaign</CardTitle>
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

          {/* Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="budget-amount">Total Budget *</Label>
              <Input
                id="budget-amount"
                type="number"
                step="0.01"
                min="0"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
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