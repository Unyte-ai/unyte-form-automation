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

// New function for parsing Microsoft Forms data
export function parseMicrosoftFormsData(emailBody: string) {
  // Split into lines and filter out empty ones
  const lines = emailBody.split('\n').filter(line => line.trim().length > 0);
  
  // Need at least 2 lines (questions and answers)
  if (lines.length < 2) {
    return { formData: [] };
  }

  // Extract the question line and answer line
  const questionLine = lines[0];
  const answerLine = lines[1];
  
  // Detect column positions by analyzing spaces
  const columnPositions: number[] = [];
  let inWord = false;
  let consecutiveSpaces = 0;
  
  for (let i = 0; i < questionLine.length; i++) {
    if (questionLine[i] !== ' ') {
      if (!inWord) {
        // Start of a new column
        columnPositions.push(i);
        inWord = true;
      }
      consecutiveSpaces = 0;
    } else {
      consecutiveSpaces++;
      // Consider a column break when we have 2+ consecutive spaces
      if (inWord && consecutiveSpaces >= 2) {
        inWord = false;
      }
    }
  }
  
  // Parse questions and answers based on column positions
  const formData = [];
  
  for (let i = 0; i < columnPositions.length; i++) {
    const startPos = columnPositions[i];
    const endPos = i < columnPositions.length - 1 
      ? columnPositions[i + 1] 
      : questionLine.length;
    
    const question = questionLine.substring(startPos, endPos).trim();
    
    // Extract answer if available (within bounds)
    let answer = '';
    if (startPos < answerLine.length) {
      const answerEndPos = Math.min(endPos, answerLine.length);
      answer = answerLine.substring(startPos, answerEndPos).trim();
    }
    
    formData.push({ question, answer });
  }
  
  return { 
    rawText: emailBody,
    formData: formData 
  };
}