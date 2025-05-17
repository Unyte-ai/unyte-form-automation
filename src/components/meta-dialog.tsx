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
import { getMetaIdentityDetails, MetaIdentity } from '@/app/actions/meta-identity'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface MetaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MetaDialog({ open, onOpenChange }: MetaDialogProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [metaIdentity, setMetaIdentity] = useState<MetaIdentity | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch Meta identity details when the dialog opens
  useEffect(() => {
    async function fetchMetaIdentity() {
      if (!open) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const result = await getMetaIdentityDetails()
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch Meta identity details')
        }
        
        setMetaIdentity(result.data || null)
      } catch (error) {
        console.error('Error fetching Meta identity:', error)
        setError(error instanceof Error ? error.message : 'An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchMetaIdentity()
  }, [open])
  
  // Handle unlinking the Meta account
  const handleUnlink = async () => {
    if (!metaIdentity) return
    
    try {
      const supabase = createClient()
      
      // First, get all identities to find the full identity object
      const { data: identitiesData, error: fetchError } = await supabase.auth.getUserIdentities()
      
      if (fetchError) throw fetchError
      
      // Find the facebook identity
      const facebookIdentity = identitiesData?.identities?.find(
        identity => identity.provider === 'facebook'
      )
      
      if (!facebookIdentity) {
        throw new Error('Facebook identity not found')
      }
      
      // Use the complete identity object
      const { error } = await supabase.auth.unlinkIdentity(facebookIdentity)
      
      if (error) throw error
      
      toast.success('Meta account unlinked', {
        description: 'Your Meta account has been successfully unlinked.'
      })
      
      // Close the dialog
      onOpenChange(false)
      
      // Refresh the page to update the UI
      window.location.reload()
      
    } catch (error) {
      console.error('Error unlinking Meta account:', error)
      toast.error('Failed to unlink Meta account', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    }
  }

  // Get name and picture
  const name = metaIdentity?.identityData?.name 
    || metaIdentity?.identityData?.full_name 
    || 'Meta User';
  
  const picture = metaIdentity?.identityData?.avatar_url 
    || metaIdentity?.identityData?.picture;
    
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
          <DialogTitle>Meta Account</DialogTitle>
          <DialogDescription>
            Manage your connected Meta account settings.
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
        ) : !metaIdentity ? (
          <div className="py-4">
            <p className="text-muted-foreground text-sm">
              No Meta account information available.
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
                {metaIdentity.identityData.email && (
                  <p className="text-muted-foreground text-sm">
                    {metaIdentity.identityData.email}
                  </p>
                )}
              </div>
            </div>
            
            <div className="pt-2">
              <p className="text-muted-foreground text-sm mb-4">
                This Meta account is linked to your profile. You can unlink it at any time.
              </p>
              
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleUnlink}
              >
                Unlink Meta Account
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}