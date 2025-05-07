'use client'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function LinkedInLogin() {
  async function signInWithLinkedIn() {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    })
    
    if (error) {
      console.error('Error signing in with LinkedIn:', error)
    }
  }

  return (
    <div className="flex justify-between items-center">
      <span className="font-medium">LinkedIn</span>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={signInWithLinkedIn}
      >
        Sign In
      </Button>
    </div>
  )
}