// src/lib/addy/api.ts
const API_URL = process.env.ADDY_API_URL || 'https://app.addy.io/api/v1';
const API_KEY = process.env.ADDY_API_KEY;

/**
 * Base function for making authenticated requests to the Addy API
 */
async function fetchAddy(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;
  
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to fetch ${endpoint}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Addy API error:', error);
    throw error;
  }
}

/**
 * Generate a new alias email address
 */
export async function generateEmailAlias(options: {
    domain?: string;
    description?: string;
    format?: 'random_characters' | 'uuid' | 'random_words' | 'custom';
    localPart?: string;
  }) {
    const { domain = 'anonaddy.me', description, format = 'uuid', localPart } = options;
    
    type AliasPayload = {
      domain: string;
      format: 'random_characters' | 'uuid' | 'random_words' | 'custom';
      description?: string;
      local_part?: string;
      recipient_ids?: string[];
    };
    
    const payload: AliasPayload = {
      domain,
      format,
    };
  
    if (description) {
      payload.description = description;
    }
  
    if (format === 'custom' && localPart) {
      payload.local_part = localPart;
    }
  
    const result = await fetchAddy('/aliases', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  
    return result.data;
}

export async function getAccountDetails() {
  const result = await fetchAddy('/account-details');
  return result.data[0];
}