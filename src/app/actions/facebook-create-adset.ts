'use server'

import { createClient } from '@/lib/supabase/server'

export interface CreateFacebookAdSetData {
  campaignId: string
  name: string
  dailyBudget: number // in cents (e.g., 1000 = $10.00)
  targeting: {
    countries: string[] // ['US', 'CA']
    ageMin: number // 18
    ageMax: number // 65
    placements: ('facebook' | 'instagram' | 'messenger')[]
  }
  startTime?: string // ISO date
  endTime?: string // ISO date
}

/**
 * Creates a Facebook ad set
 * @param organizationId - The ID of the organization in our system
 * @param adAccountId - The Facebook ad account ID (with or without 'act_' prefix)
 * @param adSetData - The ad set data to create
 */
export async function createFacebookAdSet(
  organizationId: string,
  adAccountId: string,
  adSetData: CreateFacebookAdSetData
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

    // Validate required fields
    if (!adSetData.campaignId) {
      throw new Error('Campaign ID is required')
    }

    if (!adSetData.name.trim()) {
      throw new Error('Ad set name is required')
    }

    if (adSetData.dailyBudget <= 0) {
      throw new Error('Daily budget must be greater than 0')
    }

    if (!adSetData.targeting.countries.length) {
      throw new Error('At least one target country is required')
    }

    if (!adSetData.targeting.placements.length) {
      throw new Error('At least one placement is required')
    }

    // Build targeting object for Facebook API
    const targeting = {
      geo_locations: {
        countries: adSetData.targeting.countries
      },
      age_min: adSetData.targeting.ageMin,
      age_max: adSetData.targeting.ageMax,
      publisher_platforms: adSetData.targeting.placements.map(placement => {
        switch (placement) {
          case 'facebook':
            return 'facebook'
          case 'instagram':
            return 'instagram'
          case 'messenger':
            return 'messenger'
          default:
            return 'facebook'
        }
      })
    }

    // Define the payload interface for Facebook API
    interface FacebookAdSetPayload {
      name: string
      campaign_id: string
      daily_budget: string
      targeting: typeof targeting
      status: string
      start_time?: string
      end_time?: string
    }

    // Prepare the ad set payload for Facebook API
    // ONLY ad set-level settings - campaign settings are inherited automatically
    const adSetPayload: FacebookAdSetPayload = {
      name: adSetData.name.trim(),
      campaign_id: adSetData.campaignId,
      daily_budget: adSetData.dailyBudget.toString(),
      targeting: targeting,
      status: 'PAUSED' // Create as paused for safety
    }

    // Add start and end times if provided
    if (adSetData.startTime) {
      adSetPayload.start_time = new Date(adSetData.startTime).toISOString()
    }

    if (adSetData.endTime) {
      adSetPayload.end_time = new Date(adSetData.endTime).toISOString()
    }

    console.log('Creating Facebook ad set with payload:', JSON.stringify(adSetPayload, null, 2))
    
    // Ensure the ad account ID has the 'act_' prefix
    let formattedAdAccountId = adAccountId
    if (!formattedAdAccountId.startsWith('act_')) {
      formattedAdAccountId = `act_${formattedAdAccountId}`
    }

    console.log('Using ad account ID:', formattedAdAccountId, 'for campaign:', adSetData.campaignId)

    // Make authenticated request to Facebook API to create ad set
    const response = await fetch(`https://graph.facebook.com/v22.0/${formattedAdAccountId}/adsets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(adSetPayload)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Facebook Ad Set Creation API request failed:', response.status, errorText)
      
      // Try to parse error for more specific message
      try {
        const errorData = JSON.parse(errorText)
        const errorMessage = errorData.error?.message || errorText
        throw new Error(`Facebook API Error: ${errorMessage}`)
      } catch {
        throw new Error(`Facebook API request failed: ${response.status} - ${errorText}`)
      }
    }
    
    const responseData = await response.json()
    
    console.log('Facebook ad set created successfully:', responseData)
    
    return {
      success: true,
      data: {
        id: responseData.id,
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