'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import { initTikTokOAuth } from '@/app/actions/tiktok-auth'
import { TikTokDialog } from '@/components/tiktok-dialog'
import { useConnectionStatus } from '@/contexts/connection-status-context'

export function TikTokLogin() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Use the context instead of individual status check
  const { connections, isLoading, refreshConnections } = useConnectionStatus()
  const connectionStatus = connections.tiktok
  
  async function connectTikTok() {
    if (connectionStatus.isConnected) {
      // If already connected, open the dialog instead
      setIsDialogOpen(true)
      return
    }
    
    try {
      setIsConnecting(true)
      
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
      setIsConnecting(false)
    }
  }

  return (
    <>
      <div className="flex justify-between items-center">
        <span className="font-medium">TikTok</span>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={connectTikTok}
          disabled={isLoading || isConnecting}
          className={connectionStatus.isConnected 
            ? "text-green-700 border-green-500 bg-green-50 hover:text-green-800 dark:text-green-400 dark:border-green-700 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/30 dark:hover:text-green-400" 
            : ""}
        >
          {isConnecting ? 'Connecting...' : isLoading ? 'Loading...' : connectionStatus.isConnected ? 'Connected' : 'Connect'}
        </Button>
      </div>
      
      {/* TikTok Dialog - pass refresh function */}
      <TikTokDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        onDisconnect={refreshConnections}
      />
    </>
  )
}