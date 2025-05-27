'use server'

import { createClient } from '@/lib/supabase/server'
import { 
  FacebookCampaignData, 
  validateCampaignData,
  prepareCampaignForAPI 
} from '@/lib/facebook-campaign-utils'

export interface CreateCampaignResult {
  success: boolean
  data?: {
    campaignId: string
    name: string
  }
  error?: string
}

/**
 * Creates a Facebook campaign for the specified ad account and organization
 * @param organizationId - The organization ID in our system
 * @param adAccountId - The Facebook ad account ID (with act_ prefix)
 * @param campaignData - The campaign data to create
 */
export async function createFacebookCampaign(
  organizationId: string,
  adAccountId: string,
  campaignData: FacebookCampaignData
): Promise<CreateCampaignResult> {
  try {
    // Validate input data
    const validationErrors = validateCampaignData(campaignData)
    if (validationErrors.length > 0) {
      throw new Error(`Campaign validation failed: ${validationErrors.join(', ')}`)
    }

    if (!organizationId || !adAccountId) {
      throw new Error('Organization ID and Ad Account ID are required')
    }

    // Get current user and Facebook connection
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

    // Prepare campaign data for API
    const apiData = prepareCampaignForAPI(campaignData)
    
    // Build the request body as URL-encoded string (required for Facebook API)
    const requestBody = new URLSearchParams()
    Object.entries(apiData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // Handle arrays (like special_ad_categories)
        requestBody.append(key, JSON.stringify(value))
      } else {
        requestBody.append(key, String(value))
      }
    })

    console.log('Creating Facebook campaign with data:', {
      adAccountId,
      campaignName: campaignData.name,
      objective: campaignData.objective,
      budget: campaignData.lifetime_budget
    })

    // Make the API call to create the campaign
    const response = await fetch(`https://graph.facebook.com/v22.0/${adAccountId}/campaigns`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: requestBody.toString()
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Facebook Campaign API request failed:', response.status, errorText)
      
      // Try to parse error response for better error messages
      try {
        const errorData = JSON.parse(errorText)
        const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`
        throw new Error(`Facebook API Error: ${errorMessage}`)
      } catch (parseError) { // eslint-disable-line @typescript-eslint/no-unused-vars
        throw new Error(`Facebook API request failed: ${response.status} ${errorText}`)
      }
    }

    const responseData = await response.json()
    
    if (!responseData.id) {
      throw new Error('Campaign creation succeeded but no campaign ID was returned')
    }

    console.log('Facebook campaign created successfully:', responseData.id)

    return {
      success: true,
      data: {
        campaignId: responseData.id,
        name: campaignData.name
      }
    }

  } catch (error) {
    console.error('Error creating Facebook campaign:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Builds the campaign creation request for use in batch operations
 * @param adAccountId - The Facebook ad account ID (with act_ prefix)
 * @param campaignData - The campaign data to create
 * @returns Batch request object for campaign creation
 */
export function buildCampaignBatchRequest(
  adAccountId: string,
  campaignData: FacebookCampaignData
): {
  method: string
  name: string
  relative_url: string
  body: string
} {
  // Validate the data first
  const validationErrors = validateCampaignData(campaignData)
  if (validationErrors.length > 0) {
    throw new Error(`Campaign validation failed: ${validationErrors.join(', ')}`)
  }

  // Prepare campaign data for API
  const apiData = prepareCampaignForAPI(campaignData)
  
  // Build the request body as URL-encoded string
  const requestBody = new URLSearchParams()
  Object.entries(apiData).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      requestBody.append(key, JSON.stringify(value))
    } else {
      requestBody.append(key, String(value))
    }
  })

  return {
    method: 'POST',
    name: 'create-campaign', // Used to reference this request's result in dependent requests
    relative_url: `${adAccountId}/campaigns`,
    body: requestBody.toString()
  }
}