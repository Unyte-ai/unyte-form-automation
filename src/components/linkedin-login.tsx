'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import { initLinkedInOAuth } from '@/app/actions/linkedin-auth'

export function LinkedInLogin() {
  const [isConnecting, setIsConnecting] = useState(false)
  
  async function handleLinkedInClick() {
    try {
      setIsConnecting(true)
      
      toast.info('Connecting to LinkedIn...', {
        description: 'Redirecting to LinkedIn authorization page'
      })
      
      // Call our server action to get the LinkedIn authorization URL
      const authUrl = await initLinkedInOAuth()
      
      // Redirect to LinkedIn's authorization page
      window.location.href = authUrl
      
    } catch (error) {
      console.error('Error connecting LinkedIn account:', error)
      toast.error('Failed to connect LinkedIn account', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
      setIsConnecting(false)
    }
  }

  return (
    <div className="flex justify-between items-center">
      <span className="font-medium">LinkedIn</span>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleLinkedInClick}
        disabled={isConnecting}
      >
        {isConnecting ? 'Connecting...' : 'Connect'}
      </Button>
    </div>
  )
}