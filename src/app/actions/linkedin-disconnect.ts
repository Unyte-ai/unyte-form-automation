'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Disconnects a user's LinkedIn account by revoking their token
 * and removing the connection from the database
 */
export async function disconnectLinkedIn(organizationId: string): Promise<{ 
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

    // Get the LinkedIn connection information
    const { data: connection, error } = await supabase
      .from('linkedin_connections')
      .select('id, access_token')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()
    
    if (error || !connection) {
      throw new Error('LinkedIn connection not found')
    }

    // Get credentials from environment variables
    const clientId = process.env.LINKEDIN_CLIENT_ID
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
    
    if (connection.access_token) {
      try {
        // Attempt to revoke the token with LinkedIn
        // Using LinkedIn's token revocation endpoint
        const response = await fetch('https://www.linkedin.com/oauth/v2/revoke', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            token: connection.access_token,
            client_id: clientId || '',
            client_secret: clientSecret || ''
          }).toString()
        })
        
        // Log but don't fail if token revocation fails
        if (!response.ok) {
          console.warn('LinkedIn token revocation may have failed:', await response.text())
        }
      } catch (revokeError) {
        // Log but continue - we still want to remove from our database
        console.warn('Error revoking LinkedIn token:', revokeError)
      }
    }
    
    // Delete the connection from the database
    const { error: deleteError } = await adminClient
      .from('linkedin_connections')
      .delete()
      .eq('id', connection.id)
    
    if (deleteError) {
      throw new Error(`Error deleting LinkedIn connection: ${deleteError.message}`)
    }
    
    // Revalidate relevant paths to update UI
    revalidatePath(`/home/${organizationId}`)
    
    return { success: true }
  } catch (error) {
    console.error('Error disconnecting LinkedIn:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}