'use server'

import { createClient } from '@/lib/supabase/server'
import { GoogleAdsApi, resources, enums, toMicros, ResourceNames, MutateOperation } from 'google-ads-api'

export interface CreateGoogleCampaignData {
  campaignName: string
  campaignType: 'SEARCH' | 'DISPLAY'
  budgetType: 'daily' | 'total'  // New field
  budgetAmount: number           // Renamed from totalBudget
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
 * Calculate daily budget based on budget type
 * @param budgetType - 'daily' or 'total'
 * @param budgetAmount - The budget amount
 * @param startDate - Campaign start date
 * @param endDate - Campaign end date
 * @returns Daily budget amount
 */
function calculateDailyBudget(
  budgetType: 'daily' | 'total',
  budgetAmount: number,
  startDate: string,
  endDate: string
): number {
  if (budgetType === 'daily') {
    return budgetAmount
  }
  
  // For total budget, calculate daily budget by dividing total by number of days
  const start = new Date(startDate)
  const end = new Date(endDate)
  const timeDiff = end.getTime() - start.getTime()
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) // Number of days
  
  if (daysDiff <= 0) {
    throw new Error('End date must be after start date')
  }
  
  return Math.round((budgetAmount / daysDiff) * 100) / 100 // Round to 2 decimal places
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

    // Calculate the appropriate daily budget based on budget type
    const dailyBudget = calculateDailyBudget(
      campaignData.budgetType,
      campaignData.budgetAmount,
      campaignData.startDate,
      campaignData.endDate
    )

    // Validate minimum daily budget (Google Ads minimum is typically $1.00)
    if (dailyBudget < 1.0) {
      throw new Error(`Daily budget too low: $${dailyBudget.toFixed(2)}. ${
        campaignData.budgetType === 'total' 
          ? 'Try increasing your total budget or reducing the campaign duration.'
          : 'Minimum daily budget is $1.00.'
      }`)
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

    // Create budget name with type indicator for clarity
    const budgetName = `${campaignData.campaignName} Budget (${
      campaignData.budgetType === 'daily' ? 'Daily' : 'Total'
    })`

    // Create operations for atomic budget and campaign creation
    const operations: MutateOperation<
      resources.ICampaignBudget | resources.ICampaign
    >[] = [
      {
        entity: "campaign_budget",
        operation: "create",
        resource: {
          resource_name: budgetResourceName,
          name: budgetName,
          delivery_method: enums.BudgetDeliveryMethod.STANDARD,
          amount_micros: toMicros(dailyBudget), // Always use daily budget for Google Ads API
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

    // Log budget information for debugging
    console.log(`Campaign created with ${campaignData.budgetType} budget:`, {
      budgetType: campaignData.budgetType,
      originalAmount: campaignData.budgetAmount,
      dailyBudget: dailyBudget,
      campaignDuration: `${campaignData.startDate} to ${campaignData.endDate}`
    })

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
      } else if (error.message.includes('Daily budget too low')) {
        errorMessage = error.message // Use our custom budget validation message
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