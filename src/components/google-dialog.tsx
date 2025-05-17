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
import { getGoogleIdentityDetails, GoogleIdentity } from '@/app/actions/google-identity'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface GoogleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GoogleDialog({ open, onOpenChange }: GoogleDialogProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [googleIdentity, setGoogleIdentity] = useState<GoogleIdentity | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch Google identity details when the dialog opens
  useEffect(() => {
    async function fetchGoogleIdentity() {
      if (!open) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const result = await getGoogleIdentityDetails()
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch Google identity details')
        }
        
        setGoogleIdentity(result.data || null)
      } catch (error) {
        console.error('Error fetching Google identity:', error)
        setError(error instanceof Error ? error.message : 'An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchGoogleIdentity()
  }, [open])
  
  // Handle unlinking the Google account
  const handleUnlink = async () => {
    if (!googleIdentity) return
    
    try {
      const supabase = createClient()
      
      // First, get all identities to find the full identity object
      const { data: identitiesData, error: fetchError } = await supabase.auth.getUserIdentities()
      
      if (fetchError) throw fetchError
      
      // Find the google identity
      const googleIdentityObj = identitiesData?.identities?.find(
        identity => identity.provider === 'google'
      )
      
      if (!googleIdentityObj) {
        throw new Error('Google identity not found')
      }
      
      // Use the complete identity object
      const { error } = await supabase.auth.unlinkIdentity(googleIdentityObj)
      
      if (error) throw error
      
      toast.success('Google account unlinked', {
        description: 'Your Google account has been successfully unlinked.'
      })
      
      // Close the dialog
      onOpenChange(false)
      
      // Refresh the page to update the UI
      window.location.reload()
      
    } catch (error) {
      console.error('Error unlinking Google account:', error)
      toast.error('Failed to unlink Google account', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    }
  }

  // Get name and picture from Google identity data
  const name = googleIdentity?.identityData?.name 
    || googleIdentity?.identityData?.full_name 
    || 'Google User';
  
  const picture = googleIdentity?.identityData?.picture 
    || googleIdentity?.identityData?.avatar_url;
    
  // Get initials for avatar fallback
  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
    
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Google Account</DialogTitle>
          <DialogDescription>
            Manage your connected Google account settings.
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
        ) : !googleIdentity ? (
          <div className="py-4">
            <p className="text-muted-foreground text-sm">
              No Google account information available.
            </p>
          </div>
        ) : (
          <div className="py-4 space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {picture && <AvatarImage src={picture} alt={name} />}
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="font-medium text-lg">{name}</h3>
                {googleIdentity.identityData.email && (
                  <p className="text-muted-foreground text-sm">
                    {googleIdentity.identityData.email}
                  </p>
                )}
              </div>
            </div>
            
            <div className="pt-2">
              <p className="text-muted-foreground text-sm mb-4">
                This Google account is linked to your profile. You can unlink it at any time.
              </p>
              
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleUnlink}
              >
                Unlink Google Account
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}