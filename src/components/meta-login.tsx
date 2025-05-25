'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import { initFacebookOAuth } from '@/app/actions/facebook-auth'
import { useParams } from 'next/navigation'

export function MetaLogin() {
  const [isConnecting, setIsConnecting] = useState(false)
  
  // Get current organization ID from URL params
  const params = useParams()
  const organizationId = params?.orgId as string
  
  async function handleFacebookClick() {
    if (!organizationId) {
      toast.error('No organization selected', {
        description: 'Please select an organization first'
      })
      return
    }
    
    try {
      setIsConnecting(true)
      
      toast.info('Connecting to Facebook...', {
        description: 'Redirecting to Facebook authorization page'
      })
      
      // Call our server action with the organization ID
      const authUrl = await initFacebookOAuth(organizationId)
      
      // Redirect to Facebook's authorization page
      window.location.href = authUrl
      
    } catch (error) {
      console.error('Error connecting Facebook account:', error)
      toast.error('Failed to connect Facebook account', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
      setIsConnecting(false)
    }
  }

  return (
    <div className="flex justify-between items-center">
      <span className="font-medium">Meta</span>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleFacebookClick}
        disabled={isConnecting || !organizationId}
      >
        {isConnecting ? 'Connecting...' : 'Connect'}
      </Button>
    </div>
  )
}