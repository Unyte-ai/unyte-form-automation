'use server'

import { createClient } from '@/lib/supabase/server'

export interface LinkedInAdAccount {
  id: string
  name: string
  status?: string
  type?: string
  organizationName?: string
  currency?: string
}

interface LinkedInApiAccount {
  id: string
  name?: string
  status?: string
  type?: string
  reference?: {
    organization?: {
      name?: string
    }
  }
  currency?: string
}

/**
 * Fetches LinkedIn ad accounts for the current user and specified organization
 * @param organizationId - The ID of the organization in our system
 */
export async function getLinkedInAdAccounts(organizationId: string): Promise<{ 
  success: boolean
  data?: LinkedInAdAccount[]
  error?: string
}> {
  try {
    // Get the current user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Get the LinkedIn connection for this user and organization
    const { data: connection, error: connectionError } = await supabase
      .from('linkedin_connections')
      .select('access_token, token_expires_at')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()
    
    if (connectionError || !connection) {
      throw new Error('LinkedIn connection not found for this organization')
    }

    // Check if the token is expired
    const tokenExpiresAt = new Date(connection.token_expires_at)
    const now = new Date()
    
    if (tokenExpiresAt <= now) {
      throw new Error('LinkedIn access token has expired. Please reconnect your LinkedIn account.')
    }
    
    // Make authenticated request to LinkedIn API to get ad accounts
    // Simplified endpoint without status filtering
    const response = await fetch('https://api.linkedin.com/v2/adAccountsV2?q=search', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'LinkedIn-Version': '202401',
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('LinkedIn API request failed:', response.status, errorText)
      throw new Error(`LinkedIn API request failed: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Transform LinkedIn API response to our interface
    const adAccounts = data.elements?.map((account: LinkedInApiAccount): LinkedInAdAccount => ({
      id: account.id,
      name: account.name || `Account ${account.id}`,
      status: account.status,
      type: account.type,
      organizationName: account.reference?.organization?.name,
      currency: account.currency
    })) || []
    
    return {
      success: true,
      data: adAccounts
    }
  } catch (error) {
    console.error('Error fetching LinkedIn ad accounts:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}