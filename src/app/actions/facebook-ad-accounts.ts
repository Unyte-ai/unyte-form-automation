'use server'

import { createClient } from '@/lib/supabase/server'

export interface FacebookAdAccount {
  id: string
  name: string
  account_status?: number
  currency?: string
  account_id?: string
}

export interface FacebookPage {
  id: string
  name: string
  access_token?: string
  category?: string
  tasks?: string[]
}

export interface FacebookAccountsAndPages {
  adAccounts: FacebookAdAccount[]
  pages: FacebookPage[]
}

interface FacebookApiAccount {
  id: string
  name?: string
  account_status?: number
  currency?: string
  account_id?: string
}

interface FacebookApiPage {
  id: string
  name?: string
  access_token?: string
  category?: string
  tasks?: string[]
}

/**
 * Fetches Facebook ad accounts and pages for the current user and specified organization
 * @param organizationId - The ID of the organization in our system
 */
export async function getFacebookAdAccountsAndPages(organizationId: string): Promise<{ 
  success: boolean
  data?: FacebookAccountsAndPages
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
    
    // Make both API calls in parallel for better performance
    const [adAccountsResponse, pagesResponse] = await Promise.all([
      fetch(
        `https://graph.facebook.com/v22.0/me/adaccounts?fields=id,name,account_status,currency,account_id`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${connection.access_token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
        }
      ),
      fetch(
        `https://graph.facebook.com/v22.0/me/accounts?fields=id,name,access_token,category,tasks`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${connection.access_token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
        }
      )
    ])
    
    // Check if ad accounts request failed
    if (!adAccountsResponse.ok) {
      const errorText = await adAccountsResponse.text()
      console.error('Facebook Ad Accounts API request failed:', adAccountsResponse.status, errorText)
      throw new Error(`Facebook Ad Accounts API request failed: ${adAccountsResponse.status}`)
    }

    // Check if pages request failed
    if (!pagesResponse.ok) {
      const errorText = await pagesResponse.text()
      console.error('Facebook Pages API request failed:', pagesResponse.status, errorText)
      // Don't throw error for pages - continue with ad accounts only
      console.warn('Continuing without pages data due to API failure')
    }
    
    // Parse both responses
    const adAccountsData = await adAccountsResponse.json()
    let pagesData = null
    
    // Only parse pages data if the request was successful
    if (pagesResponse.ok) {
      pagesData = await pagesResponse.json()
      console.log('Facebook Pages API Response:', pagesData)
    } else {
      console.log('Facebook Pages API failed, proceeding without pages data')
    }
    
    // Transform Facebook API response to our interface for ad accounts
    const adAccounts = adAccountsData.data?.map((account: FacebookApiAccount): FacebookAdAccount => ({
      id: account.id,
      name: account.name || `Account ${account.account_id || account.id}`,
      account_status: account.account_status,
      currency: account.currency,
      account_id: account.account_id
    })) || []

    // Transform Facebook API response to our interface for pages
    const pages = pagesData?.data?.map((page: FacebookApiPage): FacebookPage => ({
      id: page.id,
      name: page.name || `Page ${page.id}`,
      access_token: page.access_token,
      category: page.category,
      tasks: page.tasks
    })) || []

    console.log('Transformed pages data:', pages)
    console.log('Final result:', { adAccountsCount: adAccounts.length, pagesCount: pages.length })
    
    return {
      success: true,
      data: {
        adAccounts,
        pages
      }
    }
  } catch (error) {
    console.error('Error fetching Facebook ad accounts and pages:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Legacy function for backward compatibility - only returns ad accounts
 * @deprecated Use getFacebookAdAccountsAndPages instead
 */
export async function getFacebookAdAccounts(organizationId: string): Promise<{ 
  success: boolean
  data?: FacebookAdAccount[]
  error?: string
}> {
  const result = await getFacebookAdAccountsAndPages(organizationId)
  
  if (!result.success) {
    return {
      success: false,
      error: result.error
    }
  }
  
  return {
    success: true,
    data: result.data?.adAccounts || []
  }
}