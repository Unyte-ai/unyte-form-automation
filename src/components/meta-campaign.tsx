'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { MetaAdAccount } from '@/components/meta-ad-account'
import { getFacebookAdAccounts, FacebookAdAccount } from '@/app/actions/facebook-ad-accounts'
import { toast } from 'sonner'

interface MetaCampaignProps {
  id: string
  onRemove: (id: string) => void
  organizationId: string
}

export function MetaCampaign({ id, onRemove, organizationId }: MetaCampaignProps) {
  const [accounts, setAccounts] = useState<FacebookAdAccount[]>([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
  const [accountsError, setAccountsError] = useState<string | null>(null)

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

  // Handle ad account selection
  const handleAdAccountChange = (value: string) => {
    console.log('Selected Facebook ad account:', value)
    // You can add additional logic here when an account is selected
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
      </CardContent>
    </Card>
  )
}