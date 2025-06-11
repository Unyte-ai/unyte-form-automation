'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { MetaAdAccount } from '@/components/meta-ad-account'
import { MetaCreateCampaignAdSet } from '@/components/meta-create-campaign-adset'
import { getFacebookAdAccountsAndPages, FacebookAdAccount, FacebookPage } from '@/app/actions/facebook-ad-accounts'
import { toast } from 'sonner'

// Define interfaces for form data
interface FormQuestion {
  question: string;
  answer: string;
}

interface StructuredData {
  rawText: string;
  formData: FormQuestion[];
}

interface MetaCampaignProps {
  id: string
  onRemove: (id: string) => void
  organizationId: string
  formData?: StructuredData // Add formData prop
}

export function MetaCampaign({ id, onRemove, organizationId, formData }: MetaCampaignProps) {
  const [accounts, setAccounts] = useState<FacebookAdAccount[]>([])
  const [pages, setPages] = useState<FacebookPage[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
  const [accountsError, setAccountsError] = useState<string | null>(null)

  // Fetch Facebook ad accounts and pages when component mounts
  useEffect(() => {
    async function fetchAdAccountsAndPages() {
      try {
        setIsLoadingAccounts(true)
        setAccountsError(null)

        const result = await getFacebookAdAccountsAndPages(organizationId)

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch Facebook ad accounts and pages')
        }

        setAccounts(result.data?.adAccounts || [])
        setPages(result.data?.pages || [])
      } catch (error) {
        console.error('Error fetching Facebook ad accounts and pages:', error)
        setAccountsError(error instanceof Error ? error.message : 'Failed to fetch ad accounts and pages')
        toast.error('Failed to fetch Facebook ad accounts and pages', {
          description: error instanceof Error ? error.message : 'An unexpected error occurred'
        })
      } finally {
        setIsLoadingAccounts(false)
      }
    }

    fetchAdAccountsAndPages()
  }, [organizationId])

  // Handle ad account selection
  const handleAdAccountChange = (value: string) => {
    setSelectedAccount(value)
  }

  // Handle successful campaign creation
  const handleCampaignCreated = async (createdCampaign: { 
    campaignId: string
    campaignName: string
    adSetId: string
    adSetName: string 
  }) => {
    console.log('Campaign created successfully:', createdCampaign)
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
            pages={pages}
            onChange={handleAdAccountChange}
            isLoading={isLoadingAccounts}
            organizationId={organizationId}
          />
        )}

        {/* Create New Campaign & Ad Set - Only show when ad account is selected */}
        {selectedAccount && (
          <MetaCreateCampaignAdSet
            organizationId={organizationId}
            selectedAdAccount={selectedAccount}
            onCampaignCreated={handleCampaignCreated}
            formData={formData}
          />
        )}
      </CardContent>
    </Card>
  )
}