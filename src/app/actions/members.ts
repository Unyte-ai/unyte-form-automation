'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { v4 as uuidv4 } from 'uuid' // Make sure 'uuid' is in your dependencies

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
  
  // Check if the invited user already exists in our auth system
  const adminClient = supabase.auth.admin
  
  let existingUser = null
  let userName = null
  
  // Using the listUsers() admin method to find users by email
  const { data: usersData } = await adminClient.listUsers()
  
  if (usersData?.users) {
    // Find a user with the matching email
    existingUser = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    
    if (existingUser) {
      // Get user's name from metadata if available
      userName = existingUser.user_metadata?.full_name || 'User'
    }
  }
  
  // Generate placeholder UUID for users who don't exist yet
  const userId = existingUser?.id || uuidv4()
  
  // Set a default name for users who don't exist yet
  const displayName = userName || `Pending User (${email.split('@')[0]})`
  
  // Insert the member record
  const { data: member, error } = await supabase
    .from('organization_members')
    .insert({
      organization: organizationId,
      user_id: userId,
      user_name: displayName, // Use the display name (never null)
      user_email: email,
      role: 'member',
      invitation_status: 'pending',
      invited_at: new Date().toISOString(),
      invited_by: currentUser.id
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error inviting user:', error)
    throw new Error(error.message)
  }
  
  // Revalidate cached data
  revalidatePath(`/home/${organizationId}`)
  
  return member
}