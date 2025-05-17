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
import { getLinkedInIdentityDetails, LinkedInIdentity } from '@/app/actions/linkedin-identity'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface LinkedInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LinkedInDialog({ open, onOpenChange }: LinkedInDialogProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [linkedInIdentity, setLinkedInIdentity] = useState<LinkedInIdentity | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch LinkedIn identity details when the dialog opens
  useEffect(() => {
    async function fetchLinkedInIdentity() {
      if (!open) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const result = await getLinkedInIdentityDetails()
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch LinkedIn identity details')
        }
        
        setLinkedInIdentity(result.data || null)
      } catch (error) {
        console.error('Error fetching LinkedIn identity:', error)
        setError(error instanceof Error ? error.message : 'An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchLinkedInIdentity()
  }, [open])
  
  // Handle unlinking the LinkedIn account
  const handleUnlink = async () => {
    if (!linkedInIdentity) return
    
    try {
      const supabase = createClient()
      
      // First, get all identities to find the full identity object
      const { data: identitiesData, error: fetchError } = await supabase.auth.getUserIdentities()
      
      if (fetchError) throw fetchError
      
      // Find the linkedin identity
      const linkedinIdentityObj = identitiesData?.identities?.find(
        identity => identity.provider === 'linkedin_oidc'
      )
      
      if (!linkedinIdentityObj) {
        throw new Error('LinkedIn identity not found')
      }
      
      // Use the complete identity object
      const { error } = await supabase.auth.unlinkIdentity(linkedinIdentityObj)
      
      if (error) throw error
      
      toast.success('LinkedIn account unlinked', {
        description: 'Your LinkedIn account has been successfully unlinked.'
      })
      
      // Close the dialog
      onOpenChange(false)
      
      // Refresh the page to update the UI
      window.location.reload()
      
    } catch (error) {
      console.error('Error unlinking LinkedIn account:', error)
      toast.error('Failed to unlink LinkedIn account', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    }
  }

  // Get name and picture from LinkedIn identity data
  const name = linkedInIdentity?.identityData?.name 
    || linkedInIdentity?.identityData?.full_name 
    || 'LinkedIn User';
  
  const picture = linkedInIdentity?.identityData?.picture 
    || linkedInIdentity?.identityData?.avatar_url;
    
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
        ) : !linkedInIdentity ? (
          <div className="py-4">
            <p className="text-muted-foreground text-sm">
              No LinkedIn account information available.
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
                {linkedInIdentity.identityData.email && (
                  <p className="text-muted-foreground text-sm">
                    {linkedInIdentity.identityData.email}
                  </p>
                )}
              </div>
            </div>
            
            <div className="pt-2">
              <p className="text-muted-foreground text-sm mb-4">
                This LinkedIn account is linked to your profile. You can unlink it at any time.
              </p>
              
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleUnlink}
              >
                Unlink LinkedIn Account
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}