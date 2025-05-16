'use client'

import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { getSocialConnectionStatus } from '@/app/actions/social-connections'

export function MetaLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  
  // Check connection status on component mount
  useEffect(() => {
    async function checkConnectionStatus() {
      try {
        const status = await getSocialConnectionStatus()
        setIsConnected(status.facebook)
      } catch (error) {
        console.error('Error checking Facebook connection status:', error)
      }
    }
    
    checkConnectionStatus()
  }, [])
  
  async function connectFacebook() {
    if (isConnected) {
      // If already connected, don't do anything
      return
    }
    
    try {
      setIsLoading(true)
      const supabase = createClient()
      
      const { error } = await supabase.auth.linkIdentity({
        provider: 'facebook'
      })
      
      if (error) throw error
      
      // Supabase handles the redirect automatically
      
    } catch (error) {
      console.error('Error connecting Facebook account:', error)
      toast.error('Failed to connect Facebook account', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="flex justify-between items-center">
      <span className="font-medium">Meta</span>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={connectFacebook}
        disabled={isLoading || isConnected}
        className={isConnected 
          ? "text-green-700 border-green-500 bg-green-50 dark:text-green-400 dark:border-green-700 dark:bg-green-950/30 hover:bg-green-50 dark:hover:bg-green-950/30 cursor-default" 
          : ""}
      >
        {isLoading ? 'Connecting...' : isConnected ? 'Connected' : 'Connect'}
      </Button>
    </div>
  )
}