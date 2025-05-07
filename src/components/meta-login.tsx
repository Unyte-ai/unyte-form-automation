'use client'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function MetaLogin() {
  async function signInWithFacebook() {
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
          // Remove the explicit scopes to let Supabase use defaults
        }
      })
      
      if (error) {
        console.error('Error signing in with Facebook:', error)
      }
    } catch (err) {
      console.error('Exception during Facebook login:', err)
    }
  }

  return (
    <div className="flex justify-between items-center">
      <span className="font-medium">Meta</span>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={signInWithFacebook}
      >
        Sign In
      </Button>
    </div>
  )
}