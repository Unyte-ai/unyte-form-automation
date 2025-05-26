'use server'

import { createClient } from '@/lib/supabase/server'

export interface FacebookAdCampaign {
  id: string
  name: string
  status?: string
  objective?: string
  daily_budget?: {
    amount: string
    currency: string
  }
  lifetime_budget?: {
    amount: string
    currency: string
  }
  created_time?: string
  updated_time?: string
}

interface FacebookApiCampaign {
  id: string
  name?: string
  status?: string
  objective?: string
  daily_budget?: string
  lifetime_budget?: string
  created_time?: string
  updated_time?: string
}

/**
 * Fetches Facebook campaigns for a specific ad account
 * @param organizationId - The ID of the organization in our system
 * @param adAccountId - The Facebook ad account ID
 */
export async function getFacebookAdCampaigns(
  organizationId: string,
  adAccountId: string
): Promise<{ 
  success: boolean
  data?: FacebookAdCampaign[]
  error?: string
}> {
  try {
    // Get the current user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Get the Facebook connection for this user and organization
    const { data: connection, error: connectionError } = await supabase
      .from('facebook_connections')
      .select('access_token, token_expires_at')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()
    
    if (connectionError || !connection) {
      throw new Error('Facebook connection not found for this organization')
    }

    // Check if the token is expired
    const tokenExpiresAt = new Date(connection.token_expires_at)
    const now = new Date()
    
    if (tokenExpiresAt <= now) {
      throw new Error('Facebook access token has expired. Please reconnect your Facebook account.')
    }
    
    // Make authenticated request to Facebook Graph API to get campaigns for the specific ad account
    // Note: adAccountId already includes the 'act_' prefix from the /me/adaccounts endpoint
    const response = await fetch(
      `https://graph.facebook.com/v22.0/${adAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Facebook Campaigns API request failed:', response.status, errorText)
      throw new Error(`Facebook API request failed: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Transform Facebook API response to our interface
    const campaigns = data.data?.map((campaign: FacebookApiCampaign): FacebookAdCampaign => {
      const result: FacebookAdCampaign = {
        id: campaign.id,
        name: campaign.name || `Campaign ${campaign.id}`,
        status: campaign.status,
        objective: campaign.objective,
        created_time: campaign.created_time,
        updated_time: campaign.updated_time
      }
      
      // Handle budget information
      if (campaign.daily_budget) {
        result.daily_budget = {
          amount: campaign.daily_budget,
          currency: 'USD' // Facebook API returns budget in cents, you might need to adjust this
        }
      }
      
      if (campaign.lifetime_budget) {
        result.lifetime_budget = {
          amount: campaign.lifetime_budget,
          currency: 'USD' // Facebook API returns budget in cents, you might need to adjust this
        }
      }
      
      return result
    }) || []
    
    return {
      success: true,
      data: campaigns
    }
  } catch (error) {
    console.error('Error fetching Facebook campaigns:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}