'use server'

import { createClient } from '@/lib/supabase/server'

export interface CreateLinkedInCampaignData {
  account: string | number // Ad Account URN or ID
  campaignGroup: string | number // Campaign Group URN or ID
  costType: 'CPM' // Always CPM for simplicity - works with all campaign types
  name: string
  type: 'SPONSORED_UPDATES' | 'TEXT_AD' | 'SPONSORED_INMAILS' | 'DYNAMIC'
  locale: {
    country: string
    language: string
  }
  budgetType: 'daily' | 'total'
  budgetAmount: string
  currencyCode: string
  startDate: string // ISO date string (YYYY-MM-DD)
  endDate?: string // Optional ISO date string (YYYY-MM-DD)
  targetingCriteria: {
    include: {
      and: Array<{
        or: Record<string, string[]>
      }>
    }
    exclude?: {
      or: Record<string, string[]>
    }
  }
}

/**
 * Creates a draft LinkedIn campaign
 * @param organizationId - The ID of the organization in our system
 * @param campaignData - The campaign data to create
 */
export async function createLinkedInCampaign(
  organizationId: string,
  campaignData: CreateLinkedInCampaignData
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

    // Validate and normalize input data
    if (!campaignData.account) {
      throw new Error('Account is required')
    }

    if (!campaignData.campaignGroup) {
      throw new Error('Campaign group is required')
    }

    if (!campaignData.startDate) {
      throw new Error('Start date is required')
    }

    if (!campaignData.budgetAmount || parseFloat(campaignData.budgetAmount) <= 0) {
      throw new Error('Budget amount is required and must be greater than 0')
    }

    // Handle both string URNs and number IDs
    const accountUrn = typeof campaignData.account === 'string' 
      ? campaignData.account 
      : `urn:li:sponsoredAccount:${campaignData.account}`
      
    const campaignGroupUrn = typeof campaignData.campaignGroup === 'string'
      ? campaignData.campaignGroup 
      : `urn:li:sponsoredCampaignGroup:${campaignData.campaignGroup}`

    // Extract ad account ID (works for both URN strings and numbers)
    const adAccountId = typeof campaignData.account === 'string'
      ? campaignData.account.replace('urn:li:sponsoredAccount:', '')
      : String(campaignData.account)
    
    // Determine creative selection based on campaign type
    // SPONSORED_INMAILS (Message and Conversation Ads) cannot use OPTIMIZED
    const creativeSelection = campaignData.type === 'SPONSORED_INMAILS' ? 'ROUND_ROBIN' : 'OPTIMIZED'
    
    // Prepare budget object based on budget type
    const budgetConfig = campaignData.budgetType === 'daily' 
      ? {
          dailyBudget: {
            amount: campaignData.budgetAmount,
            currencyCode: campaignData.currencyCode
          }
        }
      : {
          totalBudget: {
            amount: campaignData.budgetAmount,
            currencyCode: campaignData.currencyCode
          }
        }
    
    // Prepare the campaign payload for LinkedIn API
    const campaignPayload = {
      account: accountUrn,
      campaignGroup: campaignGroupUrn,
      costType: campaignData.costType,
      name: campaignData.name,
      type: campaignData.type,
      locale: campaignData.locale,
      ...budgetConfig, // Spread the budget configuration
      targetingCriteria: campaignData.targetingCriteria,
      status: 'DRAFT', // Create as draft
      // Add required runSchedule with user-selected dates
      runSchedule: {
        start: new Date(campaignData.startDate).getTime(),
        ...(campaignData.endDate && { end: new Date(campaignData.endDate).getTime() })
      },
      // Add default required fields
      creativeSelection: creativeSelection,
      audienceExpansionEnabled: false,
      offsiteDeliveryEnabled: false,
      unitCost: {
        amount: '0',
        currencyCode: campaignData.currencyCode
      },

      // Add format field for campaign types that require it
      ...(campaignData.type === 'DYNAMIC' && { format: 'SPOTLIGHT' }), // Default format for Dynamic campaigns
      ...(campaignData.type === 'SPONSORED_UPDATES' && { format: 'STANDARD_UPDATE' }) // Default format for Sponsored Content
    }
    
    console.log('Creating LinkedIn campaign with payload:', JSON.stringify(campaignPayload, null, 2))
    
    // Make authenticated request to LinkedIn API to create campaign
    const response = await fetch(`https://api.linkedin.com/rest/adAccounts/${adAccountId}/adCampaigns`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'LinkedIn-Version': '202501',
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(campaignPayload)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('LinkedIn Campaign Creation API request failed:', response.status, errorText)
      
      // Try to parse error for more specific message
      try {
        const errorData = JSON.parse(errorText)
        throw new Error(`LinkedIn API Error: ${errorData.message || errorText}`)
      } catch {
        throw new Error(`LinkedIn API request failed: ${response.status} - ${errorText}`)
      }
    }
    
    // Get the created campaign ID from response headers
    const campaignUrn = response.headers.get('x-linkedin-id')
    const campaignId = campaignUrn ? campaignUrn.replace('urn:li:sponsoredCampaign:', '') : 'unknown'
    
    console.log('LinkedIn campaign created successfully with ID:', campaignId)
    
    return {
      success: true,
      data: {
        id: campaignId,
        name: campaignData.name
      }
    }
  } catch (error) {
    console.error('Error creating LinkedIn campaign:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}