'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Remove the unused type definition
// type SocialProvider = 'google' | 'facebook' | 'linkedin_oidc' | 'twitter'

/**
 * Get all social connections for an organization
 */
export async function getOrganizationSocialConnections(organizationId: string) {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('You must be logged in to view social connections')
  }
  
  // Verify user is a member of this organization
  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization', organizationId)
    .eq('user_id', user.id)
    .single()
  
  if (membershipError || !membership) {
    throw new Error('You must be a member of this organization to view social connections')
  }
  
  // Get all social connections for this organization and user
  const { data: connections, error: connectionsError } = await supabase
    .from('organization_identity_links')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    
  if (connectionsError) {
    console.error('Error fetching social connections:', connectionsError)
    throw new Error('Failed to fetch social connections')
  }
  
  return connections || []
}

/**
 * Delete a social connection
 */
export async function deleteSocialConnection(connectionId: string) {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('You must be logged in to delete social connections')
  }
  
  // Get the connection to verify ownership
  const { data: connection, error: connectionError } = await supabase
    .from('organization_identity_links')
    .select('organization_id, user_id')
    .eq('id', connectionId)
    .single()
  
  if (connectionError || !connection) {
    throw new Error('Connection not found')
  }
  
  // Verify user owns this connection
  if (connection.user_id !== user.id) {
    throw new Error('You do not have permission to delete this connection')
  }
  
  // Delete the connection
  const { error: deleteError } = await supabase
    .from('organization_identity_links')
    .delete()
    .eq('id', connectionId)
    
  if (deleteError) {
    console.error('Error deleting social connection:', deleteError)
    throw new Error('Failed to delete social connection')
  }
  
  // Revalidate the path
  revalidatePath(`/home/${connection.organization_id}`)
  
  return { success: true }
}

/**
 * Refresh an expired token
 * Note: This is a stub - actual implementation depends on provider-specific refresh token flows
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function refreshSocialToken(connectionId: string) {
    // This would need to be implemented based on the specific OAuth provider's refresh token flow
    // Each provider has different requirements for refreshing tokens
    throw new Error('Token refresh not implemented')
  }