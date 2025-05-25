'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import { initFacebookOAuth } from '@/app/actions/facebook-auth'
import { MetaDialog } from '@/components/meta-dialog'
import { useConnectionStatus } from '@/contexts/connection-status-context'
import { useParams } from 'next/navigation'

export function MetaLogin() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Use the context instead of individual status check
  const { connections, isLoading, refreshConnections } = useConnectionStatus()
  const isConnected = connections.facebook
  
  // Get current organization ID from URL params
  const params = useParams()
  const organizationId = params?.orgId as string
  
  async function handleFacebookClick() {
    if (isConnected) {
      // If already connected, open the dialog instead
      setIsDialogOpen(true)
      return
    }
    
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
    <>
      <div className="flex justify-between items-center">
        <span className="font-medium">Meta</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleFacebookClick}
          disabled={isLoading || isConnecting || !organizationId}
          className={isConnected 
            ? "text-green-700 border-green-500 bg-green-50 hover:text-green-800 dark:text-green-400 dark:border-green-700 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/30 dark:hover:text-green-400" 
            : ""}
        >
          {isConnecting ? 'Connecting...' : isLoading ? 'Loading...' : isConnected ? 'Connected' : 'Connect'}
        </Button>
      </div>
      
      {/* Meta Dialog - pass refresh function */}
      <MetaDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        onDisconnect={refreshConnections}
      />
    </>
  )
}