'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function completeInviteSetup(fullName: string, password: string) {
  const supabase = await createClient()

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('Unable to get user information')
  }

  try {
    // Update the user's auth metadata and password
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
      data: {
        full_name: fullName
      }
    })

    if (updateError) {
      throw new Error(updateError.message)
    }

    // Update all organization_members records for this user that have pending status
    const { error: membersError } = await supabase
      .from('organization_members')
      .update({
        user_name: fullName,
        invitation_status: 'accepted'
      })
      .eq('user_id', user.id)
      .eq('invitation_status', 'pending')

    if (membersError) {
      throw new Error(membersError.message)
    }

    // Revalidate any relevant paths
    revalidatePath('/home')

    return { success: true }
  } catch (error) {
    console.error('Error completing invite setup:', error)
    throw error
  }
}