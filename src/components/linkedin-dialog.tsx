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
import { Button } from '@/components/ui/button'
import { getLinkedInConnectionStatus, LinkedInConnectionStatus } from '@/app/actions/linkedin-status'
import { disconnectLinkedIn } from '@/app/actions/linkedin-disconnect'
import { toast } from 'sonner'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface LinkedInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDisconnect?: () => Promise<void>
}

export function LinkedInDialog({ open, onOpenChange, onDisconnect }: LinkedInDialogProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [userInfo, setUserInfo] = useState<LinkedInConnectionStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [organizationName, setOrganizationName] = useState<string>('')
  
  const params = useParams()
  const organizationId = params?.orgId as string

  // Fetch organization name and LinkedIn user info when the dialog opens
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
        
        // Fetch LinkedIn user info
        const result = await getLinkedInConnectionStatus(organizationId)
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

  const handleDisconnect = async () => {
    if (!organizationId) {
      toast.error('Organization context missing', {
        description: 'Unable to determine which organization to disconnect from.'
      })
      return
    }
    
    try {
      setIsDisconnecting(true)
      
      const result = await disconnectLinkedIn(organizationId)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to disconnect LinkedIn account')
      }
      
      toast.success('LinkedIn account disconnected', {
        description: `Your LinkedIn account has been disconnected from ${organizationName}.`
      })
      
      onOpenChange(false)
      
      if (onDisconnect) {
        await onDisconnect()
      }
      
    } catch (error) {
      console.error('Error disconnecting LinkedIn account:', error)
      toast.error('Failed to disconnect LinkedIn account', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setIsDisconnecting(false)
    }
  }

  const displayName = userInfo?.displayName || 'LinkedIn User'
  
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
          <DialogTitle>LinkedIn Account</DialogTitle>
          <DialogDescription>
            Manage your LinkedIn connection for {organizationName || 'this organization'}.
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
                No LinkedIn account connected to {organizationName || 'this organization'}.
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
                <strong>Organization-specific connection:</strong> This LinkedIn account is only connected to {organizationName}. 
                You can connect different LinkedIn accounts to other organizations.
              </p>
            </div>
            
            {/* Disconnect Section */}
            <div className="pt-2 border-t">
              <p className="text-muted-foreground text-sm mb-4">
                Disconnecting will remove this LinkedIn account from {organizationName} only. 
                Your connections to other organizations will remain unchanged.
              </p>
              
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? 'Disconnecting...' : `Disconnect from ${organizationName}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}