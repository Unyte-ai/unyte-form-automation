'use server'

import { createClient } from '@/lib/supabase/server'
import { GoogleAdsApi, enums } from 'google-ads-api'

export interface GoogleSubAccount {
  id: string
  name: string
  resourceName: string
  testAccount?: boolean
  currency?: string
  timeZone?: string
  status?: string
}

/**
 * Converts Google Ads CustomerStatus enum to readable string
 */
function getCustomerStatusString(status: enums.CustomerStatus | string | null | undefined): string | undefined {
  if (!status) return undefined
  
  // Handle both enum values and string literals
  const statusStr = typeof status === 'string' ? status : status.toString()
  
  // Convert to readable string
  switch (statusStr) {
    case 'ENABLED':
    case enums.CustomerStatus.ENABLED?.toString():
      return 'ENABLED'
    case 'CANCELED':
    case enums.CustomerStatus.CANCELED?.toString():
      return 'CANCELED'
    case 'SUSPENDED':
    case enums.CustomerStatus.SUSPENDED?.toString():
      return 'SUSPENDED'
    case 'CLOSED':
    case enums.CustomerStatus.CLOSED?.toString():
      return 'CLOSED'
    case 'UNSPECIFIED':
    case 'UNKNOWN':
      return 'UNKNOWN'
    default:
      return 'UNKNOWN'
  }
}

/**
 * Fetches Google sub-accounts (managed accounts) for a specific manager account
 * @param organizationId - The ID of the organization in our system
 * @param managerAccountId - The ID of the manager account to get sub-accounts for
 */
export async function getGoogleSubAccounts(
  organizationId: string, 
  managerAccountId: string
): Promise<{ 
  success: boolean
  data?: GoogleSubAccount[]
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
      .select('access_token, refresh_token, token_expires_at')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()
    
    if (connectionError || !connection) {
      throw new Error('Google connection not found for this organization')
    }

    // Check if the token is expired
    const tokenExpiresAt = new Date(connection.token_expires_at)
    const now = new Date()
    
    if (tokenExpiresAt <= now) {
      throw new Error('Google access token has expired. Please reconnect your Google account.')
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

    // Create customer instance for the manager account
    const managerCustomer = client.Customer({
      customer_id: managerAccountId,
      refresh_token: connection.refresh_token,
    })

    // Query for managed accounts (sub-accounts) under this manager account
    const managedAccounts = await managerCustomer.query(`
      SELECT 
        customer_client.id,
        customer_client.resource_name,
        customer_client.descriptive_name,
        customer_client.test_account,
        customer_client.currency_code,
        customer_client.time_zone,
        customer_client.status
      FROM customer_client
      WHERE customer_client.manager = false
    `)

    const subAccounts: GoogleSubAccount[] = []
    
    if (managedAccounts && managedAccounts.length > 0) {
      for (const account of managedAccounts) {
        const customerClient = account.customer_client
        
        if (customerClient && customerClient.id) {
          subAccounts.push({
            id: customerClient.id.toString(),
            resourceName: customerClient.resource_name || `customers/${customerClient.id}`,
            name: customerClient.descriptive_name || `Account ${customerClient.id}`,
            testAccount: customerClient.test_account || false,
            currency: customerClient.currency_code || undefined,
            timeZone: customerClient.time_zone || undefined,
            status: getCustomerStatusString(customerClient.status)
          })
        }
      }
    }
    
    return {
      success: true,
      data: subAccounts
    }
  } catch (error) {
    console.error('Error fetching Google sub-accounts:', error)
    
    // Handle specific Google Ads API errors
    let errorMessage = 'An unexpected error occurred'
    
    if (error instanceof Error) {
      if (error.message.includes('invalid_grant')) {
        errorMessage = 'Google access token has expired or been revoked. Please reconnect your Google account.'
      } else if (error.message.includes('PERMISSION_DENIED')) {
        errorMessage = 'Permission denied. You may not have access to manage this account.'
      } else if (error.message.includes('CUSTOMER_NOT_FOUND')) {
        errorMessage = 'Manager account not found or not accessible.'
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