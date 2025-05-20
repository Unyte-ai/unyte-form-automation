'use server'

export async function initLinkedInOAuth(): Promise<string> {
  // Get LinkedIn credentials from environment variables
  const clientId = process.env.LINKEDIN_CLIENT_ID
  
  if (!clientId) {
    throw new Error('LinkedIn client ID is not configured')
  }

  // Set the redirect URI based on environment
  const redirectUri = process.env.NODE_ENV === 'production'
    ? 'https://unyte-form-automation.vercel.app/auth/linkedin/callback'
    : 'http://localhost:3000/auth/linkedin/callback'

  // Build the authorization URL
  const baseUrl = 'https://www.linkedin.com/oauth/v2/authorization'
  
  // Add required parameters with OpenID Connect scopes
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state: crypto.randomUUID(),
    // OpenID Connect scopes
    scope: 'openid profile email'
  })
  
  // Return the full authorization URL
  return `${baseUrl}?${params.toString()}`
}