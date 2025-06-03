'use server'

import { createClient } from '@/lib/supabase/server'

export interface CreateLinkedInCampaignGroupData {
  account: string // Ad Account URN or ID
  name: string
  startDate: string // ISO date string (YYYY-MM-DD)
  endDate: string // ISO date string (YYYY-MM-DD)
  objectiveType: 'BRAND_AWARENESS' | 'ENGAGEMENT' | 'JOB_APPLICANT' | 'LEAD_GENERATION' | 'WEBSITE_CONVERSION' | 'WEBSITE_VISIT' | 'VIDEO_VIEW'
}

/**
 * Creates a draft LinkedIn campaign group
 * @param organizationId - The ID of the organization in our system
 * @param campaignGroupData - The campaign group data to create
 */
export async function createLinkedInCampaignGroup(
  organizationId: string,
  campaignGroupData: CreateLinkedInCampaignGroupData
): Promise<{ 
  success: boolean
  data?: { id: string; name: string }
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

    // Validate input data
    if (!campaignGroupData.account) {
      throw new Error('Account is required')
    }

    if (!campaignGroupData.name.trim()) {
      throw new Error('Campaign group name is required')
    }

    if (!campaignGroupData.startDate) {
      throw new Error('Start date is required')
    }

    if (!campaignGroupData.endDate) {
      throw new Error('End date is required')
    }

    if (new Date(campaignGroupData.endDate) <= new Date(campaignGroupData.startDate)) {
      throw new Error('End date must be after start date')
    }

    // Handle both string URNs and number IDs for account
    const accountUrn = typeof campaignGroupData.account === 'string' 
      ? campaignGroupData.account 
      : `urn:li:sponsoredAccount:${campaignGroupData.account}`

    // Extract ad account ID (works for both URN strings and numbers)
    const adAccountId = typeof campaignGroupData.account === 'string'
      ? campaignGroupData.account.replace('urn:li:sponsoredAccount:', '')
      : String(campaignGroupData.account)
    
    // Prepare the campaign group payload for LinkedIn API
    const campaignGroupPayload = {
      account: accountUrn,
      name: campaignGroupData.name.trim(),
      runSchedule: {
        start: new Date(campaignGroupData.startDate).getTime(),
        end: new Date(campaignGroupData.endDate).getTime()
      },
      status: 'DRAFT',
      objectiveType: campaignGroupData.objectiveType
    }
    
    console.log('Creating LinkedIn campaign group with payload:', JSON.stringify(campaignGroupPayload, null, 2))
    
    // Make authenticated request to LinkedIn API to create campaign group
    const response = await fetch(`https://api.linkedin.com/rest/adAccounts/${adAccountId}/adCampaignGroups`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'LinkedIn-Version': '202501',
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(campaignGroupPayload)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('LinkedIn Campaign Group Creation API request failed:', response.status, errorText)
      
      // Try to parse error for more specific message
      try {
        const errorData = JSON.parse(errorText)
        throw new Error(`LinkedIn API Error: ${errorData.message || errorText}`)
      } catch {
        throw new Error(`LinkedIn API request failed: ${response.status} - ${errorText}`)
      }
    }
    
    // Get the created campaign group ID from response headers
    const campaignGroupUrn = response.headers.get('x-linkedin-id')
    const campaignGroupId = campaignGroupUrn ? campaignGroupUrn.replace('urn:li:sponsoredCampaignGroup:', '') : 'unknown'
    
    console.log('LinkedIn campaign group created successfully with ID:', campaignGroupId)
    
    return {
      success: true,
      data: {
        id: campaignGroupId,
        name: campaignGroupData.name
      }
    }
  } catch (error) {
    console.error('Error creating LinkedIn campaign group:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}