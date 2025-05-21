'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import { initLinkedInOAuth } from '@/app/actions/linkedin-auth'
import { LinkedInDialog } from '@/components/linkedin-dialog'
import { useConnectionStatus } from '@/contexts/connection-status-context'

export function LinkedInLogin() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Use the context instead of individual status check
  const { connections, isLoading, refreshConnections } = useConnectionStatus()
  const isConnected = connections.linkedin
  
  async function handleLinkedInClick() {
    if (isConnected) {
      // If already connected, open the dialog instead
      setIsDialogOpen(true)
      return
    }
    
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
    <>
      <div className="flex justify-between items-center">
        <span className="font-medium">LinkedIn</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLinkedInClick}
          disabled={isLoading || isConnecting}
          className={isConnected 
            ? "text-green-700 border-green-500 bg-green-50 hover:text-green-800 dark:text-green-400 dark:border-green-700 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/30 dark:hover:text-green-400" 
            : ""}
        >
          {isConnecting ? 'Connecting...' : isLoading ? 'Loading...' : isConnected ? 'Connected' : 'Connect'}
        </Button>
      </div>
      
      {/* LinkedIn Dialog - pass refresh function */}
      <LinkedInDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        onDisconnect={refreshConnections}
      />
    </>
  )
}