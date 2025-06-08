'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { refreshTikTokToken } from './tiktok-refresh'

interface TikTokTokenResponse {
  access_token: string
  expires_in: number
  open_id: string
  refresh_token: string
  refresh_expires_in: number
  scope: string
  token_type: string
}

export async function exchangeTikTokToken(code: string, organizationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the code verifier from cookies
    const cookieStore = await cookies()
    const codeVerifier = cookieStore.get('tiktok_code_verifier')?.value
    
    // Clear the cookies regardless of outcome
    cookieStore.delete('tiktok_code_verifier')
    cookieStore.delete('tiktok_csrf_state')
    
    if (!codeVerifier) {
      throw new Error('Code verifier not found. Please try again.')
    }
    
    // Get the client key and secret from environment variables
    const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_ID
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET
    
    if (!clientKey || !clientSecret) {
      throw new Error('TikTok credentials are not properly configured')
    }
    
    // Prepare token exchange request
    // IMPORTANT: Always use the production redirect URI, even in development
    const redirectUri = 'https://app.unyte.ai/auth/tiktok/callback'
    
    // Prepare request body
    const params = new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    })
    
    // Make the token exchange request
    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: params.toString()
    })
    
    // Parse the response
    const data = await response.json()
    
    // Handle error response
    if (data.error) {
      console.error('TikTok token exchange error:', data)
      throw new Error(`TikTok token exchange failed: ${data.error_description || data.error}`)
    }
    
    // Extract token response
    const tokenData = data as TikTokTokenResponse
    
    // Get current user from supabase
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }
    
    // Store the tokens in the database using admin client
    const adminClient = createAdminClient()
    
    // Calculate expiry timestamps
    const now = new Date()
    const tokenExpiresAt = new Date(now.getTime() + tokenData.expires_in * 1000)
    const refreshExpiresAt = new Date(now.getTime() + tokenData.refresh_expires_in * 1000)
    
    // Check if user already has TikTok connection for this organization
    const { data: existingConnection } = await adminClient
      .from('tiktok_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()
    
    // Insert or update the connection
    if (existingConnection) {
      // Update existing connection
      await adminClient
        .from('tiktok_connections')
        .update({
          tiktok_open_id: tokenData.open_id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: tokenExpiresAt.toISOString(),
          refresh_expires_at: refreshExpiresAt.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('id', existingConnection.id)
    } else {
      // Create new connection
      await adminClient
        .from('tiktok_connections')
        .insert({
          user_id: user.id,
          organization_id: organizationId,
          tiktok_open_id: tokenData.open_id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: tokenExpiresAt.toISOString(),
          refresh_expires_at: refreshExpiresAt.toISOString(),
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        })
    }
    
    // Fetch TikTok user info to store profile data
    await fetchAndStoreTikTokUserInfo(tokenData.access_token, tokenData.open_id, user.id, organizationId)
    
    return { success: true }
  } catch (error) {
    console.error('Error exchanging TikTok token:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

// Helper function to fetch and store TikTok user info
async function fetchAndStoreTikTokUserInfo(
  accessToken: string, 
  openId: string,
  userId: string,
  organizationId: string
): Promise<void> {
  try {
    // Make request to TikTok's user info endpoint
    const response = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=open_id,avatar_url,display_name,username',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )
    
    const data = await response.json()
    
    if (data.error?.code !== 'ok') {
      console.error('Error fetching TikTok user info:', data.error)
      return
    }
    
    const userData = data.data.user
    
    // Store user profile data
    const adminClient = createAdminClient()
    await adminClient
      .from('tiktok_connections')
      .update({
        avatar_url: userData.avatar_url,
        display_name: userData.display_name,
        username: userData.username
      })
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .eq('tiktok_open_id', openId)
      
  } catch (error) {
    console.error('Error storing TikTok user info:', error)
    // We don't throw here - profile data is not critical to the connection
  }
}

/**
 * Gets a valid access token for TikTok API calls, refreshing if needed
 * @param userId The user ID
 * @param organizationId The organization ID
 * @returns Access token if available, null otherwise
 */
export async function getValidTikTokToken(userId: string, organizationId: string): Promise<string | null> {
  try {
    const adminClient = createAdminClient()
    
    // Get the current token information for this user + organization
    const { data: connection, error } = await adminClient
      .from('tiktok_connections')
      .select('id, access_token, token_expires_at')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single()
      
    if (error || !connection) {
      console.error('No TikTok connection found for user and organization:', userId, organizationId)
      return null
    }
    
    // Check if token is expired or about to expire (within 5 minutes)
    const tokenExpiresAt = new Date(connection.token_expires_at)
    const now = new Date()
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)
    
    if (tokenExpiresAt > fiveMinutesFromNow) {
      // Token is still valid
      return connection.access_token
    }
    
    // Token is expired or about to expire, try to refresh it
    console.log('TikTok token expired or about to expire, refreshing...')
    const refreshResult = await refreshTikTokToken(userId, organizationId)
    
    if (!refreshResult.success) {
      console.error('Failed to refresh TikTok token:', refreshResult.error)
      return null
    }
    
    // Get the refreshed token
    const { data: refreshedConnection, error: refreshedError } = await adminClient
      .from('tiktok_connections')
      .select('access_token')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single()
      
    if (refreshedError || !refreshedConnection) {
      console.error('Failed to get refreshed TikTok token')
      return null
    }
    
    return refreshedConnection.access_token
  } catch (error) {
    console.error('Error getting valid TikTok token:', error)
    return null
  }
}