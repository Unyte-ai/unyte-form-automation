'use server'

import { createClient } from '@/lib/supabase/server'
import { 
  FacebookBatchCampaignAdSetData,
  getBillingEventForUIObjective,
  validateCampaignData,
  validateAdSetData
} from '@/lib/facebook-campaign-utils'
import { buildCampaignBatchRequest, buildAdSetBatchRequest } from '@/lib/facebook-batch-utils'

export interface BatchCampaignAdSetResult {
  success: boolean
  data?: {
    campaignId: string
    campaignName: string
    adSetId: string
    adSetName: string
  }
  error?: string
}

interface FacebookBatchResponse {
  code: number
  headers?: Array<{ name: string; value: string }>
  body: string
}

/**
 * Creates both a Facebook campaign and ad set in a single batch request
 * @param organizationId - The organization ID in our system
 * @param adAccountId - The Facebook ad account ID (with act_ prefix)
 * @param batchData - Combined campaign and ad set data
 */
export async function createFacebookCampaignAndAdSet(
  organizationId: string,
  adAccountId: string,
  batchData: FacebookBatchCampaignAdSetData
): Promise<BatchCampaignAdSetResult> {
  try {
    const { campaign: campaignData, adset: adSetDataWithoutCampaignId } = batchData

    // Validate input parameters
    if (!organizationId || !adAccountId) {
      throw new Error('Organization ID and Ad Account ID are required')
    }

    // Validate campaign data
    const campaignErrors = validateCampaignData(campaignData)
    if (campaignErrors.length > 0) {
      throw new Error(`Campaign validation failed: ${campaignErrors.join(', ')}`)
    }

    // Create complete ad set data with billing event derived from campaign objective
    const adSetData = {
      ...adSetDataWithoutCampaignId,
      campaign_id: 'temp', // Will be replaced in batch request
      billing_event: getBillingEventForUIObjective(campaignData.objective)
    }

    // Validate ad set data
    const adSetErrors = validateAdSetData(adSetData)
    if (adSetErrors.length > 0) {
      throw new Error(`Ad Set validation failed: ${adSetErrors.join(', ')}`)
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

    // Build batch requests - buildCampaignBatchRequest does its own conversion internally
    const campaignRequest = buildCampaignBatchRequest(adAccountId, campaignData)
    const adSetRequest = buildAdSetBatchRequest(adAccountId, adSetData)

    // Create the batch request array
    const batchRequests = [campaignRequest, adSetRequest]

    // ADD THIS DEBUGGING CODE:
    console.log('=== BATCH REQUEST DEBUGGING ===')
    console.log('Campaign request:', JSON.stringify(campaignRequest, null, 2))
    console.log('AdSet request:', JSON.stringify(adSetRequest, null, 2))
    console.log('AdSet data billing_event:', adSetData.billing_event)
    console.log('=== END DEBUGGING ===')

    console.log('Creating Facebook campaign and ad set batch request:', {
      adAccountId,
      campaignName: campaignData.name,
      adSetName: adSetData.name,
      objective: campaignData.objective,
      billingEvent: adSetData.billing_event,
      batchSize: batchRequests.length
    })

    // Make the batch API call
    const formData = new FormData()
    formData.append('access_token', connection.access_token)
    formData.append('batch', JSON.stringify(batchRequests))
    formData.append('include_headers', 'false') // Exclude headers for efficiency

    const response = await fetch('https://graph.facebook.com/v22.0', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Facebook Batch API request failed:', response.status, errorText)
      throw new Error(`Facebook Batch API request failed: ${response.status} ${errorText}`)
    }

    const batchResults: FacebookBatchResponse[] = await response.json()

    // ADD THIS DEBUGGING CODE:
    console.log('Raw Facebook batch response:', JSON.stringify(batchResults, null, 2))
    console.log('Campaign result structure:', batchResults[0])
    console.log('AdSet result structure:', batchResults[1])

    // ADD MORE DETAILED LOGGING:
    console.log('Raw batch response length:', batchResults.length)
    console.log('Campaign result (index 0):', batchResults[0])
    console.log('Campaign result type:', typeof batchResults[0])
    console.log('Campaign result === null:', batchResults[0] === null)
    console.log('Campaign result === undefined:', batchResults[0] === undefined)
    console.log('AdSet result (index 1):', batchResults[1])
    
    console.log('Facebook batch request completed:', {
      resultsCount: batchResults.length,
      campaignResult: batchResults[0]?.code,
      adSetResult: batchResults[1]?.code
    })

    // Validate batch response structure
    if (!Array.isArray(batchResults) || batchResults.length !== 2) {
      throw new Error('Invalid batch response: expected array with 2 results')
    }

    const [campaignResult, adSetResult] = batchResults

    // Check campaign creation result
    if (!campaignResult || campaignResult.code !== 200) {
      let errorMessage = !campaignResult 
        ? 'Campaign creation failed: No response received'
        : `Campaign creation failed with status ${campaignResult.code}`
      
      if (campaignResult?.body) {
        try {
          const errorData = JSON.parse(campaignResult.body)
          if (errorData.error?.message) {
            errorMessage = `Campaign creation failed: ${errorData.error.message}`
          }
        } catch (parseError) { // eslint-disable-line @typescript-eslint/no-unused-vars
          // Use default error message if parsing fails
        }
      }
      throw new Error(errorMessage)
    }

    // Check ad set creation result
    if (!adSetResult || adSetResult.code !== 200) {
      let errorMessage = !adSetResult
        ? 'Ad Set creation failed: No response received'
        : `Ad Set creation failed with status ${adSetResult.code}`
      
      if (adSetResult?.body) {
        try {
          const errorData = JSON.parse(adSetResult.body)
          if (errorData.error?.message) {
            errorMessage = `Ad Set creation failed: ${errorData.error.message}`
          }
        } catch (parseError) { // eslint-disable-line @typescript-eslint/no-unused-vars
          // Use default error message if parsing fails
        }
      }
      throw new Error(errorMessage)
    }

    // Parse successful results
    let campaignId: string
    let adSetId: string

    try {
      const campaignResponseData = JSON.parse(campaignResult.body)
      campaignId = campaignResponseData.id

      if (!campaignId) {
        throw new Error('Campaign created but no ID returned')
      }
    } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      throw new Error('Failed to parse campaign creation response')
    }

    try {
      const adSetResponseData = JSON.parse(adSetResult.body)
      adSetId = adSetResponseData.id

      if (!adSetId) {
        throw new Error('Ad Set created but no ID returned')
      }
    } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      throw new Error('Failed to parse ad set creation response')
    }

    console.log('Facebook campaign and ad set created successfully:', {
      campaignId,
      adSetId,
      campaignName: campaignData.name,
      adSetName: adSetData.name
    })

    return {
      success: true,
      data: {
        campaignId,
        campaignName: campaignData.name,
        adSetId,
        adSetName: adSetData.name
      }
    }

  } catch (error) {
    console.error('Error creating Facebook campaign and ad set:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}