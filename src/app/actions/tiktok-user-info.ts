'use server'

import { createClient } from '@/lib/supabase/server'

export interface TikTokUserInfo {
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  openId?: string;
}

/**
 * Fetches TikTok user information for the currently logged in user and organization
 * @param organizationId The organization ID for the connection
 */
export async function getTikTokUserInfo(organizationId: string): Promise<{ 
  success: boolean; 
  data?: TikTokUserInfo | null;
  error?: string;
}> {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Get the TikTok connection information for this organization
    const { data: connection, error } = await supabase
      .from('tiktok_connections')
      .select('tiktok_open_id, username, display_name, avatar_url')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()
    
    if (error || !connection) {
      return { 
        success: true,
        data: null
      }
    }
    
    // Return the TikTok user info
    return {
      success: true,
      data: {
        username: connection.username,
        displayName: connection.display_name,
        avatarUrl: connection.avatar_url,
        openId: connection.tiktok_open_id
      }
    }
  } catch (error) {
    console.error('Error fetching TikTok user info:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}