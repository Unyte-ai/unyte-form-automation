'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface LinkedInTokenData {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
  refreshTokenExpiresIn?: number;
  scope: string;
}

interface LinkedInUserInfo {
  id: string;
  displayName?: string;
  email?: string;
  profilePicture?: string;
}

/**
 * Fetches basic user info from LinkedIn using the access token
 */
async function fetchLinkedInUserInfo(accessToken: string): Promise<LinkedInUserInfo> {
  try {
    // Make request to LinkedIn's user info endpoint (using OpenID Connect userinfo endpoint)
    const response = await fetch(
      'https://api.linkedin.com/v2/userinfo',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (!response.ok) {
      console.error('LinkedIn user info request failed:', response.status)
      // Return minimal data with LinkedIn ID as 'unknown'
      return { id: 'unknown' }
    }
    
    const data = await response.json()
    
    // Map OpenID Connect fields to our structure
    return {
      id: data.sub, // OpenID Connect standard field for user identifier
      displayName: data.name || '',
      email: data.email || '',
      profilePicture: data.picture || ''
    }
  } catch (error) {
    console.error('Error fetching LinkedIn user info:', error)
    // Return minimal data in case of error
    return { id: 'unknown' }
  }
}

/**
 * Stores LinkedIn token and user info in the database
 * Links token to both user and organization
 */
export async function storeLinkedInToken(
  tokenData: LinkedInTokenData,
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
    
    // Fetch basic user info from LinkedIn
    const userInfo = await fetchLinkedInUserInfo(tokenData.accessToken)
    
    // Create admin client for database operations
    const adminClient = createAdminClient()
    
    // Calculate expiry timestamps
    const now = new Date()
    const tokenExpiresAt = new Date(now.getTime() + tokenData.expiresIn * 1000)
    const refreshExpiresAt = tokenData.refreshTokenExpiresIn 
      ? new Date(now.getTime() + tokenData.refreshTokenExpiresIn * 1000)
      : null
    
    // Check if connection exists for this user and organization
    const { data: existingConnection } = await adminClient
      .from('linkedin_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()
    
    if (existingConnection) {
      // Update existing connection
      const { error: updateError } = await adminClient
        .from('linkedin_connections')
        .update({
          linkedin_user_id: userInfo.id,
          access_token: tokenData.accessToken,
          refresh_token: tokenData.refreshToken || null,
          token_expires_at: tokenExpiresAt.toISOString(),
          refresh_expires_at: refreshExpiresAt?.toISOString() || null,
          display_name: userInfo.displayName,
          email: userInfo.email,
          profile_picture: userInfo.profilePicture,
          updated_at: now.toISOString()
        })
        .eq('id', existingConnection.id)
      
      if (updateError) {
        throw new Error(`Failed to update LinkedIn connection: ${updateError.message}`)
      }
    } else {
      // Create new connection
      const { error: insertError } = await adminClient
        .from('linkedin_connections')
        .insert({
          user_id: user.id,
          organization_id: organizationId,
          linkedin_user_id: userInfo.id,
          access_token: tokenData.accessToken,
          refresh_token: tokenData.refreshToken || null,
          token_expires_at: tokenExpiresAt.toISOString(),
          refresh_expires_at: refreshExpiresAt?.toISOString() || null,
          display_name: userInfo.displayName,
          email: userInfo.email,
          profile_picture: userInfo.profilePicture,
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        })
      
      if (insertError) {
        throw new Error(`Failed to create LinkedIn connection: ${insertError.message}`)
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error storing LinkedIn token:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Gets the active organization ID for the user
 * Falls back to the first organization if none is active
 */
// export async function getActiveOrganizationId(): Promise<string | null> {
//   try {
//     const supabase = await createClient()
    
//     // First, check if the user has a cookie or session indicating active organization
//     // For now, simply get the first organization the user is a member of
//     const { data: organizations, error } = await supabase
//       .from('organizations')
//       .select('id')
//       .order('created_at', { ascending: false })
//       .limit(1)
    
//     if (error || !organizations || organizations.length === 0) {
//       return null
//     }
    
//     return organizations[0].id
//   } catch (error) {
//     console.error('Error getting active organization:', error)
//     return null
//   }
// }