'use client'

import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { getSocialConnectionStatus } from '@/app/actions/social-connections'

export function GoogleLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  
  // Check connection status on component mount
  useEffect(() => {
    async function checkConnectionStatus() {
      try {
        const status = await getSocialConnectionStatus()
        setIsConnected(status.google)
      } catch (error) {
        console.error('Error checking Google connection status:', error)
      }
    }
    
    checkConnectionStatus()
  }, [])
  
  async function connectGoogle() {
    if (isConnected) {
      // If already connected, don't do anything
      return
    }
    
    try {
      setIsLoading(true)
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
      setIsLoading(false)
    }
  }

  return (
    <div className="flex justify-between items-center">
      <span className="font-medium">Google</span>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={connectGoogle}
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