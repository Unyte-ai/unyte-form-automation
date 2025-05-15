import { EmailPayload } from './types';
import { extractSubject, extractBody, extractUuidFromEmail } from './utils';

export function parseRecipientEmail(emailData: EmailPayload, requestUrl: string): { to: string; uuidFragment: string | null } {
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
    const url = new URL(requestUrl);
    const queryUuid = url.searchParams.get('uuid');
    if (queryUuid) {
      console.log('Using UUID from query parameters:', queryUuid);
      return { to: 'Unknown - extracted from URL', uuidFragment: queryUuid };
    }
    
    console.log('Could not find recipient email in payload');
    console.log('Available fields:', Object.keys(emailData));
    return { to: '', uuidFragment: null };
  }
  
  console.log('Found recipient email:', to);
  
  // Extract the UUID fragment from the email address
  const uuidFragment = extractUuidFromEmail(to);
  console.log('Extracted UUID fragment:', uuidFragment);
  
  return { to, uuidFragment };
}

export function parseEmailContent(emailData: EmailPayload): { subject: string; body: string } {
  return {
    subject: extractSubject(emailData),
    body: extractBody(emailData)
  };
}

// Updated function for parsing form data - JSON format only
export function parseMicrosoftFormsData(emailBody: string) {
  try {
    // Trim any whitespace and parse the JSON
    const trimmedBody = emailBody.trim();
    const jsonData = JSON.parse(trimmedBody);
    
    // Convert the JSON object to an array of question/answer pairs
    const formData = Object.entries(jsonData).map(([question, answer]) => ({
      question,
      answer: answer !== null && answer !== undefined ? String(answer) : '',
    }));
    
    return {
      rawText: emailBody,
      formData
    };
  } catch (error) {
    console.error('Failed to parse email body as JSON:', error);
    // Return empty form data but include the raw text for debugging
    return { 
      rawText: emailBody,
      formData: [] 
    };
  }
}