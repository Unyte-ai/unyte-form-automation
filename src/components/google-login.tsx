'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import { initGoogleOAuth } from '@/app/actions/google-auth'
import { useParams } from 'next/navigation'

export function GoogleLogin() {
  const [isConnecting, setIsConnecting] = useState(false)
  
  // Get current organization ID from URL params
  const params = useParams()
  const organizationId = params?.orgId as string
  
  async function handleGoogleClick() {
    if (!organizationId) {
      toast.error('No organization selected', {
        description: 'Please select an organization first'
      })
      return
    }
    
    try {
      setIsConnecting(true)
      
      toast.info('Connecting to Google...', {
        description: 'Redirecting to Google authorization page'
      })
      
      // Call our server action with the organization ID
      const authUrl = await initGoogleOAuth(organizationId)
      
      // Redirect to Google's authorization page
      window.location.href = authUrl
      
    } catch (error) {
      console.error('Error connecting Google account:', error)
      toast.error('Failed to connect Google account', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
      setIsConnecting(false)
    }
  }

  return (
    <div className="flex justify-between items-center">
      <span className="font-medium">Google</span>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleGoogleClick}
        disabled={isConnecting || !organizationId}
      >
        {isConnecting ? 'Connecting...' : 'Connect'}
      </Button>
    </div>
  )
}