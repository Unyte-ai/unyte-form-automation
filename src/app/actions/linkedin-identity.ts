'use server'

import { createClient } from '@/lib/supabase/server'

export interface LinkedInIdentity {
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
 * Fetches detailed information about the user's LinkedIn identity
 * from Supabase Auth
 */
export async function getLinkedInIdentityDetails(): Promise<{ 
  success: boolean; 
  data?: LinkedInIdentity | null;
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
    
    // Find the LinkedIn identity
    const linkedinIdentity = identitiesData.identities.find(
      identity => identity.provider === 'linkedin_oidc'
    )
    
    if (!linkedinIdentity) {
      return { 
        success: true,
        data: null
      }
    }
    
    // Return the LinkedIn identity data
    return {
      success: true,
      data: {
        id: linkedinIdentity.id,
        provider: linkedinIdentity.provider,
        identityData: linkedinIdentity.identity_data || {}
      }
    }
  } catch (error) {
    console.error('Error fetching LinkedIn identity details:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}