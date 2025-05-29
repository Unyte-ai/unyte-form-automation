'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getGoogleConnectionStatus, GoogleConnectionStatus } from '@/app/actions/google-status'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface GoogleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDisconnect?: () => Promise<void>
}

export function GoogleDialog({ open, onOpenChange }: GoogleDialogProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [userInfo, setUserInfo] = useState<GoogleConnectionStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [organizationName, setOrganizationName] = useState<string>('')
  
  const params = useParams()
  const organizationId = params?.orgId as string

  // Fetch organization name and Google user info when the dialog opens
  useEffect(() => {
    async function fetchData() {
      if (!open || !organizationId) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        // Fetch organization name for better UX context
        const supabase = createClient()
        const { data: orgData } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', organizationId)
          .single()
        
        setOrganizationName(orgData?.name || 'this organization')
        
        // Fetch Google user info
        const result = await getGoogleConnectionStatus(organizationId)
        setUserInfo(result)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error instanceof Error ? error.message : 'An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [open, organizationId])

  const displayName = userInfo?.displayName || 'Google User'
  
  const initials = displayName
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
    
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Google Account</DialogTitle>
          <DialogDescription>
            Your Google connection for {organizationName || 'this organization'}.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="space-y-3">
              <div className="animate-pulse h-4 w-3/4 bg-muted rounded mx-auto"></div>
              <div className="animate-pulse h-3 w-1/2 bg-muted rounded mx-auto"></div>
            </div>
          </div>
        ) : error ? (
          <div className="py-4">
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400">
              <p className="text-sm font-medium">Connection Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        ) : !userInfo?.isConnected ? (
          <div className="py-4">
            <div className="p-3 rounded-md bg-muted/50 border">
              <p className="text-muted-foreground text-sm">
                No Google account connected to {organizationName || 'this organization'}.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-6">
            {/* User Profile Section */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {userInfo.profilePicture && <AvatarImage src={userInfo.profilePicture} alt={displayName} />}
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h3 className="font-medium text-lg">{displayName}</h3>
                {userInfo.email && (
                  <p className="text-muted-foreground text-sm">
                    {userInfo.email}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Connected to {organizationName}
                </p>
              </div>
            </div>
            
            {/* Connection Info */}
            <div className="p-3 rounded-md bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
              <p className="text-blue-800 dark:text-blue-300 text-sm">
                <strong>Organization-specific connection:</strong> This Google account is only connected to {organizationName}. 
                You can connect different Google accounts to other organizations.
              </p>
            </div>
            
            {/* Available Services */}
            <div className="p-3 rounded-md bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800">
              <p className="text-green-800 dark:text-green-300 text-sm">
                <strong>Connected Services:</strong> Google Ads API access is enabled for campaign management and analytics.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}