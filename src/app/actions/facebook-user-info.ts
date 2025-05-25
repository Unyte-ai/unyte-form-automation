'use server'

import { createClient } from '@/lib/supabase/server'

export interface FacebookUserInfo {
  displayName?: string;
  email?: string;
  profilePicture?: string;
  facebookUserId?: string;
}

/**
 * Fetches Facebook user information for the currently logged in user and organization
 * @param organizationId The organization ID for the connection
 */
export async function getFacebookUserInfo(organizationId: string): Promise<{ 
  success: boolean; 
  data?: FacebookUserInfo | null;
  error?: string;
}> {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Get the Facebook connection information for this organization
    const { data: connection, error } = await supabase
      .from('facebook_connections')
      .select('facebook_user_id, display_name, email, profile_picture')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()
    
    if (error || !connection) {
      return { 
        success: true,
        data: null
      }
    }
    
    // Return the Facebook user info
    return {
      success: true,
      data: {
        displayName: connection.display_name,
        email: connection.email,
        profilePicture: connection.profile_picture,
        facebookUserId: connection.facebook_user_id
      }
    }
  } catch (error) {
    console.error('Error fetching Facebook user info:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}