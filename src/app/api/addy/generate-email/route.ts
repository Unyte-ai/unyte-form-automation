import { NextResponse } from 'next/server'
import { generateAliasEmail } from '@/app/actions/addy'

export async function POST(request: Request) {
  try {
    // You can extract additional parameters from the request if needed
    const { description } = await request.json()
    
    const email = await generateAliasEmail(description)
    
    return NextResponse.json({ email })
  } catch (error) {
    console.error('Error in generate-email API route:', error)
    return NextResponse.json(
      { error: 'Failed to generate email' },
      { status: 500 }
    )
  }
}