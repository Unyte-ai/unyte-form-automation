'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type CreateOrganizationData = {
  name: string
  platformType: string
  email: string
  userId: string
  userName: string
  userEmail: string
}

/**
 * Creates a new organization in the database,
 * and automatically adds the creator as the 'owner'.
 */
export async function createOrganization(data: CreateOrganizationData) {
  const supabase = await createClient()

  const { name, platformType, email, userId, userName, userEmail } = data

  // 1️⃣ Insert the organization
  const {
    data: organization,
    error: orgError,
  } = await supabase
    .from('organizations')
    .insert({
      user_id: userId,
      name,
      platform_type: platformType,
      org_email: email,
      is_active: true,
      created_by_id: userId,
      created_by_name: userName,
      updated_by_id: userId,
      updated_by_name: userName,
    })
    .select()
    .single()

  if (orgError) {
    console.error('Error creating organization:', orgError)
    throw new Error(orgError.message)
  }

  // 2️⃣ Automatically add the creator as owner in organization_members,
  //    now populating user_name and use_email
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization: organization.id,
      user_id:      userId,
      role:         'owner',
      user_name:    userName,
      user_email:   userEmail,
      invitation_status: 'accepted',  // Owners are automatically accepted
      invited_by:   userId            // Owner invited themselves
    })    

  if (memberError) {
    console.error('Error creating organization membership:', memberError)
    throw new Error(memberError.message)
  }

  // 3️⃣ Revalidate any paths that might show organization data
  revalidatePath('/home')

  return organization
}

/**
 * Fetches all organizations for the current user
 */
export async function getUserOrganizations() {
  const supabase = await createClient()

  const { data: organizations, error } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching organizations:', error)
    throw new Error(error.message)
  }

  return organizations || []
}

/**
 * Deletes an organization from the database
 */
export async function deleteOrganization(organizationId: string) {
  const supabase = await createClient()

  // Delete the organization (membership rows cascade)
  const { error, data } = await supabase
    .from('organizations')
    .delete()
    .eq('id', organizationId)
    .select()

  if (error) {
    console.error('Error deleting organization:', error)
    throw new Error(error.message)
  }

  // Revalidate any paths that might show organization data
  revalidatePath('/home')

  return data?.[0] || null
}

/**
 * Fetches the next available organization ID (if any)
 * This is used for post-delete navigation
 * @param currentOrgId The ID of the organization being deleted
 */
export async function getNextOrganizationId(currentOrgId: string) {
  const supabase = await createClient()

  // Get all organizations except the current one
  const { data: organizations, error } = await supabase
    .from('organizations')
    .select('id')
    .neq('id', currentOrgId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error fetching next organization:', error)
    throw new Error(error.message)
  }

  // Return the ID of the next organization, or null if none exist
  return organizations && organizations.length > 0 ? organizations[0].id : null
}
