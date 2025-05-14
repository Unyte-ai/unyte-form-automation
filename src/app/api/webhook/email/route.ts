// src/app/api/webhook/email/route.ts

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Define TypeScript interfaces for the email data structure
interface HeaderLine {
  key?: string;
  line?: string;
}

interface EmailPayload {
  to?: string;
  recipient?: string;
  subject?: string;
  text?: string;
  html?: string;
  body?: string;
  textAsHtml?: string;
  headers?: {
    subject?: string;
  };
  headerLines?: HeaderLine[];
  session?: {
    recipient?: string;
  };
  recipients?: string[];
}

// New function to look up organization ID by the email fragment
async function findOrganizationByEmailFragment(emailFragment: string): Promise<string | null> {
  if (!emailFragment) return null;
  
  try {
    const supabase = await createAdminClient();
    
    // Look up the organization based on the email pattern
    const { data, error } = await supabase
      .from('organizations')
      .select('id, org_email')
      .ilike('org_email', `%+${emailFragment}@%`)
      .single();
    
    if (error || !data) {
      console.error('Error finding organization:', error || 'No organization found');
      return null;
    }
    
    console.log(`Found organization: ${data.id} with email: ${data.org_email}`);
    return data.id;
  } catch (error) {
    console.error('Error in findOrganizationByEmailFragment:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    // Parse the incoming email data
    const emailData = await request.json() as EmailPayload;
    
    // Log the full payload to understand its structure
    console.log('Email webhook payload:', JSON.stringify(emailData, null, 2));
    
    // Look for the recipient email in various possible locations in the ForwardEmail payload
    let to = '';
    
    // Check all possible locations where recipient might be found
    if (typeof emailData.to === 'string') {
      to = emailData.to;
    } else if (typeof emailData.recipient === 'string') {
      to = emailData.recipient;
    } else if (emailData.session && typeof emailData.session.recipient === 'string') {
      to = emailData.session.recipient;
    } else if (emailData.recipients && Array.isArray(emailData.recipients) && emailData.recipients.length > 0) {
      to = emailData.recipients[0];
    } else {
      // Try to extract from URL query parameters as a fallback
      const url = new URL(request.url);
      const queryUuid = url.searchParams.get('uuid');
      if (queryUuid) {
        console.log('Using UUID from query parameters:', queryUuid);
        
        // Look up the organization ID from the fragment
        const organizationId = await findOrganizationByEmailFragment(queryUuid);
        
        if (!organizationId) {
          console.error('No matching organization found for fragment:', queryUuid);
          return NextResponse.json({ 
            success: false, 
            error: `No organization found for ID fragment: ${queryUuid}` 
          }, { status: 200 });
        }
        
        // Store in Supabase with the full organization UUID
        const supabase = await createAdminClient();
        const { error } = await supabase
          .from('form_submissions')
          .insert({
            organization_id: organizationId, // Full UUID from lookup
            email_to: 'Unknown - extracted from URL',
            email_subject: extractSubject(emailData),
            email_body: extractBody(emailData),
            processed: false,
            received_at: new Date().toISOString()
          });
        
        if (error) {
          console.error('Error storing form submission:', error);
          return NextResponse.json({ success: false, error: error.message }, { status: 200 });
        }
        
        return NextResponse.json({ success: true });
      }
      
      console.log('Could not find recipient email in payload');
      console.log('Available fields:', Object.keys(emailData));
      return NextResponse.json({ success: false, error: 'Recipient email not found in payload' }, { status: 200 });
    }
    
    console.log('Found recipient email:', to);
    
    // Extract the subject and body
    const subject = extractSubject(emailData);
    const body = extractBody(emailData);
    
    // Extract the UUID fragment from the email address
    const emailFragment = extractUuidFromEmail(to);
    console.log('Extracted UUID fragment:', emailFragment);
    
    if (!emailFragment) {
      console.error('Could not extract UUID fragment from email:', to);
      return NextResponse.json({ 
        success: false, 
        error: 'Could not extract organization ID from email address' 
      }, { status: 200 });
    }
    
    // Look up the full organization ID using the fragment
    const organizationId = await findOrganizationByEmailFragment(emailFragment);
    
    if (!organizationId) {
      console.error('No matching organization found for fragment:', emailFragment);
      return NextResponse.json({ 
        success: false, 
        error: `No organization found for email: ${to}` 
      }, { status: 200 });
    }
    
    // Store in Supabase with the full organization UUID
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from('form_submissions')
      .insert({
        organization_id: organizationId, // Full UUID from lookup
        email_to: to,
        email_subject: subject,
        email_body: body,
        processed: false,
        received_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error storing form submission:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 200 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing email webhook:', error);
    // Return 200 status even on error to prevent ForwardEmail retries
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 200 });
  }
}

// Helper function to extract UUID from email address
function extractUuidFromEmail(email: string | null | undefined): string | null {
  if (!email || typeof email !== 'string') {
    console.log('Email is not a string:', email);
    return null;
  }
  
  try {
    // Extract UUID from forms+uuid@blockmerce.com or similar patterns
    const matches = email.match(/forms\+([a-f0-9-]+)@|unyteformautomation\+([a-f0-9-]+)@/i);
    return matches ? (matches[1] || matches[2]) : null;
  } catch (error) {
    console.error('Error in regex matching:', error);
    return null;
  }
}

// Helper function to extract subject from various payload structures
function extractSubject(emailData: EmailPayload): string {
  // Try various possible locations for the subject
  if (typeof emailData.subject === 'string') {
    return emailData.subject;
  } else if (emailData.headers && emailData.headers.subject) {
    return emailData.headers.subject;
  } else if (emailData.headerLines) {
    // Try to find subject in header lines
    const subjectHeader = emailData.headerLines.find((h: HeaderLine) => 
      h.key && h.key.toLowerCase() === 'subject' && h.line);
    if (subjectHeader && subjectHeader.line) {
      return subjectHeader.line.replace(/^Subject:\s*/i, '');
    }
  }
  return '';
}

// Helper function to extract body from various payload structures
function extractBody(emailData: EmailPayload): string {
  if (typeof emailData.text === 'string') {
    return emailData.text;
  } else if (typeof emailData.html === 'string') {
    return emailData.html;
  } else if (typeof emailData.body === 'string') {
    return emailData.body;
  } else if (emailData.textAsHtml) {
    return emailData.textAsHtml;
  }
  return '';
}