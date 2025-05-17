'use client'

import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { getSocialConnectionStatus } from '@/app/actions/social-connections'
import { LinkedInDialog } from '@/components/linkedin-dialog'

export function LinkedInLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Check connection status on component mount
  useEffect(() => {
    async function checkConnectionStatus() {
      try {
        const status = await getSocialConnectionStatus()
        setIsConnected(status.linkedin)
      } catch (error) {
        console.error('Error checking LinkedIn connection status:', error)
      }
    }
    
    checkConnectionStatus()
  }, [])
  
  async function handleLinkedInClick() {
    if (isConnected) {
      // If already connected, open the dialog instead
      setIsDialogOpen(true)
      return
    }
    
    try {
      setIsLoading(true)
      const supabase = createClient()
      
      const { error } = await supabase.auth.linkIdentity({
        provider: 'linkedin_oidc'
      })
      
      if (error) throw error
      
      // Supabase handles the redirect automatically
      
    } catch (error) {
      console.error('Error connecting LinkedIn account:', error)
      toast.error('Failed to connect LinkedIn account', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex justify-between items-center">
        <span className="font-medium">LinkedIn</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLinkedInClick}
          disabled={isLoading}
          className={isConnected 
            ? "text-green-700 border-green-500 bg-green-50 hover:text-green-800 dark:text-green-400 dark:border-green-700 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/30 dark:hover:text-green-400" 
            : ""}
        >
          {isLoading ? 'Connecting...' : isConnected ? 'Connected' : 'Connect'}
        </Button>
      </div>
      
      {/* LinkedIn Dialog */}
      <LinkedInDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
      />
    </>
  )
}