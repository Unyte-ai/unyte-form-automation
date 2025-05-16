import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get URL parameters
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    // For debugging: Log all the parameters we received
    console.log('TikTok Callback Parameters:', {
      code,
      state,
      error,
      errorDescription,
      allParams: Object.fromEntries(searchParams.entries())
    })
    
    // If there's an error, redirect to the error page
    if (error) {
      console.error('TikTok auth error:', error, errorDescription)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`
      )
    }
    
    // For now, just redirect to home with a success message
    // We'll implement the token exchange later
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/home?tiktok=callback_received&code=${code ? 'present' : 'missing'}`
    )
    
  } catch (error) {
    console.error('Error in TikTok callback handler:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/error?error=Unexpected error processing TikTok callback`
    )
  }
}