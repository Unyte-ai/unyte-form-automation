'use server'

/**
 * Initiates Facebook OAuth flow using Facebook Login for Business
 * @param organizationId The organization ID to associate the connection with
 */
export async function initFacebookOAuth(organizationId?: string): Promise<string> {
  // Get Facebook credentials from environment variables
  const appId = process.env.FACEBOOK_APP_ID
  
  if (!appId) {
    throw new Error('Facebook App ID is not configured')
  }

  if (!organizationId) {
    throw new Error('Organization ID is required to connect Facebook account')
  }

  // Set the redirect URI based on environment
  const redirectUri = process.env.NODE_ENV === 'production'
    ? 'https://app.unyte.ai/auth/facebook/callback'
    : 'http://localhost:3000/auth/facebook/callback'

  // Build the authorization URL
  const baseUrl = 'https://www.facebook.com/v22.0/dialog/oauth'
  
  // Create a state parameter that includes the organization ID (same pattern as LinkedIn/TikTok)
  // Using "__" as delimiter because it won't appear in UUIDs
  const randomState = crypto.randomUUID()
  const state = `${randomState}__${organizationId}`
  
  // Add required parameters using configuration ID instead of traditional scopes
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state: state,
    config_id: '1223593219217777', // Your Facebook Login for Business configuration ID
    response_type: 'code' // Use authorization code flow for better security
  })
  
  // Return the full authorization URL
  return `${baseUrl}?${params.toString()}`
}