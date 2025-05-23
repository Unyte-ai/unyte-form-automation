'use server'

import { createClient } from '@/lib/supabase/server'

export interface TikTokConnectionStatus {
  isConnected: boolean
  username?: string
  displayName?: string
  avatarUrl?: string
}

export async function getTikTokConnectionStatus(organizationId?: string): Promise<TikTokConnectionStatus> {
  try {
    // Get the current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { isConnected: false }
    }

    // If no organizationId provided, return false
    if (!organizationId) {
      return { isConnected: false }
    }

    // Check if user has a TikTok connection for this specific organization
    const { data: connection, error } = await supabase
      .from('tiktok_connections')
      .select('tiktok_open_id, username, display_name, avatar_url')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()
    
    if (error || !connection) {
      return { isConnected: false }
    }
    
    // Return the connection status with profile info
    return {
      isConnected: true,
      username: connection.username,
      displayName: connection.display_name,
      avatarUrl: connection.avatar_url
    }
  } catch (error) {
    console.error('Error checking TikTok connection:', error)
    return { isConnected: false }
  }
}