import { NextRequest, NextResponse } from 'next/server'
import { exchangeFacebookToken } from '@/app/actions/facebook-token'

export async function GET(request: NextRequest) {
  // Get URL parameters
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  
  // Get base URL for redirects
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://app.unyte.ai' 
    : 'http://localhost:3000'

  // For debugging
  console.log('Facebook Callback Parameters:', {
    code: code ? 'present' : 'missing',
    state,
    error,
    errorDescription,
    allParams: Object.fromEntries(searchParams.entries())
  })
  
  // Handle errors from Facebook
  if (error) {
    console.error('Facebook auth error:', error, errorDescription)
    return NextResponse.redirect(
      `${baseUrl}/auth/error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`
    )
  }
  
  // If code or state is missing, handle the error
  if (!code || !state) {
    console.error('Authorization code or state is missing from callback')
    return NextResponse.redirect(
      `${baseUrl}/auth/error?error=Missing required parameters`
    )
  }
  
  // Extract organization ID from state
  // Format: randomUUID__organizationId (using double underscore as delimiter)
  const stateParts = state.split('__')
  
  if (stateParts.length !== 2) {
    console.error('Invalid state format, missing organization ID')
    return NextResponse.redirect(
      `${baseUrl}/auth/error?error=Invalid state parameter format`
    )
  }
  
  // Get the organization ID (the part after the delimiter)
  const organizationId = stateParts[1]
  
  try {
    // Exchange code for tokens
    const tokenResult = await exchangeFacebookToken(code, organizationId)
    
    if (!tokenResult.success) {
      // If token exchange failed, redirect to error page
      return NextResponse.redirect(
        `${baseUrl}/auth/error?error=${encodeURIComponent(tokenResult.error || 'Failed to exchange token')}`
      )
    }
    
    console.log('Facebook token exchange successful')
    
    // Successful connection, redirect to home with success message
    return NextResponse.redirect(
      `${baseUrl}/home/${organizationId}?facebook=connected&success=1`
    )
  } catch (error) {
    console.error('Error in Facebook callback handler:', error)
    return NextResponse.redirect(
      `${baseUrl}/auth/error?error=${encodeURIComponent('Unexpected error processing Facebook callback')}`
    )
  }
}