'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { LinkedInAdAccount } from '@/components/linkedin-ad-account'
import { LinkedInCampaignGroups } from '@/components/linkedin-campaign-groups'
import { getLinkedInAdAccounts, LinkedInAdAccount as AdAccountType } from '@/app/actions/linkedin-ad-accounts'
import { getLinkedInCampaignGroups, LinkedInCampaignGroup } from '@/app/actions/linkedin-campaign-groups'
import { toast } from 'sonner'

interface LinkedInCampaignProps {
  id: string
  onRemove: (id: string) => void
  organizationId: string
}

export function LinkedInCampaign({ id, onRemove, organizationId }: LinkedInCampaignProps) {
  const [accounts, setAccounts] = useState<AdAccountType[]>([])
  const [campaignGroups, setCampaignGroups] = useState<LinkedInCampaignGroup[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')

  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
  const [isLoadingCampaignGroups, setIsLoadingCampaignGroups] = useState(false)
  const [accountsError, setAccountsError] = useState<string | null>(null)
  const [campaignGroupsError, setCampaignGroupsError] = useState<string | null>(null)

  // Fetch LinkedIn ad accounts when component mounts
  useEffect(() => {
    async function fetchAdAccounts() {
      try {
        setIsLoadingAccounts(true)
        setAccountsError(null)
        
        const result = await getLinkedInAdAccounts(organizationId)
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch LinkedIn ad accounts')
        }
        
        setAccounts(result.data || [])
      } catch (error) {
        console.error('Error fetching LinkedIn ad accounts:', error)
        setAccountsError(error instanceof Error ? error.message : 'Failed to fetch ad accounts')
        toast.error('Failed to fetch LinkedIn ad accounts', {
          description: error instanceof Error ? error.message : 'An unexpected error occurred'
        })
      } finally {
        setIsLoadingAccounts(false)
      }
    }
    
    fetchAdAccounts()
  }, [organizationId])

  // Fetch campaign groups when an ad account is selected
  useEffect(() => {
    async function fetchCampaignGroups() {
      if (!selectedAccount) {
        setCampaignGroups([])
        return
      }

      try {
        setIsLoadingCampaignGroups(true)
        setCampaignGroupsError(null)
        
        const result = await getLinkedInCampaignGroups(organizationId, selectedAccount)
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch LinkedIn campaign groups')
        }
        
        setCampaignGroups(result.data || [])
      } catch (error) {
        console.error('Error fetching LinkedIn campaign groups:', error)
        setCampaignGroupsError(error instanceof Error ? error.message : 'Failed to fetch campaign groups')
        toast.error('Failed to fetch LinkedIn campaign groups', {
          description: error instanceof Error ? error.message : 'An unexpected error occurred'
        })
      } finally {
        setIsLoadingCampaignGroups(false)
      }
    }
    
    fetchCampaignGroups()
  }, [organizationId, selectedAccount])

  // Handle ad account selection
  const handleAdAccountChange = (value: string) => {
    setSelectedAccount(value)
  }

  // Handle campaign group selection
  const handleCampaignGroupChange = (value: string) => {
    // Campaign group selection - value can be used later when needed
    console.log('Selected campaign group:', value)
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
        <CardTitle>LinkedIn</CardTitle>
        <CardDescription>Create a campaign for LinkedIn</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {accountsError ? (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400">
            <p className="text-sm">{accountsError}</p>
          </div>
        ) : (
          <LinkedInAdAccount 
            accounts={accounts} 
            onChange={handleAdAccountChange}
            isLoading={isLoadingAccounts}
          />
        )}

        {campaignGroupsError ? (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400">
            <p className="text-sm">{campaignGroupsError}</p>
          </div>
        ) : (
          <LinkedInCampaignGroups
            campaignGroups={campaignGroups}
            onChange={handleCampaignGroupChange}
            isLoading={isLoadingCampaignGroups}
          />
        )}
      </CardContent>
    </Card>
  )
}