'use server'

import { createClient } from '@/lib/supabase/server'

export interface FacebookAdAccount {
  id: string
  name: string
  account_status?: number
  currency?: string
  account_id?: string
}

interface FacebookApiAccount {
  id: string
  name?: string
  account_status?: number
  currency?: string
  account_id?: string
}

/**
 * Fetches Facebook ad accounts for the current user and specified organization
 * @param organizationId - The ID of the organization in our system
 */
export async function getFacebookAdAccounts(organizationId: string): Promise<{ 
  success: boolean
  data?: FacebookAdAccount[]
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
    
    // Make authenticated request to Facebook Graph API to get ad accounts
    const response = await fetch(
      `https://graph.facebook.com/v22.0/me/adaccounts?fields=id,name,account_status,currency,account_id`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Facebook API request failed:', response.status, errorText)
      throw new Error(`Facebook API request failed: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Transform Facebook API response to our interface
    const adAccounts = data.data?.map((account: FacebookApiAccount): FacebookAdAccount => ({
      id: account.id,
      name: account.name || `Account ${account.account_id || account.id}`,
      account_status: account.account_status,
      currency: account.currency,
      account_id: account.account_id
    })) || []
    
    return {
      success: true,
      data: adAccounts
    }
  } catch (error) {
    console.error('Error fetching Facebook ad accounts:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}