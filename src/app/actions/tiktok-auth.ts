'use server'

import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'
import { createHash, randomBytes } from 'crypto'

// Helper function to create a code challenge from a verifier
function createCodeChallenge(verifier: string): string {
  const hash = createHash('sha256').update(verifier).digest('base64')
  return hash
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// Helper function to generate a code verifier
function generateCodeVerifier(): string {
  return randomBytes(32)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// Initialize TikTok OAuth flow - just returns the authorization URL
export async function initTikTokOAuth() {
  // Securely access client ID from environment variables on the server
  const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_ID
  
  // Validate client key
  if (!clientKey) {
    throw new Error('TikTok client key is not configured')
  }
  
  // Create a CSRF state token for security
  const csrfState = uuidv4()
  
  // Generate PKCE code verifier and challenge
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = createCodeChallenge(codeVerifier)
  
  // Store the state and code verifier in cookies
  const cookieStore = await cookies()
  cookieStore.set('tiktok_csrf_state', csrfState, { 
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 5, // 5 minutes expiry
    path: '/'
  })
  
  cookieStore.set('tiktok_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 5, // 5 minutes expiry
    path: '/'
  })

  // Build the authorization URL
  const url = 'https://www.tiktok.com/v2/auth/authorize/'
  
  // Add required parameters including PKCE parameters
  const params = new URLSearchParams({
    client_key: clientKey,
    scope: 'user.info.basic',
    response_type: 'code',
    redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/tiktok/callback`,
    state: csrfState,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  })
  
  // Return the full authorization URL
  return `${url}?${params.toString()}`
}