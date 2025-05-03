'use server'

import { createClient } from '@/lib/supabase/server'

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
