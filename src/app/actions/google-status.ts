'use server'

import { createClient } from '@/lib/supabase/server'

export interface GoogleConnectionStatus {
  isConnected: boolean
  displayName?: string
  email?: string
  profilePicture?: string
}

export async function getGoogleConnectionStatus(organizationId?: string): Promise<GoogleConnectionStatus> {
  try {
    // Get the current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { isConnected: false }
    }

    // If no organizationId provided, just return false
    if (!organizationId) {
      return { isConnected: false }
    }

    // Check if user has a Google connection for this specific organization
    const { data: connection, error } = await supabase
      .from('google_connections')
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
    console.error('Error checking Google connection:', error)
    return { isConnected: false }
  }
}