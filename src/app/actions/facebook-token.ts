'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface FacebookErrorResponse {
    error?: string | {
      message?: string
      type?: string
      code?: number
    }
    error_description?: string
}

interface FacebookTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface FacebookUserInfo {
  id: string
  name?: string
  email?: string
  picture?: {
    data?: {
      url?: string
    }
  }
}

/**
 * Exchanges an authorization code for a Facebook access token
 * @param code The authorization code from Facebook callback
 * @param organizationId The organization ID to associate the connection with
 */
export async function exchangeFacebookToken(code: string, organizationId: string): Promise<{ 
  success: boolean; 
  error?: string;
}> {
  try {
    // Get Facebook credentials from environment variables
    const clientId = process.env.FACEBOOK_APP_ID
    const clientSecret = process.env.FACEBOOK_APP_SECRET
    
    if (!clientId || !clientSecret) {
      throw new Error('Facebook credentials are not properly configured')
    }
    
    // Set the redirect URI based on environment (must match what was used in auth flow)
    const redirectUri = process.env.NODE_ENV === 'production'
      ? 'https://app.unyte.ai/auth/facebook/callback'
      : 'http://localhost:3000/auth/facebook/callback'
    
    // Prepare token exchange request
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri
    })
    
    console.log('Exchanging Facebook code for token with params:', {
      client_id: clientId,
      code: code ? `${code.substring(0, 10)}...` : 'missing', // Log partially obscured code for debugging
      redirect_uri: redirectUri
    })
    
    // Make the token exchange request
    const response = await fetch('https://graph.facebook.com/v22.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: params.toString()
    })
    
    // Check for network errors
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Facebook token request failed:', response.status, errorText)
      throw new Error(`Token request failed: ${response.status} ${errorText}`)
    }
    
    // Parse the response
    const data = await response.json() as FacebookTokenResponse
    
    // Handle error response
    if ('error' in data) {
        console.error('Facebook token exchange error:', data)
        const errorData = data as FacebookTokenResponse & FacebookErrorResponse
        const errorMessage = typeof errorData.error === 'string' 
          ? errorData.error_description || errorData.error
          : errorData.error?.message || 'Unknown error'
        throw new Error(`Facebook token exchange failed: ${errorMessage}`)
    }
    
    console.log('Successfully received Facebook token')
    
    // Get current user from supabase
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }
    
    // Fetch basic user info from Facebook
    const userInfo = await fetchFacebookUserInfo(data.access_token)
    
    // Store the tokens in the database using admin client
    const adminClient = createAdminClient()
    
    // Calculate expiry timestamp
    const now = new Date()
    const tokenExpiresAt = new Date(now.getTime() + data.expires_in * 1000)
    
    // Check if user already has Facebook connection for this organization
    const { data: existingConnection } = await adminClient
      .from('facebook_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()
    
    if (existingConnection) {
      // Update existing connection
      const { error: updateError } = await adminClient
        .from('facebook_connections')
        .update({
          facebook_user_id: userInfo.id,
          access_token: data.access_token,
          token_expires_at: tokenExpiresAt.toISOString(),
          display_name: userInfo.name,
          email: userInfo.email,
          profile_picture: userInfo.picture?.data?.url,
          updated_at: now.toISOString()
        })
        .eq('id', existingConnection.id)
      
      if (updateError) {
        throw new Error(`Failed to update Facebook connection: ${updateError.message}`)
      }
    } else {
      // Create new connection
      const { error: insertError } = await adminClient
        .from('facebook_connections')
        .insert({
          user_id: user.id,
          organization_id: organizationId,
          facebook_user_id: userInfo.id,
          access_token: data.access_token,
          token_expires_at: tokenExpiresAt.toISOString(),
          display_name: userInfo.name,
          email: userInfo.email,
          profile_picture: userInfo.picture?.data?.url,
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        })
      
      if (insertError) {
        throw new Error(`Failed to create Facebook connection: ${insertError.message}`)
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error exchanging Facebook token:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Fetches basic user info from Facebook using the access token
 */
async function fetchFacebookUserInfo(accessToken: string): Promise<FacebookUserInfo> {
  try {
    // Make request to Facebook's user info endpoint
    const response = await fetch(
      'https://graph.facebook.com/v22.0/me?fields=id,name,email,picture',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (!response.ok) {
      console.error('Facebook user info request failed:', response.status)
      // Return minimal data with Facebook ID as 'unknown'
      return { id: 'unknown' }
    }
    
    const data = await response.json() as FacebookUserInfo
    
    return {
      id: data.id,
      name: data.name || '',
      email: data.email || '',
      picture: data.picture
    }
  } catch (error) {
    console.error('Error fetching Facebook user info:', error)
    // Return minimal data in case of error
    return { id: 'unknown' }
  }
}