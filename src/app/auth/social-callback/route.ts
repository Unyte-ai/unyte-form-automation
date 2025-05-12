import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Get the organization ID from the cookie
  const cookieStore = await cookies()
  const organizationId = cookieStore.get('org_connect_id')?.value
  
  if (!code || !organizationId) {
    return NextResponse.redirect(`${origin}/auth/error?error=Missing+required+parameters`)
  }
  
  try {
    // Create a normal server client from your existing implementation
    const supabase = await createClient()
    
    // Get the current user - we need to verify they're logged in
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.redirect(`${origin}/auth/login?error=Authentication+required`)
    }
    
    // Exchange the code for the OAuth tokens but do not set the session
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      console.error('Error exchanging code for session:', sessionError)
      return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(sessionError.message)}`)
    }
    
    // Get the provider details from the session
    const provider = sessionData.user.app_metadata.provider
    const providerToken = sessionData.session?.provider_token
    const providerRefreshToken = sessionData.session?.provider_refresh_token
    const providerUserId = sessionData.user.identities?.[0]?.id
    
    // Use identity_data for email as email property might not exist directly on identity
    const providerUserEmail = sessionData.user.identities?.[0]?.identity_data?.email || ''
    
    const providerUserName = sessionData.user.identities?.[0]?.identity_data?.name || 
                            sessionData.user.identities?.[0]?.identity_data?.full_name || 
                            sessionData.user.identities?.[0]?.identity_data?.user_name
    
    // Store the tokens in our organization_identity_links table
    const { error: storeError } = await supabase
      .from('organization_identity_links')
      .upsert({
        organization_id: organizationId,
        user_id: user.id,
        user_email: user.email || '',
        user_name: user.user_metadata.full_name || user.email || 'Unknown User',
        provider,
        provider_id: providerUserId || '',
        provider_email: providerUserEmail || user.email || '',
        provider_name: providerUserName || '',
        access_token: providerToken || '',
        refresh_token: providerRefreshToken || '',
        token_expiry: providerToken ? new Date(Date.now() + 3600 * 1000) : null, // Assume 1 hour expiry as default
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id,user_id,provider',
        ignoreDuplicates: false
      })
    
    if (storeError) {
      console.error('Error storing social connection:', storeError)
      return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent('Failed to save social connection')}`)
    }
    
    // Clear the organization ID cookie
    cookieStore.set('org_connect_id', '', { maxAge: 0, path: '/' })
    
    // Redirect back to the organization page
    return NextResponse.redirect(`${origin}/home/${organizationId}`)
   
  } catch (error) {
    console.error('Error in social callback:', error)
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent('An unexpected error occurred')}`)
  }
}