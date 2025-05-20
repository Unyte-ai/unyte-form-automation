'use server'

import { createClient } from '@/lib/supabase/server'

export interface SocialConnectionStatus {
  isConnected: boolean
  provider: string
}

export async function getSocialConnectionStatus(): Promise<{
  google: boolean;
  facebook: boolean;
}> {
  try {
    // Get the current user
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    
    if (!userData?.user) {
      return { google: false, facebook: false }
    }
    // Get user's identities (linked accounts)
    const { data: identities, error } = await supabase.auth.getUserIdentities()
    
    if (error || !identities?.identities || identities.identities.length === 0) {
      return { google: false, facebook: false }
    }
    
    // Check each provider
    const google = identities.identities.some(identity => identity.provider === 'google')
    const facebook = identities.identities.some(identity => identity.provider === 'facebook')
    
    return {
      google,
      facebook
    }
  } catch (error) {
    console.error('Error checking social connections:', error)
    return { google: false, facebook: false }
  }
}