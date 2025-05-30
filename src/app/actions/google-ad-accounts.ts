'use server'

import { createClient } from '@/lib/supabase/server'
import { GoogleAdsApi } from 'google-ads-api'

export interface GoogleAdAccount {
  id: string
  name: string
  resourceName: string
  isManager?: boolean
  testAccount?: boolean
  currency?: string
  timeZone?: string
}

/**
 * Fetches Google ad accounts for the current user and specified organization
 * @param organizationId - The ID of the organization in our system
 */
export async function getGoogleAdAccounts(organizationId: string): Promise<{ 
  success: boolean
  data?: GoogleAdAccount[]
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

    // Get accessible customers using refresh token
    const accessibleCustomers = await client.listAccessibleCustomers(connection.refresh_token)
    
    if (!accessibleCustomers.resource_names || accessibleCustomers.resource_names.length === 0) {
      return {
        success: true,
        data: []
      }
    }

    // Extract customer IDs from resource names and get detailed info for each
    const accounts: GoogleAdAccount[] = []
    
    for (const resourceName of accessibleCustomers.resource_names) {
      try {
        // Extract customer ID from resource name (e.g., "customers/1234567890" -> "1234567890")
        const customerId = resourceName.split('/').pop()
        
        if (!customerId) continue

        // Create customer instance to query details
        const customer = client.Customer({
          customer_id: customerId,
          refresh_token: connection.refresh_token,
        })

        // Query customer details
        const customerDetails = await customer.query(`
          SELECT 
            customer.id,
            customer.resource_name,
            customer.descriptive_name,
            customer.manager,
            customer.test_account,
            customer.currency_code,
            customer.time_zone
          FROM customer
          LIMIT 1
        `)

        if (customerDetails && customerDetails.length > 0) {
          const customerData = customerDetails[0].customer
          
          // Add null checks and convert null to undefined for our interface
          if (customerData) {
            accounts.push({
              id: customerId,
              resourceName: resourceName,
              name: customerData.descriptive_name || `Account ${customerId}`,
              isManager: customerData.manager || false,
              testAccount: customerData.test_account || false,
              currency: customerData.currency_code || undefined,
              timeZone: customerData.time_zone || undefined
            })
          } else {
            // Fallback if customerData is null/undefined
            accounts.push({
              id: customerId,
              resourceName: resourceName,
              name: `Account ${customerId}`,
            })
          }
        } else {
          // Fallback if query fails - just use basic info
          accounts.push({
            id: customerId,
            resourceName: resourceName,
            name: `Account ${customerId}`,
          })
        }
      } catch (accountError) {
        console.warn(`Failed to get details for account ${resourceName}:`, accountError)
        
        // Still add the account with basic info
        const customerId = resourceName.split('/').pop()
        if (customerId) {
          accounts.push({
            id: customerId,
            resourceName: resourceName,
            name: `Account ${customerId}`,
          })
        }
      }
    }
    
    return {
      success: true,
      data: accounts
    }
  } catch (error) {
    console.error('Error fetching Google ad accounts:', error)
    
    // Handle specific Google Ads API errors
    let errorMessage = 'An unexpected error occurred'
    
    if (error instanceof Error) {
      if (error.message.includes('invalid_grant')) {
        errorMessage = 'Google access token has expired or been revoked. Please reconnect your Google account.'
      } else if (error.message.includes('PERMISSION_DENIED')) {
        errorMessage = 'Permission denied. Please ensure your Google account has access to Google Ads.'
      } else if (error.message.includes('DEVELOPER_TOKEN_NOT_APPROVED')) {
        errorMessage = 'Developer token not approved. Please check your Google Ads API access.'
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