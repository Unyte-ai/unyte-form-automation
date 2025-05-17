'use server'

import { createClient } from '@/lib/supabase/server'

export interface MetaIdentity {
  id: string;
  provider: string;
  identityData: {
    avatar_url?: string;
    email?: string;
    full_name?: string;
    name?: string;
    picture?: string;
    provider_id?: string;
    email_verified?: boolean;
    [key: string]: unknown; // For any other properties that might be returned
  };
}

/**
 * Fetches detailed information about the user's Meta/Facebook identity
 * from Supabase Auth
 */
export async function getMetaIdentityDetails(): Promise<{ 
  success: boolean; 
  data?: MetaIdentity | null;
  error?: string;
}> {
  try {
    const supabase = await createClient()
    
    // Get the current user's identities
    const { data: identitiesData, error } = await supabase.auth.getUserIdentities()
    
    if (error) {
      throw new Error(`Failed to fetch user identities: ${error.message}`)
    }
    
    if (!identitiesData?.identities || identitiesData.identities.length === 0) {
      return { 
        success: true,
        data: null
      }
    }
    
    // Find the Facebook/Meta identity
    const metaIdentity = identitiesData.identities.find(
      identity => identity.provider === 'facebook'
    )
    
    if (!metaIdentity) {
      return { 
        success: true,
        data: null
      }
    }
    
    // Return the Meta identity data
    return {
      success: true,
      data: {
        id: metaIdentity.id,
        provider: metaIdentity.provider,
        identityData: metaIdentity.identity_data || {}
      }
    }
  } catch (error) {
    console.error('Error fetching Meta identity details:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}