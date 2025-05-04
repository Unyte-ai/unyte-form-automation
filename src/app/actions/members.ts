'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

/**
 * Fetches all members for a specific organization
 */
export async function getOrganizationMembers(organizationId: string) {
  const supabase = await createClient()

  const { data: members, error } = await supabase
    .from('organization_members')
    .select('*')
    .eq('organization', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching organization members:', error)
    throw new Error(error.message)
  }

  return members || []
}

/**
 * Invites a user to an organization
 */
export async function inviteUserToOrganization(organizationId: string, email: string) {
  const supabase = await createClient()
  
  // Get the current user (who is doing the inviting)
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  if (!currentUser) {
    throw new Error('You must be logged in to invite users')
  }
  
  // Create an admin client with service role key
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
  
  const { data: invitedUser, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    // Use the new invite route
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/invite?next=/home`
  })
  
  if (inviteError) {
    console.error('Error inviting user:', inviteError)
    throw new Error(`Failed to invite user: ${inviteError.message}`)
  }
  
  if (!invitedUser?.user) {
    throw new Error('Failed to get user data from invite response')
  }
  
  // The invited user now has a real Supabase user ID
  const userId = invitedUser.user.id
  
  // Extract or create a display name
  const displayName = invitedUser.user.user_metadata?.full_name || 
                      invitedUser.user.email?.split('@')[0] || 
                      'Invited User'
  
  // Insert the member record
  const { data: member, error } = await supabase
    .from('organization_members')
    .insert({
      organization: organizationId,
      user_id: userId,
      user_name: displayName,
      user_email: email,
      role: 'member',
      invitation_status: 'pending',
      invited_at: new Date().toISOString(),
      invited_by: currentUser.id
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating member record:', error)
    throw new Error(error.message)
  }
  
  // Revalidate cached data
  revalidatePath(`/home/${organizationId}`)
  
  return member
}

/**
 * Deletes a member from an organization
 */
export async function deleteOrganizationMember(organizationId: string, memberId: string) {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('You must be logged in to delete members')
  }
  
  // Check if the current user is an owner of the organization
  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization', organizationId)
    .eq('user_id', user.id)
    .single()
  
  if (membershipError || !membership || membership.role !== 'owner') {
    throw new Error('Only organization owners can delete members')
  }
  
  // Delete the member
  const { error: deleteError } = await supabase
    .from('organization_members')
    .delete()
    .eq('id', memberId)
    .eq('organization', organizationId)
  
  if (deleteError) {
    console.error('Error deleting member:', deleteError)
    throw new Error(deleteError.message)
  }
  
  // Revalidate the path to update the UI
  revalidatePath(`/home/${organizationId}`)
  
  return { success: true }
}

/**
 * Allows a member to leave an organization
 */
export async function leaveOrganization(organizationId: string) {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('You must be logged in to leave an organization')
  }
  
  // Delete the current user's membership
  const { error: deleteError } = await supabase
    .from('organization_members')
    .delete()
    .eq('organization', organizationId)
    .eq('user_id', user.id)
  
  if (deleteError) {
    console.error('Error leaving organization:', deleteError)
    throw new Error(deleteError.message)
  }
  
  // Revalidate the path to update the UI
  revalidatePath('/home')
  
  return { success: true }
}