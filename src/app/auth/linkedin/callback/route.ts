// src/app/auth/linkedin/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { exchangeLinkedInToken } from '@/app/actions/linkedin-token'

export async function GET(request: NextRequest) {
  // Get URL parameters
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  
  // Get base URL for redirects
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://unyte-form-automation.vercel.app' 
    : 'http://localhost:3000'

  // For debugging
  console.log('LinkedIn Callback Parameters:', {
    code: code ? 'present' : 'missing',
    error,
    errorDescription,
    allParams: Object.fromEntries(searchParams.entries())
  })
  
  // Handle errors from LinkedIn
  if (error) {
    console.error('LinkedIn auth error:', error, errorDescription)
    return NextResponse.redirect(
      `${baseUrl}/auth/error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`
    )
  }
  
  // If code is missing, handle the error
  if (!code) {
    console.error('Authorization code is missing from callback')
    return NextResponse.redirect(
      `${baseUrl}/auth/error?error=Missing authorization code`
    )
  }
  
  try {
    // Exchange code for tokens
    const result = await exchangeLinkedInToken(code)
    
    if (!result.success) {
      // If token exchange failed, redirect to error page
      return NextResponse.redirect(
        `${baseUrl}/auth/error?error=${encodeURIComponent(result.error || 'Failed to exchange token')}`
      )
    }
    
    console.log('LinkedIn token exchange successful')
    
    // TODO: Store token in database (will be implemented next)
    
    // Successful connection, redirect to home with success message
    return NextResponse.redirect(
      `${baseUrl}/home?linkedin=connected&success=1`
    )
  } catch (error) {
    console.error('Error in LinkedIn callback handler:', error)
    return NextResponse.redirect(
      `${baseUrl}/auth/error?error=${encodeURIComponent('Unexpected error processing LinkedIn callback')}`
    )
  }
}