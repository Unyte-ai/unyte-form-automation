'use server'

import { createClient } from '@/lib/supabase/server'

export interface FacebookConnectionStatus {
  isConnected: boolean
  displayName?: string
  email?: string
  profilePicture?: string
}

export async function getFacebookConnectionStatus(organizationId?: string): Promise<FacebookConnectionStatus> {
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

    // Check if user has a Facebook connection for this specific organization
    const { data: connection, error } = await supabase
      .from('facebook_connections')
      .select('display_name, email, profile_picture')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()
    
    if (error || !connection) {
      return { isConnected: false }
    }
    
    // Return the connection status with profile info
    return {
      isConnected: true,
      displayName: connection.display_name,
      email: connection.email,
      profilePicture: connection.profile_picture
    }
  } catch (error) {
    console.error('Error checking Facebook connection:', error)
    return { isConnected: false }
  }
}