'use server'

import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Refreshes a TikTok access token using the stored refresh token
 * @param userId The user ID whose token needs refreshing
 * @returns Success status and error message if applicable
 */
export async function refreshTikTokToken(userId: string): Promise<{ 
  success: boolean; 
  error?: string;
}> {
  try {
    // Get environment variables
    const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_ID
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET
    
    if (!clientKey || !clientSecret) {
      throw new Error('TikTok credentials are not properly configured')
    }

    // Get the admin client to access the database
    const adminClient = createAdminClient()
    
    // Get the current user's TikTok connection
    const { data: connection, error: fetchError } = await adminClient
      .from('tiktok_connections')
      .select('id, refresh_token')
      .eq('user_id', userId)
      .single()
    
    if (fetchError || !connection) {
      console.error('No TikTok connection found for user:', userId)
      return { 
        success: false, 
        error: 'No TikTok connection found'
      }
    }
    
    // Prepare refresh token request
    const params = new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: connection.refresh_token
    })
    
    // Make the token refresh request
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
      console.error('TikTok token refresh error:', data)
      throw new Error(`TikTok token refresh failed: ${data.error_description || data.error}`)
    }
    
    // Extract token response
    const now = new Date()
    const tokenExpiresAt = new Date(now.getTime() + data.expires_in * 1000)
    const refreshExpiresAt = new Date(now.getTime() + data.refresh_expires_in * 1000)
    
    // Update the connection with new tokens
    const { error: updateError } = await adminClient
      .from('tiktok_connections')
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token, // Use new refresh token if returned
        token_expires_at: tokenExpiresAt.toISOString(),
        refresh_expires_at: refreshExpiresAt.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', connection.id)
    
    if (updateError) {
      console.error('Error updating TikTok tokens:', updateError)
      throw new Error(`Failed to update tokens: ${updateError.message}`)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error refreshing TikTok token:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}