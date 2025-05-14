import { EmailPayload, HeaderLine } from './types';

// Helper function to extract UUID from email address
export function extractUuidFromEmail(email: string | null | undefined): string | null {
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
export function extractSubject(emailData: EmailPayload): string {
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
export function extractBody(emailData: EmailPayload): string {
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