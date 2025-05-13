import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    // Parse the incoming email data
    const emailData = await request.json();
    
    // Log the full payload to understand its structure
    console.log('Email webhook payload:', JSON.stringify(emailData, null, 2));
    
    // Extract relevant information (adjust based on actual payload structure)
    const to = emailData.to || emailData.recipient || ''; // Extract recipient email
    const subject = emailData.subject || '';
    const body = emailData.text || emailData.html || emailData.body || '';
    
    // Extract the UUID from the email address (if using forms+uuid@blockmerce.com format)
    // or simply using 'forms' if not using a UUID format yet
    const orgUuid = extractUuidFromEmail(to) || 'forms';
    
    // Store in Supabase
    const supabase = await createClient();
    const { error } = await supabase
      .from('form_submissions')
      .insert({
        organization_id: orgUuid,
        email_to: to,
        email_subject: subject,
        email_body: body,
        processed: false,
        received_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error storing form submission:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing email webhook:', error);
    // Return 200 status even on error to prevent ForwardEmail retries
    return NextResponse.json({ success: false, error: 'Internal Server Error' });
  }
}

// Helper function to extract UUID from email address
function extractUuidFromEmail(email: string): string | null {
  // Extract UUID from forms+uuid@blockmerce.com or similar patterns
  const matches = email.match(/forms\+([a-f0-9-]+)@|unyteformautomation\+([a-f0-9-]+)@/i);
  return matches ? (matches[1] || matches[2]) : null;
}