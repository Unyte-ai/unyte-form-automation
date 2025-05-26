'use server'

import { createClient } from '@/lib/supabase/server'

export interface CreateFacebookAdSetData {
  campaignId: string
  name: string
  dailyBudget: number // in cents (e.g., 1000 = $10.00)
  targeting: {
    countries: string[]
    ageMin: number
    ageMax: number
    placements: ('facebook' | 'instagram' | 'messenger')[]
  }
  startTime?: string
  endTime?: string
}

export async function createFacebookAdSet(
  organizationId: string,
  adAccountId: string,
  adSetData: CreateFacebookAdSetData
): Promise<{ success: boolean; data?: { id: string; name: string }; error?: string }> {
  try {
    // --- Supabase / Auth setup ---
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('User not authenticated')

    const { data: connection, error: connectionError } = await supabase
      .from('facebook_connections')
      .select('access_token, token_expires_at')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()
    if (connectionError || !connection) throw new Error('Facebook connection not found')

    // --- Token expiry check ---
    if (new Date(connection.token_expires_at) <= new Date()) {
      throw new Error('Facebook access token has expired. Please reconnect your Facebook account.')
    }

    // --- Input validation ---
    if (!adSetData.campaignId) throw new Error('Campaign ID is required')
    if (!adSetData.name.trim()) throw new Error('Ad set name is required')
    if (adSetData.dailyBudget <= 0) throw new Error('Daily budget must be greater than 0')
    if (!adSetData.targeting.countries.length)
      throw new Error('At least one target country is required')
    if (!adSetData.targeting.placements.length)
      throw new Error('At least one placement is required')

    // --- Build targeting object ---
    const targeting = {
      geo_locations: { countries: adSetData.targeting.countries },
      age_min: adSetData.targeting.ageMin,
      age_max: adSetData.targeting.ageMax,
      publisher_platforms: adSetData.targeting.placements.map((p) => p),
    }

    // --- 1) Fetch campaign objective ---
    const campaignResp = await fetch(
      `https://graph.facebook.com/v22.0/${adSetData.campaignId}?fields=objective`,
      {
        headers: {
          Authorization: `Bearer ${connection.access_token}`,
          'Cache-Control': 'no-cache',
        },
      }
    )
    if (!campaignResp.ok) {
      const err = await campaignResp.text()
      throw new Error(`Failed to fetch campaign objective: ${err}`)
    }
    const { objective } = (await campaignResp.json()) as { objective: string }

    // --- 2) Map & validate objective → billing_event ---
    const objectiveToBillingEvent: Record<string, string> = {
      BRAND_AWARENESS: 'IMPRESSIONS',
      REACH: 'IMPRESSIONS',
      TRAFFIC: 'LINK_CLICKS',
      ENGAGEMENT: 'POST_ENGAGEMENT',
      APP_PROMOTION: 'IMPRESSIONS',
      VIDEO_VIEWS: 'VIDEO_VIEWS',
      LEAD_GENERATION: 'LEAD_GENERATION',
      MESSAGES: 'MESSAGES',
      CONVERSIONS: 'OFFSITE_CONVERSIONS',
      CATALOG_SALES: 'IMPRESSIONS',
      STORE_TRAFFIC: 'IMPRESSIONS',
    }
    if (!(objective in objectiveToBillingEvent)) {
      const allowed = Object.keys(objectiveToBillingEvent).join(', ')
      throw new Error(
        `Unsupported campaign objective "${objective}". Please use one of: ${allowed}`
      )
    }
    const billingEvent = objectiveToBillingEvent[objective]

    // --- 3) Build the Ad Set payload ---
    interface FacebookAdSetPayload {
      name: string
      campaign_id: string
      daily_budget: string
      billing_event: string
      targeting: typeof targeting
      status: string
      start_time?: string
      end_time?: string
    }
    const adSetPayload: FacebookAdSetPayload = {
      name: adSetData.name.trim(),
      campaign_id: adSetData.campaignId,
      daily_budget: adSetData.dailyBudget.toString(),
      billing_event: billingEvent,
      targeting,
      status: 'PAUSED',
    }
    if (adSetData.startTime)
      adSetPayload.start_time = new Date(adSetData.startTime).toISOString()
    if (adSetData.endTime)
      adSetPayload.end_time = new Date(adSetData.endTime).toISOString()

    console.log('Creating Facebook ad set with payload:', adSetPayload)

    // --- 4) Normalize ad account ID & call Graph API ---
    const formattedAdAccountId = adAccountId.startsWith('act_')
      ? adAccountId
      : `act_${adAccountId}`
    const response = await fetch(
      `https://graph.facebook.com/v22.0/${formattedAdAccountId}/adsets`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${connection.access_token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(adSetPayload),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Facebook Ad Set Creation API failed:', response.status, errorText)
      try {
        const errJson = JSON.parse(errorText)
        throw new Error(errJson.error?.message || errorText)
      } catch {
        throw new Error(`Facebook API request failed: ${response.status} - ${errorText}`)
      }
    }

    const responseData = await response.json()
    console.log('Facebook ad set created successfully:', responseData)

    return { success: true, data: { id: responseData.id, name: adSetData.name } }
  } catch (error) {
    console.error('Error creating Facebook ad set:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
