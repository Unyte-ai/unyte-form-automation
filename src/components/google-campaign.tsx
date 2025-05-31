'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { GoogleAdAccount } from '@/components/google-ad-account'
import { GoogleSubAccounts } from '@/components/google-sub-accounts'
import { GoogleAdCampaign } from '@/components/google-ad-campaign'
import { getGoogleAdAccounts, GoogleAdAccount as GoogleAdAccountType } from '@/app/actions/google-ad-accounts'
import { getGoogleSubAccounts, GoogleSubAccount } from '@/app/actions/google-sub-accounts'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface GoogleCampaignProps {
  id: string
  onRemove: (id: string) => void
  organizationId: string
}

export function GoogleCampaign({ id, onRemove, organizationId }: GoogleCampaignProps) {
  const [accounts, setAccounts] = useState<GoogleAdAccountType[]>([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  
  // Sub-accounts state
  const [subAccounts, setSubAccounts] = useState<GoogleSubAccount[]>([])
  const [isLoadingSubAccounts, setIsLoadingSubAccounts] = useState(false)
  const [selectedSubAccountId, setSelectedSubAccountId] = useState<string>('')

  // Load Google ad accounts on component mount
  useEffect(() => {
    async function loadAccounts() {
      if (!organizationId) {
        setIsLoadingAccounts(false)
        return
      }

      try {
        setIsLoadingAccounts(true)
        const result = await getGoogleAdAccounts(organizationId)
        
        if (result.success && result.data) {
          setAccounts(result.data)
        } else {
          console.error('Failed to load Google ad accounts:', result.error)
          toast.error('Failed to load Google ad accounts', {
            description: result.error || 'An unexpected error occurred'
          })
          setAccounts([])
        }
      } catch (error) {
        console.error('Error loading Google ad accounts:', error)
        toast.error('Failed to load Google ad accounts', {
          description: 'An unexpected error occurred while loading accounts'
        })
        setAccounts([])
      } finally {
        setIsLoadingAccounts(false)
      }
    }

    loadAccounts()
  }, [organizationId])

  // Load sub-accounts when a manager account is selected
  useEffect(() => {
    async function loadSubAccounts() {
      if (!selectedAccountId || !organizationId) {
        setSubAccounts([])
        setSelectedSubAccountId('')
        return
      }

      // Check if the selected account is a manager account
      const selectedAccount = accounts.find(acc => acc.id === selectedAccountId)
      if (!selectedAccount?.isManager) {
        setSubAccounts([])
        setSelectedSubAccountId('')
        return
      }

      try {
        setIsLoadingSubAccounts(true)
        const result = await getGoogleSubAccounts(organizationId, selectedAccountId)
        
        if (result.success && result.data) {
          setSubAccounts(result.data)
          setSelectedSubAccountId('') // Reset sub-account selection
        } else {
          console.error('Failed to load Google sub-accounts:', result.error)
          toast.error('Failed to load sub-accounts', {
            description: result.error || 'An unexpected error occurred'
          })
          setSubAccounts([])
        }
      } catch (error) {
        console.error('Error loading Google sub-accounts:', error)
        toast.error('Failed to load sub-accounts', {
          description: 'An unexpected error occurred while loading sub-accounts'
        })
        setSubAccounts([])
      } finally {
        setIsLoadingSubAccounts(false)
      }
    }

    loadSubAccounts()
  }, [selectedAccountId, organizationId, accounts])

  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId)
    setSelectedSubAccountId('') // Reset sub-account selection when main account changes
    console.log('Selected Google ad account:', accountId)
  }

  const handleSubAccountChange = (subAccountId: string) => {
    setSelectedSubAccountId(subAccountId)
    console.log('Selected Google sub-account:', subAccountId)
  }

  // Determine which account to show as selected (sub-account takes precedence if available)
  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId)
  const selectedSubAccount = subAccounts.find(acc => acc.id === selectedSubAccountId)
  const isManagerSelected = selectedAccount?.isManager && selectedAccountId
  const finalSelectedAccount = selectedSubAccount || (selectedAccount && !selectedAccount.isManager ? selectedAccount : null)

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
        <CardTitle>Google Ads Campaign</CardTitle>
        <CardDescription>Create a campaign for Google Ads</CardDescription>
      </CardHeader>
      
      <CardContent>
        <GoogleAdAccount 
          accounts={accounts}
          onChange={handleAccountChange}
          isLoading={isLoadingAccounts}
        />
        
        {/* Show sub-accounts selector if manager account is selected */}
        {isManagerSelected && (
          <GoogleSubAccounts
            subAccounts={subAccounts}
            onChange={handleSubAccountChange}
            isLoading={isLoadingSubAccounts}
            managerAccountName={selectedAccount?.name}
          />
        )}
        
        {/* Show final selection confirmation */}
        {finalSelectedAccount && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md dark:bg-green-950/30 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-300">
              <strong>Campaign Account:</strong> {finalSelectedAccount.name}
              {selectedSubAccount && selectedAccount && (
                <span className="block text-xs mt-1 opacity-75">
                  Managed by: {selectedAccount.name}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Show manager account info if selected but no sub-account chosen */}
        {isManagerSelected && !selectedSubAccountId && subAccounts.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-950/30 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Manager Account Selected:</strong> Please select a sub-account to use for campaign creation.
            </p>
          </div>
        )}

        {/* Show GoogleAdCampaign component when an account is selected */}
        {finalSelectedAccount && (
          <GoogleAdCampaign
            customerId={finalSelectedAccount.id}
            accountName={finalSelectedAccount.name}
            organizationId={organizationId}
            managerCustomerId={selectedSubAccount ? selectedAccountId : undefined}
          />
        )}
      </CardContent>
    </Card>
  )
}