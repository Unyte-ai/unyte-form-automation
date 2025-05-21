'use server'

// Define a proper interface for the token response data
interface LinkedInTokenData {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
  refreshTokenExpiresIn?: number;
  scope: string;
}

/**
 * Exchanges an authorization code for a LinkedIn access token
 * Following Step 3 in the LinkedIn OAuth flow
 */
export async function exchangeLinkedInToken(code: string): Promise<{ 
  success: boolean; 
  data?: LinkedInTokenData;
  error?: string;
}> {
  try {
    // Get LinkedIn credentials from environment variables
    const clientId = process.env.LINKEDIN_CLIENT_ID
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      throw new Error('LinkedIn credentials are not properly configured')
    }
    
    // Set the redirect URI based on environment
    const redirectUri = process.env.NODE_ENV === 'production'
      ? 'https://unyte-form-automation.vercel.app/auth/linkedin/callback'
      : 'http://localhost:3000/auth/linkedin/callback'
    
    // Prepare token exchange request
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri
    })
    
    console.log('Exchanging LinkedIn code for token with params:', {
      grant_type: 'authorization_code',
      code: code ? `${code.substring(0, 10)}...` : 'missing', // Log partially obscured code for debugging
      client_id: clientId,
      redirect_uri: redirectUri
    })
    
    // Make the token exchange request
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: params.toString()
    })
    
    // Check for network errors
    if (!response.ok) {
      const errorText = await response.text()
      console.error('LinkedIn token request failed:', response.status, errorText)
      throw new Error(`Token request failed: ${response.status} ${errorText}`)
    }
    
    // Parse the response
    const data = await response.json()
    
    // Handle error response
    if (data.error) {
      console.error('LinkedIn token exchange error:', data)
      throw new Error(`LinkedIn token exchange failed: ${data.error_description || data.error}`)
    }
    
    console.log('Successfully received LinkedIn token with scopes:', data.scope)
    
    // Return the successful response
    return { 
      success: true, 
      data: {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
        refreshToken: data.refresh_token,
        refreshTokenExpiresIn: data.refresh_token_expires_in,
        scope: data.scope
      }
    }
  } catch (error) {
    console.error('Error exchanging LinkedIn token:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}