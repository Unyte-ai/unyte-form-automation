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

export function parseMicrosoftFormsData(emailBody: string) {
  // First check if there's an HTML table in the body
  const tableMatch = emailBody.match(/<table>[\s\S]*?<\/table>/);
  
  if (tableMatch) {
    try {
      const tableHtml = tableMatch[0];
      
      // Extract headers (questions)
      const headers: string[] = [];
      const headerMatch = tableHtml.match(/<thead><tr>([\s\S]*?)<\/tr><\/thead>/);
      
      if (headerMatch) {
        const headerRow = headerMatch[1];
        const thMatches = headerRow.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g);
        
        for (const match of Array.from(thMatches)) {
          headers.push(decodeHtmlEntities(match[1].trim()));
        }
      }
      
      // Extract data (answers)
      const answers: string[] = [];
      const bodyMatch = tableHtml.match(/<tbody><tr>([\s\S]*?)<\/tr><\/tbody>/);
      
      if (bodyMatch) {
        const dataRow = bodyMatch[1];
        const tdMatches = dataRow.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g);
        
        for (const match of Array.from(tdMatches)) {
          answers.push(decodeHtmlEntities(match[1].trim()));
        }
      }
      
      // Create formData with proper question-answer mapping
      const formData = headers.map((question, index) => ({
        question,
        answer: index < answers.length ? answers[index] : ''
      }));
      
      return {
        rawText: emailBody,
        formData
      };
    } catch (error) {
      console.error('Error parsing HTML table:', error);
      // Fall back to text parsing if HTML parsing fails
    }
  }
  
  // If no HTML table found or parsing failed, fall back to text parsing
  return parseTextBasedFormData(emailBody);
}

// Helper function to handle HTML entities
function decodeHtmlEntities(html: string): string {
  const entities: Record<string, string> = {
    '&quot;': '"',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&nbsp;': ' ',
    '&#163;': '£',
    '&#039;': "'",
    '&apos;': "'"
  };
  
  return html.replace(/&[^;]+;/g, (entity) => {
    return entities[entity] || entity;
  });
}

// Fallback text-based parser (improved version of the current implementation)
function parseTextBasedFormData(emailBody: string) {
  const lines = emailBody.split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length < 2) {
    return { formData: [], rawText: emailBody };
  }
  
  const questionLine = lines[0];
  const answerLine = lines[1];
  
  // Improved algorithm for detecting column boundaries
  const columns = [];
  let inColumn = false;
  let textStartPos = 0;
  
  // Scan the line character by character
  for (let i = 0; i < questionLine.length; i++) {
    if (!inColumn && questionLine[i] !== ' ') {
      // Start of a new column
      inColumn = true;
      textStartPos = i;
    } else if (inColumn && questionLine[i] === ' ') {
      // Check if we have multiple consecutive spaces (column separator)
      let spaceCount = 1;
      let j = i + 1;
      
      while (j < questionLine.length && questionLine[j] === ' ') {
        spaceCount++;
        j++;
      }
      
      if (spaceCount >= 3) {
        // This is a column separator
        columns.push({
          start: textStartPos,
          end: i - 1
        });
        
        i = j - 1; // Skip spaces we've already counted
        inColumn = false;
      }
    }
  }
  
  // Add the last column if we were still in one
  if (inColumn) {
    columns.push({
      start: textStartPos,
      end: questionLine.length - 1
    });
  }
  
  // Extract questions and answers using the detected columns
  const formData = columns.map(column => {
    const question = questionLine.substring(column.start, column.end + 1).trim();
    let answer = '';
    
    if (column.start < answerLine.length) {
      const answerEnd = Math.min(column.end + 1, answerLine.length);
      answer = answerLine.substring(column.start, answerEnd).trim();
    }
    
    return { question, answer };
  });
  
  return {
    rawText: emailBody,
    formData
  };
}