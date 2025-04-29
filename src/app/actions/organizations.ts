'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type CreateOrganizationData = {
  name: string
  platformType: string
  email: string
  userId: string
  userName: string
}

/**
 * Creates a new organization in the database
 */
export async function createOrganization(data: CreateOrganizationData) {
  const supabase = await createClient()
  
  const { name, platformType, email, userId, userName } = data
  
  // Insert the organization data
  const { data: organization, error } = await supabase
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
      updated_by_name: userName
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating organization:', error)
    throw new Error(error.message)
  }
  
  // Revalidate any paths that might show organization data
  revalidatePath('/protected')
  
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