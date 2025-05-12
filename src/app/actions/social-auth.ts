'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

type SocialProvider = 'google' | 'facebook' | 'linkedin_oidc' | 'twitter'

/**
 * Initiates OAuth flow for a specific organization
 * Instead of creating a new auth user, we'll use the custom callback to store tokens
 */
export async function initiateSocialAuth(
  organizationId: string, 
  provider: SocialProvider
) {
  const supabase = await createClient()
  
  // First, verify the user is logged in and a member of this organization
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/auth/login')
  }
  
  // Verify user is a member of this organization
  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization', organizationId)
    .eq('user_id', user.id)
    .single()
  
  if (membershipError || !membership) {
    throw new Error('You must be a member of this organization to connect social accounts')
  }
 
  // Store the organization ID in a cookie so we can access it in the callback
  const cookieStore = await cookies()
  cookieStore.set('org_connect_id', organizationId, { 
    path: '/', 
    maxAge: 60 * 5, // 5 minutes
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  })
  
  // Initiate the OAuth flow
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/social-callback`,
      skipBrowserRedirect: true, // We'll handle the redirect manually
    }
  })
  
  if (error) {
    throw new Error(`Failed to initiate ${provider} authentication: ${error.message}`)
  }
  
  // Return the URL so the client can redirect
  return data.url
}