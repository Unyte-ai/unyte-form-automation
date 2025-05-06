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
 * Handles both existing users and new users differently
 */
export async function inviteUserToOrganization(organizationId: string, email: string) {
  const supabase = await createClient()
  
  // Get the current user (who is doing the inviting)
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  if (!currentUser) {
    throw new Error('You must be logged in to invite users')
  }
  
  // Create an admin client with service role key for user management
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
  
  try {
    // First try to find the user by email using listUsers
    const { data, error: listError } = await adminClient.auth.admin.listUsers()
    
    if (listError) {
      throw new Error(`Failed to check existing users: ${listError.message}`)
    }
    
    // Find user by email with case-insensitive comparison
    const normalizedEmail = email.toLowerCase()
    const existingUser = data?.users?.find(user => 
      user.email?.toLowerCase() === normalizedEmail
    )
    
    if (existingUser) {
      // User already exists - create member record and send magic link
      const displayName = existingUser.user_metadata?.full_name || 
                          existingUser.email?.split('@')[0] || 
                          'Invited User'
            
      // Insert the member record
      const { data: member, error } = await supabase
        .from('organization_members')
        .insert({
          organization: organizationId,
          user_id: existingUser.id,
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
      
      // Create the redirect URL for the magic link
      const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/accept-invitation?organization=${organizationId}&member=${member.id}`
      
      // Send the magic link using signInWithOtp
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: false // Ensure we don't create duplicate users
        }
      })
      
      if (otpError) {
        console.error('Error sending magic link:', otpError)
        throw new Error(`Failed to send invitation email: ${otpError.message}`)
      }
      
      return { 
        ...member, 
        isExistingUser: true
      }
    } else {
      // User doesn't exist - try to create a new user with proper error handling
      try {
        const { data: invitedUser, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/invite?next=/home`
        })
        
        if (inviteError) {
          // If error is because user already exists (despite our check)
          if (inviteError.message?.includes('already been registered') || 
              inviteError.status === 422 || 
              inviteError.code === 'email_exists') {
            
            console.log('User exists but was not found in initial check, trying fallback method')
            
            // Try again with a more thorough search - maybe the first check missed them
            // This might happen if there are pagination issues or race conditions
            const { data: secondCheckData } = await adminClient.auth.admin.listUsers({
              page: 1,           // Explicitly start at page 1
              perPage: 1000      // Request a larger page size to catch more users
            })
            
            // Find user with case-insensitive comparison
            const secondCheckUser = secondCheckData?.users?.find(user => 
              user.email?.toLowerCase() === normalizedEmail
            )
            
            if (secondCheckUser) {
              // Found the user on second check - treat as existing user
              const displayName = secondCheckUser.user_metadata?.full_name || 
                                secondCheckUser.email?.split('@')[0] || 
                                'Invited User'
                      
              // Insert the member record
              const { data: member, error } = await supabase
                .from('organization_members')
                .insert({
                  organization: organizationId,
                  user_id: secondCheckUser.id,
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
              
              // Create the redirect URL for the magic link
              const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/accept-invitation?organization=${organizationId}&member=${member.id}`
              
              // Send the magic link using signInWithOtp
              const { error: otpError } = await supabase.auth.signInWithOtp({
                email: email,
                options: {
                  emailRedirectTo: redirectUrl,
                  shouldCreateUser: false
                }
              })
              
              if (otpError) {
                console.error('Error sending magic link:', otpError)
                throw new Error(`Failed to send invitation email: ${otpError.message}`)
              }
              
              return { 
                ...member, 
                isExistingUser: true
              }
            } else {
              // Still couldn't find user despite the error
              throw new Error(`User appears to exist but couldn't be found: ${inviteError.message}`)
            }
          } else {
            // Some other invite error
            console.error('Error inviting user:', inviteError)
            throw new Error(`Failed to invite user: ${inviteError.message}`)
          }
        }
        
        if (!invitedUser?.user) {
          throw new Error('Failed to get user data from invite response')
        }
        
        // Successfully invited a new user
        const userId = invitedUser.user.id
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
        
        return { ...member, isExistingUser: false }
      } catch (inviteError) {
        console.error('Error in invite attempt:', inviteError)
        throw inviteError
      }
    }
  } catch (error) {
    console.error('Error in inviteUserToOrganization:', error)
    throw error
  } finally {
    // Revalidate cached data
    revalidatePath(`/home/${organizationId}`)
  }
}

/**
 * Allow an existing user to accept an organization invitation
 */
export async function acceptOrganizationInvitation(organizationId: string, memberId: string) {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('You must be logged in to accept an invitation')
  }
  
  // Update the member record
  const { error } = await supabase
    .from('organization_members')
    .update({
      invitation_status: 'accepted'
    })
    .eq('id', memberId)
    .eq('organization', organizationId)
    .eq('user_id', user.id)
  
  if (error) {
    console.error('Error accepting invitation:', error)
    throw new Error(error.message)
  }
  
  // Revalidate the path to update the UI
  revalidatePath(`/home/${organizationId}`)
  
  return { success: true }
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