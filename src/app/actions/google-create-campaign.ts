'use server'

import { createClient } from '@/lib/supabase/server'
import { GoogleAdsApi, resources, enums, toMicros, ResourceNames, MutateOperation } from 'google-ads-api'

export interface CreateGoogleCampaignData {
  campaignName: string
  campaignType: 'SEARCH' | 'DISPLAY'
  totalBudget: number
  startDate: string // YYYY-MM-DD format
  endDate: string   // YYYY-MM-DD format
  customerId: string
  managerCustomerId?: string
}

export interface CreatedGoogleCampaign {
  campaignId: string
  budgetId: string
  campaignResourceName: string
  budgetResourceName: string
}

/**
 * Creates a shell Google Ads campaign that's paused and ready for customization
 * @param organizationId - The organization ID
 * @param campaignData - Campaign creation data
 */
export async function createGoogleCampaign(
  organizationId: string,
  campaignData: CreateGoogleCampaignData
): Promise<{ 
  success: boolean
  data?: CreatedGoogleCampaign
  error?: string
}> {
  try {
    // Get the current user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Get the Google connection for this user and organization
    const { data: connection, error: connectionError } = await supabase
      .from('google_connections')
      .select('refresh_token')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()
    
    if (connectionError || !connection) {
      throw new Error('Google connection not found for this organization')
    }

    if (!connection.refresh_token) {
      throw new Error('No refresh token available. Please reconnect your Google account.')
    }

    // Get Google credentials from environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
    
    if (!clientId || !clientSecret || !developerToken) {
      throw new Error('Google Ads API credentials are not properly configured')
    }

    // Initialize Google Ads API client
    const client = new GoogleAdsApi({
      client_id: clientId,
      client_secret: clientSecret,
      developer_token: developerToken,
    })

    // Create customer instance
    const customer = client.Customer({
      customer_id: campaignData.customerId,
      refresh_token: connection.refresh_token,
      // If this is a sub-account, set the manager account as login customer
      ...(campaignData.managerCustomerId && {
        login_customer_id: campaignData.managerCustomerId
      })
    })

    // Generate temporary resource IDs for atomic creation
    const budgetResourceName = ResourceNames.campaignBudget(
      campaignData.customerId,
      "-1" // Temporary ID for atomic creation
    )

    // Map campaign type to advertising channel type
    const getAdvertisingChannelType = (type: string) => {
      switch (type) {
        case 'SEARCH': return enums.AdvertisingChannelType.SEARCH
        case 'DISPLAY': return enums.AdvertisingChannelType.DISPLAY
        default: return enums.AdvertisingChannelType.SEARCH
      }
    }

    // Create operations for atomic budget and campaign creation
    const operations: MutateOperation<
      resources.ICampaignBudget | resources.ICampaign
    >[] = [
      {
        entity: "campaign_budget",
        operation: "create",
        resource: {
          resource_name: budgetResourceName,
          name: `${campaignData.campaignName} Budget`,
          delivery_method: enums.BudgetDeliveryMethod.STANDARD,
          amount_micros: toMicros(campaignData.totalBudget), // Total budget instead of daily
        },
      },
      {
        entity: "campaign",
        operation: "create",
        resource: {
          name: campaignData.campaignName,
          advertising_channel_type: getAdvertisingChannelType(campaignData.campaignType),
          status: enums.CampaignStatus.PAUSED, // Keep paused for safety
          campaign_budget: budgetResourceName, // Reference the budget created above
          start_date: campaignData.startDate,
          end_date: campaignData.endDate,
          manual_cpc: {
            enhanced_cpc_enabled: false, // Basic bidding strategy
          },
          // Add network settings for search campaigns
          ...(campaignData.campaignType === 'SEARCH' && {
            network_settings: {
              target_google_search: true,
              target_search_network: true,
            },
          }),
        },
      },
    ]

    // Execute the atomic operation
    const result = await customer.mutateResources(operations)

    if (!result.mutate_operation_responses || result.mutate_operation_responses.length < 2) {
      throw new Error('Failed to create campaign and budget')
    }

    // Extract created resource names
    const budgetResult = result.mutate_operation_responses[0].campaign_budget_result
    const campaignResult = result.mutate_operation_responses[1].campaign_result

    if (!budgetResult?.resource_name || !campaignResult?.resource_name) {
      throw new Error('Failed to get created resource names')
    }

    // Extract IDs from resource names
    const budgetId = budgetResult.resource_name.split('/').pop() || ''
    const campaignId = campaignResult.resource_name.split('/').pop() || ''

    return {
      success: true,
      data: {
        campaignId,
        budgetId,
        campaignResourceName: campaignResult.resource_name,
        budgetResourceName: budgetResult.resource_name,
      }
    }
  } catch (error) {
    console.error('Error creating Google campaign:', error)
    
    // Handle specific Google Ads API errors
    let errorMessage = 'An unexpected error occurred'
    
    if (error instanceof Error) {
      if (error.message.includes('invalid_grant')) {
        errorMessage = 'Google access token has expired or been revoked. Please reconnect your Google account.'
      } else if (error.message.includes('PERMISSION_DENIED')) {
        errorMessage = 'Permission denied. Please ensure your Google account has access to Google Ads and can create campaigns.'
      } else if (error.message.includes('QUOTA_ERROR')) {
        errorMessage = 'Google Ads API quota exceeded. Please try again later.'
      } else {
        errorMessage = error.message
      }
    }
    
    return { 
      success: false, 
      error: errorMessage
    }
  }
}