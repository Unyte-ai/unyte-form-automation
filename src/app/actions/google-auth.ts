'use server'

export async function initGoogleOAuth(organizationId?: string): Promise<string> {
  // Get Google credentials from environment variables
  const clientId = process.env.GOOGLE_CLIENT_ID
  
  if (!clientId) {
    throw new Error('Google client ID is not configured')
  }

  if (!organizationId) {
    throw new Error('Organization ID is required to connect Google account')
  }

  // Set the redirect URI based on environment
  const redirectUri = process.env.NODE_ENV === 'production'
    ? 'https://app.unyte.ai/auth/google/callback'
    : 'http://localhost:3000/auth/google/callback'

  // Build the authorization URL following Google OAuth2 web server flow
  const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
  
  // Create a state parameter that includes the organization ID
  // Using "__" as delimiter because it won't appear in UUIDs
  const randomState = crypto.randomUUID()
  const state = `${randomState}__${organizationId}`
  
  // Add required parameters following Google's OAuth2 documentation
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state: state,
    access_type: 'offline', // Required for refresh tokens
    prompt: 'consent', // Force consent screen to ensure refresh token
    // Use the exact scopes provided
    scope: [
      'https://www.googleapis.com/auth/adwords',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' ')
  })
  
  // Return the full authorization URL
  return `${baseUrl}?${params.toString()}`
}