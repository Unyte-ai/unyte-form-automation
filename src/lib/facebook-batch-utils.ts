import {
    FacebookCampaignData,
    FacebookAdSetData,
    validateCampaignData,
    validateAdSetData,
    prepareCampaignForAPI,
    prepareAdSetForAPI
  } from './facebook-campaign-utils'
  
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
  
  /**
   * Builds the ad set creation request for use in batch operations
   * @param adAccountId - The Facebook ad account ID (with act_ prefix)
   * @param adSetData - The ad set data to create (campaign_id will be replaced with reference)
   * @returns Batch request object for ad set creation
   */
  export function buildAdSetBatchRequest(
    adAccountId: string,
    adSetData: Omit<FacebookAdSetData, 'campaign_id'>
  ): {
    method: string
    name: string
    relative_url: string
    body: string
  } {
    // Create a temporary ad set data with placeholder campaign_id for validation
    const tempAdSetData: FacebookAdSetData = {
      ...adSetData,
      campaign_id: 'temp_campaign_id' // Will be replaced with batch reference
    }
  
    // Validate the data first
    const validationErrors = validateAdSetData(tempAdSetData)
    if (validationErrors.length > 0) {
      throw new Error(`Ad Set validation failed: ${validationErrors.join(', ')}`)
    }
  
    // Prepare ad set data for API, but replace campaign_id with batch reference
    const apiData = prepareAdSetForAPI(tempAdSetData)
    
    // Build the request body as URL-encoded string
    const requestBody = new URLSearchParams()
    Object.entries(apiData).forEach(([key, value]) => {
      if (key === 'campaign_id') {
        // Use batch reference to get campaign ID from the create-campaign request
        requestBody.append(key, '{result=create-campaign:$.id}')
      } else {
        requestBody.append(key, String(value))
      }
    })
  
    return {
      method: 'POST',
      name: 'create-adset', // Used to reference this request's result
      relative_url: `${adAccountId}/adsets`,
      body: requestBody.toString()
    }
  }