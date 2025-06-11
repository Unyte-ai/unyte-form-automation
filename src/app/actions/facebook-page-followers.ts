'use server'

import { createClient } from '@/lib/supabase/server'

export interface PageFollowers {
  pageId: string
  pageName: string
  followers: number | null
}

export async function getFacebookPageFollowers(
  organizationId: string,
  pageIds: string[]
): Promise<{ 
  success: boolean
  data?: PageFollowers[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    const { data: connection, error: connectionError } = await supabase
      .from('facebook_connections')
      .select('access_token, token_expires_at')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()
    
    if (connectionError || !connection) {
      throw new Error('Facebook connection not found')
    }

    const tokenExpiresAt = new Date(connection.token_expires_at)
    if (tokenExpiresAt <= new Date()) {
      throw new Error('Facebook access token has expired')
    }

    const results: PageFollowers[] = []

    for (const pageId of pageIds) {
      try {
        // Get page name and follower count
        const response = await fetch(
          `https://graph.facebook.com/v22.0/${pageId}?fields=name,followers_count&access_token=${connection.access_token}`,
          { method: 'GET', headers: { 'Cache-Control': 'no-cache' } }
        )

        if (response.ok) {
          const data = await response.json()
          results.push({
            pageId,
            pageName: data.name || `Page ${pageId}`,
            followers: data.followers_count || null
          })
        } else {
          // Fallback if followers_count fails
          const nameResponse = await fetch(
            `https://graph.facebook.com/v22.0/${pageId}?fields=name&access_token=${connection.access_token}`
          )
          const nameData = nameResponse.ok ? await nameResponse.json() : {}
          
          results.push({
            pageId,
            pageName: nameData.name || `Page ${pageId}`,
            followers: null
          })
        }
        } catch {
        results.push({
          pageId,
          pageName: `Page ${pageId}`,
          followers: null
        })
      }
    }

    return { success: true, data: results }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch followers'
    }
  }
}