'use server'

import { createClient } from '@/lib/supabase/server'
import { 
  FacebookAdSetData, 
  validateAdSetData,
  prepareAdSetForAPI 
} from '@/lib/facebook-campaign-utils'

export interface CreateAdSetResult {
  success: boolean
  data?: {
    adSetId: string
    name: string
  }
  error?: string
}

/**
 * Creates a Facebook ad set for the specified campaign and organization
 * @param organizationId - The organization ID in our system
 * @param adAccountId - The Facebook ad account ID (with act_ prefix)
 * @param adSetData - The ad set data to create
 */
export async function createFacebookAdSet(
  organizationId: string,
  adAccountId: string,
  adSetData: FacebookAdSetData
): Promise<CreateAdSetResult> {
  try {
    // Validate input data
    const validationErrors = validateAdSetData(adSetData)
    if (validationErrors.length > 0) {
      throw new Error(`Ad Set validation failed: ${validationErrors.join(', ')}`)
    }

    if (!organizationId || !adAccountId) {
      throw new Error('Organization ID and Ad Account ID are required')
    }

    if (!adSetData.campaign_id) {
      throw new Error('Campaign ID is required for ad set creation')
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

    // Prepare ad set data for API
    const apiData = prepareAdSetForAPI(adSetData)
    
    // Build the request body as URL-encoded string (required for Facebook API)
    const requestBody = new URLSearchParams()
    Object.entries(apiData).forEach(([key, value]) => {
      requestBody.append(key, String(value))
    })

    console.log('Creating Facebook ad set with data:', {
      adAccountId,
      campaignId: adSetData.campaign_id,
      adSetName: adSetData.name,
      billingEvent: adSetData.billing_event,
      budget: adSetData.lifetime_budget,
      targetingCountries: adSetData.targeting.geo_locations.countries
    })

    // Make the API call to create the ad set
    const response = await fetch(`https://graph.facebook.com/v22.0/${adAccountId}/adsets`, {
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
      console.error('Facebook Ad Set API request failed:', response.status, errorText)
      
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
      throw new Error('Ad Set creation succeeded but no ad set ID was returned')
    }

    console.log('Facebook ad set created successfully:', responseData.id)

    return {
      success: true,
      data: {
        adSetId: responseData.id,
        name: adSetData.name
      }
    }

  } catch (error) {
    console.error('Error creating Facebook ad set:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}
