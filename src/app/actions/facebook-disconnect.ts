'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Disconnects a user's Facebook account by revoking their token
 * and removing the connection from the database
 */
export async function disconnectFacebook(organizationId: string): Promise<{ 
  success: boolean; 
  error?: string;
}> {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Get the Facebook connection information
    const { data: connection, error } = await supabase
      .from('facebook_connections')
      .select('id, access_token')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()
    
    if (error || !connection) {
      throw new Error('Facebook connection not found')
    }

    if (connection.access_token) {
      try {
        // Attempt to revoke the token with Facebook
        // Using Facebook's token deauthorization endpoint
        const response = await fetch(`https://graph.facebook.com/v22.0/me/permissions?access_token=${connection.access_token}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        // Log but don't fail if token revocation fails
        if (!response.ok) {
          console.warn('Facebook token revocation may have failed:', await response.text())
        }
      } catch (revokeError) {
        // Log but continue - we still want to remove from our database
        console.warn('Error revoking Facebook token:', revokeError)
      }
    }
    
    // Delete the connection from the database
    const { error: deleteError } = await adminClient
      .from('facebook_connections')
      .delete()
      .eq('id', connection.id)
    
    if (deleteError) {
      throw new Error(`Error deleting Facebook connection: ${deleteError.message}`)
    }
    
    // Revalidate relevant paths to update UI
    revalidatePath(`/home/${organizationId}`)
    
    return { success: true }
  } catch (error) {
    console.error('Error disconnecting Facebook:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}