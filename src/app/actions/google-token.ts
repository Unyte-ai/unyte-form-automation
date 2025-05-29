'use server'

// Define a proper interface for the token response data following Google's OAuth2 response
interface GoogleTokenData {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

/**
 * Exchanges an authorization code for a Google access token
 * Following Google's OAuth2 web server flow documentation
 */
export async function exchangeGoogleToken(code: string): Promise<{ 
  success: boolean; 
  data?: GoogleTokenData;
  error?: string;
}> {
  try {
    // Get Google credentials from environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      throw new Error('Google credentials are not properly configured')
    }
    
    // Set the redirect URI based on environment
    const redirectUri = process.env.NODE_ENV === 'production'
      ? 'https://unyte-form-automation.vercel.app/auth/google/callback'
      : 'http://localhost:3000/auth/google/callback'
    
    // Prepare token exchange request following Google's OAuth2 documentation
    const params = new URLSearchParams({
      code: code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
    
    console.log('Exchanging Google code for token with params:', {
      code: code ? `${code.substring(0, 10)}...` : 'missing', // Log partially obscured code for debugging
      client_id: clientId,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
    
    // Make the token exchange request to Google's token endpoint
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params.toString()
    })
    
    // Check for network errors
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google token request failed:', response.status, errorText)
      throw new Error(`Token request failed: ${response.status} ${errorText}`)
    }
    
    // Parse the response
    const data = await response.json()
    
    // Handle error response
    if (data.error) {
      console.error('Google token exchange error:', data)
      throw new Error(`Google token exchange failed: ${data.error_description || data.error}`)
    }
    
    console.log('Successfully received Google token with scopes:', data.scope)
    
    // Return the successful response matching Google's token response format
    return { 
      success: true, 
      data: {
        access_token: data.access_token,
        expires_in: data.expires_in,
        refresh_token: data.refresh_token,
        scope: data.scope,
        token_type: data.token_type,
        id_token: data.id_token
      }
    }
  } catch (error) {
    console.error('Error exchanging Google token:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}