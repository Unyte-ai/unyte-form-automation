'use server'

import { createClient } from '@/lib/supabase/server'

export interface LinkedInCampaignGroup {
  id: string
  name: string
}

interface LinkedInApiCampaignGroup {
  id: string
  name?: string
}

/**
 * Fetches LinkedIn campaign groups for a specific ad account
 * @param organizationId - The ID of the organization in our system
 * @param adAccountId - The LinkedIn ad account ID
 */
export async function getLinkedInCampaignGroups(
  organizationId: string, 
  adAccountId: string
): Promise<{ 
  success: boolean
  data?: LinkedInCampaignGroup[]
  error?: string
}> {
  try {
    // Get the current user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Get the LinkedIn connection for this user and organization
    const { data: connection, error: connectionError } = await supabase
      .from('linkedin_connections')
      .select('access_token, token_expires_at')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()
    
    if (connectionError || !connection) {
      throw new Error('LinkedIn connection not found for this organization')
    }

    // Check if the token is expired
    const tokenExpiresAt = new Date(connection.token_expires_at)
    const now = new Date()
    
    if (tokenExpiresAt <= now) {
      throw new Error('LinkedIn access token has expired. Please reconnect your LinkedIn account.')
    }
    
    // Make authenticated request to LinkedIn API to get campaign groups for the specific ad account
    const response = await fetch(`https://api.linkedin.com/rest/adAccounts/${adAccountId}/adCampaignGroups?q=search`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'LinkedIn-Version': '202501',
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('LinkedIn Campaign Groups API request failed:', response.status, errorText)
      throw new Error(`LinkedIn API request failed: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Transform LinkedIn API response to our interface
    const campaignGroups = data.elements?.map((group: LinkedInApiCampaignGroup): LinkedInCampaignGroup => ({
      id: group.id,
      name: group.name || `Campaign Group ${group.id}`,
    })) || []
    
    return {
      success: true,
      data: campaignGroups
    }
  } catch (error) {
    console.error('Error fetching LinkedIn campaign groups:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}