'use server'

import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid' // You'll need to install this package

/**
 * Generates a unique email address for organization forms
 * Format: forms+uniqueID@accuracast.in
 */
export async function generateUniqueEmail(): Promise<string> {
  const supabase = await createClient()
  let isUnique = false
  let uniqueID = ''
  let email = ''
  
  // Try to generate a unique ID until we find one that doesn't exist
  while (!isUnique) {
    // Generate a shortened UUID (first 8 chars should be sufficient)
    uniqueID = uuidv4().split('-')[0]
    email = `forms+${uniqueID}@accuracast.in`
    
    // Check if this email already exists in the organizations table
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .eq('org_email', email)
      .single()
    
    if (error || !data) {
      // No match found, so our email is unique
      isUnique = true
    }
    // If match found, loop will continue and generate a new ID
  }
  
  return email
}