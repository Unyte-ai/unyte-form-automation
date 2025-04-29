'use server'

const API_URL = process.env.ADDY_API_URL || 'https://app.addy.io/api/v1';
const API_KEY = process.env.ADDY_API_KEY;

if (!API_KEY) {
  console.warn('ADDY_API_KEY is not defined in environment variables');
}

/**
 * Generate a new email alias
 */
export async function generateAliasEmail(description?: string) {
  try {
    const response = await fetch(`${API_URL}/aliases`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        domain: 'anonaddy.me',
        format: 'uuid',
        description: description || 'Generated for Unyte Form Automation',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to generate alias (${response.status})`);
    }

    const data = await response.json();
    return data.data.email;
  } catch (error) {
    console.error('Error generating alias email:', error);
    throw new Error('Failed to generate email alias. Please try again.');
  }
}