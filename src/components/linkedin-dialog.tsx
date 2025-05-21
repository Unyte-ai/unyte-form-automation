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
import { toast } from 'sonner'
import { useParams } from 'next/navigation' // Add this import

interface LinkedInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDisconnect?: () => Promise<void>
}

export function LinkedInDialog({ open, onOpenChange, onDisconnect }: LinkedInDialogProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [userInfo, setUserInfo] = useState<LinkedInConnectionStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const params = useParams() // Get URL params
  const organizationId = params?.orgId as string // Extract organization ID

  // Fetch LinkedIn user info when the dialog opens
  useEffect(() => {
    async function fetchLinkedInUserInfo() {
      if (!open) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        // Pass the organization ID when fetching status
        const result = await getLinkedInConnectionStatus(organizationId)
        setUserInfo(result)
      } catch (error) {
        console.error('Error fetching LinkedIn user info:', error)
        setError(error instanceof Error ? error.message : 'An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchLinkedInUserInfo()
  }, [open, organizationId]) // Add organizationId as dependency

  // Function to handle disconnecting - we'll implement this later
  const handleDisconnect = async () => {
    try {
      // For now, just show a toast
      toast.info('LinkedIn disconnect functionality coming soon')
      
      // Close dialog
      onOpenChange(false)
      
      // Call onDisconnect to refresh connection status if provided
      if (onDisconnect) {
        await onDisconnect()
      }
    } catch (error) {
      console.error('Error disconnecting LinkedIn account:', error)
      toast.error('Failed to disconnect LinkedIn account', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    }
  }

  // Get display name
  const displayName = userInfo?.displayName || 'LinkedIn User'
  
  // Get initials for avatar fallback
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
            Manage your connected LinkedIn account settings.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-pulse h-4 w-3/4 bg-muted rounded"></div>
          </div>
        ) : error ? (
          <div className="py-4 text-destructive">
            <p>{error}</p>
          </div>
        ) : !userInfo?.isConnected ? (
          <div className="py-4">
            <p className="text-muted-foreground text-sm">
              No LinkedIn account information available.
            </p>
          </div>
        ) : (
          <div className="py-4 space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {userInfo.profilePicture && <AvatarImage src={userInfo.profilePicture} alt={displayName} />}
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="font-medium text-lg">{displayName}</h3>
                {userInfo.email && (
                  <p className="text-muted-foreground text-sm">
                    {userInfo.email}
                  </p>
                )}
              </div>
            </div>
            
            <div className="pt-2">
              <p className="text-muted-foreground text-sm mb-4">
                This LinkedIn account is linked to your profile. You can disconnect it at any time.
              </p>
              
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDisconnect}
              >
                Disconnect LinkedIn
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}