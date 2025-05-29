'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface GoogleTokenData {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

interface GoogleUserInfo {
  id: string;
  name?: string;
  email?: string;
  picture?: string;
}

/**
 * Fetches basic user info from Google using the access token
 * Following Google's OAuth2 userinfo endpoint documentation
 */
async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  try {
    // Make request to Google's userinfo endpoint
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    )
    
    if (!response.ok) {
      console.error('Google user info request failed:', response.status)
      // Return minimal data with Google ID as 'unknown'
      return { id: 'unknown' }
    }
    
    const data = await response.json()
    
    // Map Google's userinfo response to our structure
    return {
      id: data.id,
      name: data.name || '',
      email: data.email || '',
      picture: data.picture || ''
    }
  } catch (error) {
    console.error('Error fetching Google user info:', error)
    // Return minimal data in case of error
    return { id: 'unknown' }
  }
}

/**
 * Stores Google token and user info in the database
 * Links token to both user and organization
 */
export async function storeGoogleToken(
  tokenData: GoogleTokenData,
  organizationId: string
): Promise<{ 
  success: boolean;
  error?: string;
}> {
  try {
    // Get the current user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('User not authenticated')
    }
    
    // Fetch basic user info from Google
    const userInfo = await fetchGoogleUserInfo(tokenData.access_token)
    
    // Create admin client for database operations
    const adminClient = createAdminClient()
    
    // Calculate expiry timestamp
    const now = new Date()
    const tokenExpiresAt = new Date(now.getTime() + tokenData.expires_in * 1000)
    
    // Check if connection exists for this user and organization
    const { data: existingConnection } = await adminClient
      .from('google_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()
    
    if (existingConnection) {
      // Update existing connection
      const { error: updateError } = await adminClient
        .from('google_connections')
        .update({
          google_user_id: userInfo.id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          token_expires_at: tokenExpiresAt.toISOString(),
          token_type: tokenData.token_type,
          scope: tokenData.scope,
          display_name: userInfo.name,
          email: userInfo.email,
          profile_picture: userInfo.picture,
          updated_at: now.toISOString()
        })
        .eq('id', existingConnection.id)
      
      if (updateError) {
        throw new Error(`Failed to update Google connection: ${updateError.message}`)
      }
    } else {
      // Create new connection
      const { error: insertError } = await adminClient
        .from('google_connections')
        .insert({
          user_id: user.id,
          organization_id: organizationId,
          google_user_id: userInfo.id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          token_expires_at: tokenExpiresAt.toISOString(),
          token_type: tokenData.token_type,
          scope: tokenData.scope,
          display_name: userInfo.name,
          email: userInfo.email,
          profile_picture: userInfo.picture,
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        })
      
      if (insertError) {
        throw new Error(`Failed to create Google connection: ${insertError.message}`)
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error storing Google token:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}