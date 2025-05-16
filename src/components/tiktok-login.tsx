'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import { initTikTokOAuth } from '@/app/actions/tiktok-auth'

export function TikTokLogin() {
  const [isLoading, setIsLoading] = useState(false)
  
  async function connectTikTok() {
    try {
      setIsLoading(true)
      
      toast.info('Connecting to TikTok...', {
        description: 'Redirecting to TikTok authorization page'
      })
      
      // Call the server action without passing credentials
      const authUrl = await initTikTokOAuth()
      
      // Redirect to TikTok's authorization page
      window.location.href = authUrl
      
    } catch (error) {
      console.error('Error connecting TikTok account:', error)
      toast.error('Failed to connect TikTok account', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="flex justify-between items-center">
      <span className="font-medium">TikTok</span>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={connectTikTok}
        disabled={isLoading}
      >
        {isLoading ? 'Connecting...' : 'Connect'}
      </Button>
    </div>
  )
}