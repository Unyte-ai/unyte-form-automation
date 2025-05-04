'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function InviteHandler() {
  const router = useRouter()

  useEffect(() => {
    const handleInviteToken = async () => {
      // Get the fragment part of the URL
      const hash = window.location.hash
      
      // Parse fragment parameters
      const params = new URLSearchParams(hash.slice(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type = params.get('type')
      
      console.log('Invite handler params:', { 
        accessToken: accessToken ? 'present' : 'missing', 
        refreshToken: refreshToken ? 'present' : 'missing',
        type 
      })

      if (accessToken && refreshToken && type === 'invite') {
        const supabase = createClient()
        
        // Set the session with the tokens from the URL
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })

        if (error) {
          console.error('Error setting session:', error)
          router.push(`/auth/error?error=${encodeURIComponent(error.message)}`)
        } else {
          console.log('Session set successfully, redirecting to home')
          // Clear the URL fragment and redirect to home
          window.location.href = '/home'
        }
      } else {
        console.log('Missing required parameters')
        router.push('/auth/error?error=Invalid invite link')
      }
    }

    handleInviteToken()
  }, [router])

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Processing invitation...</h2>
        <p className="text-sm text-muted-foreground mt-2">Please wait while we set up your account.</p>
      </div>
    </div>
  )
}