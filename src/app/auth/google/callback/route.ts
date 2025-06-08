import { NextRequest, NextResponse } from 'next/server'
import { exchangeGoogleToken } from '@/app/actions/google-token'
import { storeGoogleToken } from '@/app/actions/google-store-token'

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
  console.log('Google Callback Parameters:', {
    code: code ? 'present' : 'missing',
    state,
    error,
    errorDescription,
    allParams: Object.fromEntries(searchParams.entries())
  })
  
  // Handle errors from Google
  if (error) {
    console.error('Google auth error:', error, errorDescription)
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
    const tokenResult = await exchangeGoogleToken(code)
    
    if (!tokenResult.success || !tokenResult.data) {
      // If token exchange failed, redirect to error page
      return NextResponse.redirect(
        `${baseUrl}/auth/error?error=${encodeURIComponent(tokenResult.error || 'Failed to exchange token')}`
      )
    }
    
    console.log('Google token exchange successful')
    
    // Use the extracted organization ID from state parameter
    if (!organizationId) {
      return NextResponse.redirect(
        `${baseUrl}/auth/error?error=${encodeURIComponent('Organization ID not found in state parameter')}`
      )
    }
    
    // Store the tokens in the database
    const storeResult = await storeGoogleToken(tokenResult.data, organizationId)
    
    if (!storeResult.success) {
      return NextResponse.redirect(
        `${baseUrl}/auth/error?error=${encodeURIComponent(storeResult.error || 'Failed to store token')}`
      )
    }
    
    console.log('Google token stored successfully')
    
    // Successful connection, redirect to home with success message
    return NextResponse.redirect(
      `${baseUrl}/home/${organizationId}?google=connected&success=1`
    )
  } catch (error) {
    console.error('Error in Google callback handler:', error)
    return NextResponse.redirect(
      `${baseUrl}/auth/error?error=${encodeURIComponent('Unexpected error processing Google callback')}`
    )
  }
}