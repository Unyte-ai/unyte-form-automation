'use client'

import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { initTikTokOAuth } from '@/app/actions/tiktok-auth'
import { getTikTokConnectionStatus, TikTokConnectionStatus } from '@/app/actions/tiktok-status'

export function TikTokLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<TikTokConnectionStatus>({ isConnected: false })
  
  // Check connection status on component mount
  useEffect(() => {
    async function checkConnectionStatus() {
      try {
        const status = await getTikTokConnectionStatus()
        setConnectionStatus(status)
      } catch (error) {
        console.error('Error checking TikTok connection status:', error)
      }
    }
    
    checkConnectionStatus()
  }, [])
  
  async function connectTikTok() {
    if (connectionStatus.isConnected) {
      // If already connected, don't do anything
      return
    }
    
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
        disabled={isLoading || connectionStatus.isConnected}
        className={connectionStatus.isConnected 
          ? "text-green-700 border-green-500 bg-green-50 dark:text-green-400 dark:border-green-700 dark:bg-green-950/30 hover:bg-green-50 dark:hover:bg-green-950/30 cursor-default" 
          : ""}
      >
        {isLoading ? 'Connecting...' : connectionStatus.isConnected ? 'Connected' : 'Connect'}
      </Button>
    </div>
  )
}