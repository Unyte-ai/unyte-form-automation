'use server'

import { createClient } from '@/lib/supabase/server'

export interface LinkedInAdCampaign {
  id: string
  name: string
  status?: string
  type?: string
  costType?: string
  dailyBudget?: {
    amount: string
    currencyCode: string
  }
  totalBudget?: {
    amount: string
    currencyCode: string
  }
}

interface LinkedInApiCampaign {
  id: string
  name?: string
  status?: string
  type?: string
  costType?: string
  campaignGroup?: string // Add this field for filtering
  dailyBudget?: {
    amount: string
    currencyCode: string
  }
  totalBudget?: {
    amount: string
    currencyCode: string
  }
}

/**
 * Fetches LinkedIn campaigns for a specific campaign group
 * @param organizationId - The ID of the organization in our system
 * @param adAccountId - The LinkedIn ad account ID
 * @param campaignGroupId - The LinkedIn campaign group ID
 */
export async function getLinkedInAdCampaigns(
  organizationId: string,
  adAccountId: string,
  campaignGroupId: string
): Promise<{ 
  success: boolean
  data?: LinkedInAdCampaign[]
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
    
    // LinkedIn API does NOT support filtering campaigns by campaignGroup directly
    // We need to get all campaigns and filter client-side by campaignGroup
    
    const url = `https://api.linkedin.com/rest/adAccounts/${adAccountId}/adCampaigns?q=search`
    
    console.log('LinkedIn API Request URL:', url)
    console.log('Will filter for Campaign Group URN:', `urn:li:sponsoredCampaignGroup:${campaignGroupId}`)
    
    const response = await fetch(url,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'LinkedIn-Version': '202501',
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('LinkedIn Campaigns API request failed:', response.status, errorText)
      throw new Error(`LinkedIn API request failed: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Filter campaigns by the specific campaign group
    const campaignGroupUrn = `urn:li:sponsoredCampaignGroup:${campaignGroupId}`
    const filteredCampaigns = data.elements?.filter((campaign: LinkedInApiCampaign) => 
      campaign.campaignGroup === campaignGroupUrn
    ) || []
    
    console.log(`Found ${data.elements?.length || 0} total campaigns, ${filteredCampaigns.length} match campaign group`)
    
    // Transform LinkedIn API response to our interface
    const campaigns = filteredCampaigns.map((campaign: LinkedInApiCampaign): LinkedInAdCampaign => ({
      id: campaign.id,
      name: campaign.name || `Campaign ${campaign.id}`,
      status: campaign.status,
      type: campaign.type,
      costType: campaign.costType,
      dailyBudget: campaign.dailyBudget,
      totalBudget: campaign.totalBudget,
    })) || []
    
    return {
      success: true,
      data: campaigns
    }
  } catch (error) {
    console.error('Error fetching LinkedIn campaigns:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}