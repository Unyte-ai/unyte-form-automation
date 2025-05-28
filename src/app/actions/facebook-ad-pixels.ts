'use server'

import { createClient } from '@/lib/supabase/server'

export interface FacebookAdPixel {
  id: string
  name: string
  creation_time: string
  last_fired_time?: string
  code?: string
}

export interface GetPixelsResult {
  success: boolean
  data?: FacebookAdPixel[]
  error?: string
}

/**
 * Fetches Facebook ad pixels for the specified ad account and organization
 * @param organizationId - The organization ID in our system
 * @param adAccountId - The Facebook ad account ID (with act_ prefix)
 */
export async function getFacebookAdPixels(
  organizationId: string,
  adAccountId: string
): Promise<GetPixelsResult> {
  try {
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

    console.log('Fetching Facebook ad pixels for account:', adAccountId)

    // Make the API call to get pixels for the ad account
    const response = await fetch(
      `https://graph.facebook.com/v22.0/${adAccountId}/adspixels?fields=id,name,creation_time,last_fired_time&access_token=${connection.access_token}`,
      {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Facebook Pixels API request failed:', response.status, errorText)
      
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
    
    // Facebook returns data in a 'data' array
    const pixels: FacebookAdPixel[] = responseData.data || []
    
    console.log(`Successfully fetched ${pixels.length} Facebook ad pixels`)

    return {
      success: true,
      data: pixels
    }

  } catch (error) {
    console.error('Error fetching Facebook ad pixels:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}