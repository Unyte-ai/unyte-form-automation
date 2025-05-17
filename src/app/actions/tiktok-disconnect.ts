'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Disconnects a user's TikTok account by revoking their token
 * and removing the connection from the database
 */
export async function disconnectTikTok(): Promise<{ 
  success: boolean; 
  error?: string;
}> {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Get the TikTok connection information
    const { data: connection, error } = await supabase
      .from('tiktok_connections')
      .select('id, access_token')
      .eq('user_id', user.id)
      .single()
    
    if (error || !connection) {
      throw new Error('TikTok connection not found')
    }

    // Get client credentials from environment variables
    const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_ID
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET
    
    if (!clientKey || !clientSecret) {
      throw new Error('TikTok credentials are not properly configured')
    }

    // Revoke the token using TikTok's API (V2)
    const params = new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      token: connection.access_token
    })
    
    const response = await fetch('https://open.tiktokapis.com/v2/oauth/revoke/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: params.toString()
    })
    
    // Check if request was successful
    if (!response.ok) {
      const data = await response.json()
      console.error('TikTok revoke token error:', data)
      throw new Error(`TikTok revoke failed: ${data.error_description || data.error}`)
    }
    
    // Delete the connection from the database
    const { error: deleteError } = await adminClient
      .from('tiktok_connections')
      .delete()
      .eq('id', connection.id)
    
    if (deleteError) {
      throw new Error(`Error deleting TikTok connection: ${deleteError.message}`)
    }
    
    // Revalidate relevant paths to update UI
    revalidatePath('/home')
    
    return { success: true }
  } catch (error) {
    console.error('Error disconnecting TikTok:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}