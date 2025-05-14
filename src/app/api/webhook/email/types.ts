export interface HeaderLine {
    key?: string;
    line?: string;
  }
  
  export interface EmailPayload {
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