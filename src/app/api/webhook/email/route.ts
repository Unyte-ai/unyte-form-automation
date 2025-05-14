import { NextResponse } from 'next/server';
import { EmailPayload } from './types';
import { parseRecipientEmail, parseEmailContent } from './parsers';
import { findOrganizationByEmailFragment, storeFormSubmission } from './database';

export async function POST(request: Request) {
  try {
    // Parse the incoming email data
    const emailData = await request.json() as EmailPayload;
    
    // Log the full payload to understand its structure
    console.log('Email webhook payload:', JSON.stringify(emailData, null, 2));
    
    // Parse recipient email and extract UUID fragment
    const { to, uuidFragment } = parseRecipientEmail(emailData, request.url);
    
    // Handle case where no recipient could be found
    if (!to) {
      return NextResponse.json({ 
        success: false, 
        error: 'Recipient email not found in payload' 
      }, { status: 200 });
    }
    
    // Handle case where UUID fragment couldn't be extracted
    if (!uuidFragment) {
      console.error('Could not extract UUID fragment from email:', to);
      return NextResponse.json({ 
        success: false, 
        error: 'Could not extract organization ID from email address' 
      }, { status: 200 });
    }
    
    // Look up the organization ID using the UUID fragment
    const organizationId = await findOrganizationByEmailFragment(uuidFragment);
    
    // Handle case where no matching organization was found
    if (!organizationId) {
      console.error('No matching organization found for fragment:', uuidFragment);
      return NextResponse.json({ 
        success: false, 
        error: `No organization found for email: ${to}` 
      }, { status: 200 });
    }
    
    // Parse email content
    const { subject, body } = parseEmailContent(emailData);
    
    // Store the submission in the database
    const result = await storeFormSubmission(organizationId, to, subject, body);
    
    // Return appropriate response
    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 200 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing email webhook:', error);
    // Return 200 status even on error to prevent ForwardEmail retries
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal Server Error' 
    }, { status: 200 });
  }
}
