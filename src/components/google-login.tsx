'use client'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function GoogleLogin() {
  async function signInWithGoogle() {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    })
    
    if (error) {
      console.error('Error signing in with Google:', error)
    }
  }

  return (
    <div className="flex justify-between items-center">
      <span className="font-medium">Google</span>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={signInWithGoogle}
      >
        Sign In
      </Button>
    </div>
  )
}