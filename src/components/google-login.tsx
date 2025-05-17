// src/components/google-login.tsx
'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { GoogleDialog } from '@/components/google-dialog'
import { useConnectionStatus } from '@/contexts/connection-status-context'

export function GoogleLogin() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Use the context instead of individual status
  const { connections, isLoading, refreshConnections } = useConnectionStatus()
  const isConnected = connections.google
  
  async function handleGoogleClick() {
    if (isConnected) {
      // If already connected, open the dialog instead
      setIsDialogOpen(true)
      return
    }
    
    try {
      setIsConnecting(true)
      const supabase = createClient()
      
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google'
      })
      
      if (error) throw error
      
      // Supabase handles the redirect automatically
      
    } catch (error) {
      console.error('Error connecting Google account:', error)
      toast.error('Failed to connect Google account', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
      setIsConnecting(false)
    }
  }

  return (
    <>
      <div className="flex justify-between items-center">
        <span className="font-medium">Google</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleGoogleClick}
          disabled={isLoading || isConnecting}
          className={isConnected 
            ? "text-green-700 border-green-500 bg-green-50 hover:text-green-800 dark:text-green-400 dark:border-green-700 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/30 dark:hover:text-green-400" 
            : ""}
        >
          {isConnecting ? 'Connecting...' : isLoading ? 'Loading...' : isConnected ? 'Connected' : 'Connect'}
        </Button>
      </div>
      
      {/* Google Dialog - pass refresh function to update context after disconnection */}
      <GoogleDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        onDisconnect={refreshConnections}
      />
    </>
  )
}