'use server'

import { createClient } from '@/lib/supabase/server'

type IdentityLinkData = {
  organizationId: string
  userId: string
  userEmail: string
  userName: string
  provider: string      // Now a parameter rather than hardcoded
  providerId: string    // The provider's unique ID for the user
  providerEmail?: string
  providerName?: string
  accessToken: string
  refreshToken?: string
  tokenExpiry?: string | number | Date
}

/**
 * Links a provider identity to a user for a specific organization
 */
export async function linkIdentity(data: IdentityLinkData) {
  const supabase = await createClient()
  
  const {
    organizationId,
    userId,
    userEmail,
    userName,
    provider,
    providerId,
    providerEmail,
    providerName,
    accessToken,
    refreshToken,
    tokenExpiry
  } = data
  
  try {
    // Check if the identity already exists for this user+org+provider combination
    const { data: existingLink, error: checkError } = await supabase
      .from('organization_identity_links')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('provider', provider)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
      throw new Error(`Error checking existing identity: ${checkError.message}`)
    }
    
    if (existingLink) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('organization_identity_links')
        .update({
          provider_id: providerId,
          provider_email: providerEmail,
          provider_name: providerName,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expiry: tokenExpiry,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLink.id)
      
      if (updateError) {
        throw new Error(`Error updating identity: ${updateError.message}`)
      }
      
      return { success: true, id: existingLink.id, isNew: false }
    } else {
      // Insert new record
      const { data: newLink, error: insertError } = await supabase
        .from('organization_identity_links')
        .insert({
          organization_id: organizationId,
          user_id: userId,
          user_email: userEmail,
          user_name: userName,
          provider: provider,
          provider_id: providerId,
          provider_email: providerEmail,
          provider_name: providerName,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expiry: tokenExpiry,
        })
        .select('id')
        .single()
      
      if (insertError) {
        throw new Error(`Error creating identity link: ${insertError.message}`)
      }
      
      return { success: true, id: newLink.id, isNew: true }
    }
  } catch (error) {
    console.error(`Error linking ${provider} identity:`, error)
    throw error
  }
}