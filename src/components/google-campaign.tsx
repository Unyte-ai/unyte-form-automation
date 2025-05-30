'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { GoogleAdAccount } from '@/components/google-ad-account'
import { getGoogleAdAccounts, GoogleAdAccount as GoogleAdAccountType } from '@/app/actions/google-ad-accounts'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface GoogleCampaignProps {
  id: string
  onRemove: (id: string) => void
  organizationId: string
}

export function GoogleCampaign({ id, onRemove, organizationId }: GoogleCampaignProps) {
  const [accounts, setAccounts] = useState<GoogleAdAccountType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')

  // Load Google ad accounts on component mount
  useEffect(() => {
    async function loadAccounts() {
      if (!organizationId) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
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
        setIsLoading(false)
      }
    }

    loadAccounts()
  }, [organizationId])

  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId)
    console.log('Selected Google ad account:', accountId)
    // TODO: Store the selected account for campaign creation
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
        <CardTitle>Google Ads Campaign</CardTitle>
        <CardDescription>Create a campaign for Google Ads</CardDescription>
      </CardHeader>
      
      <CardContent>
        <GoogleAdAccount 
          accounts={accounts}
          onChange={handleAccountChange}
          isLoading={isLoading}
        />
        
        {selectedAccountId && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md dark:bg-green-950/30 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-300">
              <strong>Selected Account:</strong> {accounts.find(acc => acc.id === selectedAccountId)?.name}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}