import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Get URL parameters
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  
  // For debugging
  console.log('LinkedIn Callback Parameters:', {
    code: code ? 'present' : 'missing',
    error,
    errorDescription,
    allParams: Object.fromEntries(searchParams.entries())
  })
  
  // Get base URL for redirects
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://unyte-form-automation.vercel.app' 
    : 'http://localhost:3000'
  
  // Handle errors from LinkedIn
  if (error) {
    console.error('LinkedIn auth error:', error, errorDescription)
    return NextResponse.redirect(
      `${baseUrl}/auth/error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`
    )
  }
  
  // Temporary response for testing
  return NextResponse.redirect(
    `${baseUrl}/home?linkedin=connecting&code=${code ? 'received' : 'missing'}`
  )
}