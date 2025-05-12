'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export function LinkedInLogin() {
  const [isLoading, setIsLoading] = useState(false)
  
  async function connectLinkedIn() {
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
    <div className="flex justify-between items-center">
      <span className="font-medium">LinkedIn</span>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={connectLinkedIn}
        disabled={isLoading}
      >
        {isLoading ? 'Connecting...' : 'Connect'}
      </Button>
    </div>
  )
}