'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { MetaAdAccount } from '@/components/meta-ad-account'
import { MetaAdCampaign } from '@/components/meta-ad-campaign'
import { getFacebookAdAccounts, FacebookAdAccount } from '@/app/actions/facebook-ad-accounts'
import { getFacebookAdCampaigns, FacebookAdCampaign } from '@/app/actions/facebook-ad-campaigns'
import { toast } from 'sonner'

interface MetaCampaignProps {
  id: string
  onRemove: (id: string) => void
  organizationId: string
}

export function MetaCampaign({ id, onRemove, organizationId }: MetaCampaignProps) {
  const [accounts, setAccounts] = useState<FacebookAdAccount[]>([])
  const [campaigns, setCampaigns] = useState<FacebookAdCampaign[]>([])
  
  const [selectedAccount, setSelectedAccount] = useState<string>('')

  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false)
  
  const [accountsError, setAccountsError] = useState<string | null>(null)
  const [campaignsError, setCampaignsError] = useState<string | null>(null)

  // Fetch Facebook ad accounts when component mounts
  useEffect(() => {
    async function fetchAdAccounts() {
      try {
        setIsLoadingAccounts(true)
        setAccountsError(null)
        
        const result = await getFacebookAdAccounts(organizationId)
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch Facebook ad accounts')
        }
        
        setAccounts(result.data || [])
      } catch (error) {
        console.error('Error fetching Facebook ad accounts:', error)
        setAccountsError(error instanceof Error ? error.message : 'Failed to fetch ad accounts')
        toast.error('Failed to fetch Facebook ad accounts', {
          description: error instanceof Error ? error.message : 'An unexpected error occurred'
        })
      } finally {
        setIsLoadingAccounts(false)
      }
    }
    
    fetchAdAccounts()
  }, [organizationId])

  // Fetch campaigns when an ad account is selected
  useEffect(() => {
    async function fetchCampaigns() {
      if (!selectedAccount) {
        setCampaigns([])
        return
      }

      try {
        setIsLoadingCampaigns(true)
        setCampaignsError(null)
        
        const result = await getFacebookAdCampaigns(organizationId, selectedAccount)
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch Facebook campaigns')
        }
        
        setCampaigns(result.data || [])
      } catch (error) {
        console.error('Error fetching Facebook campaigns:', error)
        setCampaignsError(error instanceof Error ? error.message : 'Failed to fetch campaigns')
        toast.error('Failed to fetch Facebook campaigns', {
          description: error instanceof Error ? error.message : 'An unexpected error occurred'
        })
      } finally {
        setIsLoadingCampaigns(false)
      }
    }
    
    fetchCampaigns()
  }, [organizationId, selectedAccount])

  // Handle ad account selection
  const handleAdAccountChange = (value: string) => {
    setSelectedAccount(value)
    // Reset campaigns when account changes
    setCampaigns([])
  }

  // Handle campaign selection
  const handleCampaignChange = (value: string) => {
    console.log('Selected Facebook campaign:', value)
    // You can add additional logic here when a campaign is selected
  }

  return (
    <Card className="mb-4 relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2 h-6 w-6" 
        onClick={() => onRemove(id)}
      >
        <X className="h-4 w-4" />
      </Button>
      <CardHeader>
        <CardTitle>Meta</CardTitle>
        <CardDescription>Create a campaign for Meta</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ad Account Selection */}
        {accountsError ? (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400">
            <p className="text-sm">{accountsError}</p>
          </div>
        ) : (
          <MetaAdAccount 
            accounts={accounts} 
            onChange={handleAdAccountChange}
            isLoading={isLoadingAccounts}
          />
        )}

        {/* Campaign Selection */}
        {campaignsError ? (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400">
            <p className="text-sm">{campaignsError}</p>
          </div>
        ) : (
          <MetaAdCampaign
            campaigns={campaigns}
            onChange={handleCampaignChange}
            isLoading={isLoadingCampaigns}
          />
        )}
      </CardContent>
    </Card>
  )
}