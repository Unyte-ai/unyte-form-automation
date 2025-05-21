import { NextRequest, NextResponse } from 'next/server'
import { exchangeLinkedInToken } from '@/app/actions/linkedin-token'
import { storeLinkedInToken, getActiveOrganizationId } from '@/app/actions/linkedin-store-token'

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
    const tokenResult = await exchangeLinkedInToken(code)
    
    if (!tokenResult.success || !tokenResult.data) {
      // If token exchange failed, redirect to error page
      return NextResponse.redirect(
        `${baseUrl}/auth/error?error=${encodeURIComponent(tokenResult.error || 'Failed to exchange token')}`
      )
    }
    
    console.log('LinkedIn token exchange successful')
    
    // Get the active organization ID
    const organizationId = await getActiveOrganizationId()
    
    if (!organizationId) {
      return NextResponse.redirect(
        `${baseUrl}/auth/error?error=${encodeURIComponent('No active organization found')}`
      )
    }
    
    // Store the tokens in the database
    const storeResult = await storeLinkedInToken(tokenResult.data, organizationId)
    
    if (!storeResult.success) {
      return NextResponse.redirect(
        `${baseUrl}/auth/error?error=${encodeURIComponent(storeResult.error || 'Failed to store token')}`
      )
    }
    
    console.log('LinkedIn token stored successfully')
    
    // Successful connection, redirect to home with success message
    return NextResponse.redirect(
      `${baseUrl}/home/${organizationId}?linkedin=connected&success=1`
    )
  } catch (error) {
    console.error('Error in LinkedIn callback handler:', error)
    return NextResponse.redirect(
      `${baseUrl}/auth/error?error=${encodeURIComponent('Unexpected error processing LinkedIn callback')}`
    )
  }
}