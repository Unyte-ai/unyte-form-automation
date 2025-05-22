// src/components/linkedin-campaign.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { LinkedInAdAccount } from '@/components/linkedin-ad-account'
import { getLinkedInAdAccounts, LinkedInAdAccount as AdAccountType } from '@/app/actions/linkedin-ad-accounts'
import { toast } from 'sonner'

interface LinkedInCampaignProps {
  id: string
  onRemove: (id: string) => void
  organizationId: string // Add organizationId prop
}

export function LinkedInCampaign({ id, onRemove, organizationId }: LinkedInCampaignProps) {
  const [accounts, setAccounts] = useState<AdAccountType[]>([])
  const [, setSelectedAccount] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch LinkedIn ad accounts when component mounts
  useEffect(() => {
    async function fetchAdAccounts() {
      try {
        setIsLoading(true)
        setError(null)
        
        const result = await getLinkedInAdAccounts(organizationId)
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch LinkedIn ad accounts')
        }
        
        setAccounts(result.data || [])
      } catch (error) {
        console.error('Error fetching LinkedIn ad accounts:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch ad accounts')
        toast.error('Failed to fetch LinkedIn ad accounts', {
          description: error instanceof Error ? error.message : 'An unexpected error occurred'
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchAdAccounts()
  }, [organizationId])

  // Handle ad account selection
  const handleAdAccountChange = (value: string) => {
    setSelectedAccount(value)
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
        {error ? (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400">
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <LinkedInAdAccount 
            accounts={accounts} 
            onChange={handleAdAccountChange}
            isLoading={isLoading}
          />
        )}
      </CardContent>
    </Card>
  )
}