'use client'

import { Button } from '@/components/ui/button'
import { initiateSocialAuth } from '@/app/actions/social-auth'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export function GoogleLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const params = useParams()
  const organizationId = params?.orgId as string
  
  async function connectGoogle() {
    if (!organizationId) {
      toast.error('Organization ID is required')
      return
    }
    
    try {
      setIsLoading(true)
      const url = await initiateSocialAuth(organizationId, 'google')
      
      // Redirect to Google OAuth flow
      window.location.href = url
    } catch (error) {
      console.error('Error connecting Google account:', error)
      toast.error('Failed to connect Google account', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex justify-between items-center">
      <span className="font-medium">Google</span>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={connectGoogle}
        disabled={isLoading}
      >
        {isLoading ? 'Connecting...' : 'Connect'}
      </Button>
    </div>
  )
}