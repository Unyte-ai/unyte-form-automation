'use server'

import { createClient } from '@/lib/supabase/server'
import { 
  FacebookBatchCampaignAdSetData,
  getBillingEventForUIObjective,
  getOptimizationGoalForUIObjective,
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

    // Create complete ad set data with billing event and optimization goal derived from campaign objective
    const adSetData = {
      ...adSetDataWithoutCampaignId,
      campaign_id: 'temp', // Will be replaced in batch request
      billing_event: getBillingEventForUIObjective(campaignData.objective)
    }

    // Add optimization goal only if one is specified for this objective
    const optimizationGoal = getOptimizationGoalForUIObjective(campaignData.objective)
    if (optimizationGoal) {
      adSetData.optimization_goal = optimizationGoal
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

    console.log('Creating Facebook campaign and ad set batch request:', {
      adAccountId,
      campaignName: campaignData.name,
      adSetName: adSetData.name,
      objective: campaignData.objective,
      billingEvent: adSetData.billing_event,
      optimizationGoal: adSetData.optimization_goal || 'default',
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

    console.log('Facebook batch request completed:', {
      resultsCount: batchResults.length,
      campaignResult: batchResults[0]?.code || 'null',
      adSetResult: batchResults[1]?.code
    })

    // Validate batch response structure
    if (!Array.isArray(batchResults) || batchResults.length !== 2) {
      throw new Error('Invalid batch response: expected array with 2 results')
    }

    const [campaignResult, adSetResult] = batchResults

    // Check ad set creation result first
    if (!adSetResult || adSetResult.code !== 200) {
      let errorMessage = !adSetResult
        ? 'Ad Set creation failed: No response received'
        : `Ad Set creation failed with status ${adSetResult.code}`
      
      // Enhanced error logging - log the full response for debugging
      console.error('Ad Set creation failed - Full response:', {
        code: adSetResult?.code,
        body: adSetResult?.body,
        headers: adSetResult?.headers
      })
      
      if (adSetResult?.body) {
        try {
          const errorData = JSON.parse(adSetResult.body)
          console.error('Parsed Facebook API error:', errorData)
          
          if (errorData.error) {
            errorMessage = `Ad Set creation failed: ${errorData.error.message}`
            
            // Log specific error details if available
            if (errorData.error.error_user_title) {
              console.error('Error user title:', errorData.error.error_user_title)
            }
            if (errorData.error.error_user_msg) {
              console.error('Error user message:', errorData.error.error_user_msg)
            }
            if (errorData.error.error_subcode) {
              console.error('Error subcode:', errorData.error.error_subcode)
            }
            if (errorData.error.fbtrace_id) {
              console.error('Facebook trace ID:', errorData.error.fbtrace_id)
            }
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          console.error('Raw error body:', adSetResult.body)
        }
      }
      throw new Error(errorMessage)
    }

    // Parse ad set result (we know it's successful at this point)
    let adSetId: string
    try {
      const adSetResponseData = JSON.parse(adSetResult.body)
      adSetId = adSetResponseData.id

      if (!adSetId) {
        throw new Error('Ad Set created but no ID returned')
      }
    } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      throw new Error('Failed to parse ad set creation response')
    }

    // Handle campaign result - Facebook sometimes returns null for successful requests
    let campaignId: string

    if (!campaignResult || campaignResult.code !== 200) {
      // Check if campaign result is null but ad set creation succeeded
      // This indicates campaign was created (batch reference was resolved) but Facebook returned null
      if (campaignResult === null && adSetResult.code === 200) {
        console.log('Campaign result is null but ad set creation succeeded - fetching campaign ID from ad set details')
        
        // Make a follow-up API call to get ad set details including campaign_id
        try {
          const adSetDetailsResponse = await fetch(
            `https://graph.facebook.com/v22.0/${adSetId}?fields=campaign_id&access_token=${connection.access_token}`,
            {
              method: 'GET',
              headers: {
                'Cache-Control': 'no-cache'
              }
            }
          )

          if (!adSetDetailsResponse.ok) {
            throw new Error(`Failed to fetch ad set details: ${adSetDetailsResponse.status}`)
          }

          const adSetDetails = await adSetDetailsResponse.json()
          campaignId = adSetDetails.campaign_id

          if (!campaignId) {
            throw new Error('Could not retrieve campaign ID from ad set details')
          }

          console.log('Successfully retrieved campaign ID from ad set details:', campaignId)
        } catch (fetchError) {
          console.error('Error fetching campaign ID from ad set details:', fetchError)
          throw new Error('Campaign creation succeeded but could not retrieve campaign ID')
        }
      } else {
        // Genuine campaign creation failure
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
    } else {
      // Normal successful campaign result
      try {
        const campaignResponseData = JSON.parse(campaignResult.body)
        campaignId = campaignResponseData.id

        if (!campaignId) {
          throw new Error('Campaign created but no ID returned')
        }
      } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
        throw new Error('Failed to parse campaign creation response')
      }
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