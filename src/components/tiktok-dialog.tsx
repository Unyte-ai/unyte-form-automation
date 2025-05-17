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
import { getTikTokUserInfo, TikTokUserInfo } from '@/app/actions/tiktok-user-info'
import { disconnectTikTok } from '@/app/actions/tiktok-disconnect'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface TikTokDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TikTokDialog({ open, onOpenChange }: TikTokDialogProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [userInfo, setUserInfo] = useState<TikTokUserInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch TikTok user info when the dialog opens
  useEffect(() => {
    async function fetchTikTokUserInfo() {
      if (!open) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const result = await getTikTokUserInfo()
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch TikTok user info')
        }
        
        setUserInfo(result.data || null)
      } catch (error) {
        console.error('Error fetching TikTok user info:', error)
        setError(error instanceof Error ? error.message : 'An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchTikTokUserInfo()
  }, [open])

  // Handle disconnecting the TikTok account
  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true)
      
      // Call the server action to disconnect from TikTok
      const result = await disconnectTikTok()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to disconnect TikTok account')
      }
      
      toast.success('TikTok account disconnected', {
        description: 'Your TikTok account has been successfully disconnected.'
      })
      
      // Close the dialog
      onOpenChange(false)
      
      // Refresh the page to update the UI
      window.location.reload()
      
    } catch (error) {
      console.error('Error disconnecting TikTok account:', error)
      toast.error('Failed to disconnect TikTok account', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setIsDisconnecting(false)
    }
  }

  // Get display name and username
  const displayName = userInfo?.displayName || 'TikTok User';
  const username = userInfo?.username ? `@${userInfo.username}` : '';
  
  // Get initials for avatar fallback
  const initials = displayName
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
    
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>TikTok Account</DialogTitle>
          <DialogDescription>
            Manage your connected TikTok account settings.
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
        ) : !userInfo ? (
          <div className="py-4">
            <p className="text-muted-foreground text-sm">
              No TikTok account information available.
            </p>
          </div>
        ) : (
          <div className="py-4 space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {userInfo.avatarUrl && <AvatarImage src={userInfo.avatarUrl} alt={displayName} />}
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="font-medium text-lg">{displayName}</h3>
                {username && (
                  <p className="text-muted-foreground text-sm">
                    {username}
                  </p>
                )}
              </div>
            </div>
            
            <div className="pt-2">
              <p className="text-muted-foreground text-sm mb-4">
                This TikTok account is linked to your profile. You can disconnect it at any time.
              </p>
              
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? 'Disconnecting...' : 'Disconnect TikTok'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}