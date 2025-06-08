'use server'

export async function initLinkedInOAuth(organizationId?: string): Promise<string> {
  // Get LinkedIn credentials from environment variables
  const clientId = process.env.LINKEDIN_CLIENT_ID
  
  if (!clientId) {
    throw new Error('LinkedIn client ID is not configured')
  }

  if (!organizationId) {
    throw new Error('Organization ID is required to connect LinkedIn account')
  }

  // Set the redirect URI based on environment
  const redirectUri = process.env.NODE_ENV === 'production'
    ? 'https://app.unyte.ai/auth/linkedin/callback'
    : 'http://localhost:3000/auth/linkedin/callback'

  // Build the authorization URL
  const baseUrl = 'https://www.linkedin.com/oauth/v2/authorization'
  
  // Create a state parameter that includes the organization ID
  // Using "__" as delimiter because it won't appear in UUIDs
  const randomState = crypto.randomUUID()
  const state = `${randomState}__${organizationId}`
  
  // Add required parameters with OpenID Connect scopes AND Advertising API scopes
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state: state,
    // Include both OpenID Connect scopes and Advertising API scopes
    scope: 'openid profile email r_ads rw_ads'
  })
  
  // Return the full authorization URL
  return `${baseUrl}?${params.toString()}`
}