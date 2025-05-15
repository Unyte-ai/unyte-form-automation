import { createAdminClient } from '@/lib/supabase/admin';
import { parseMicrosoftFormsData } from './parsers';

export async function findOrganizationByEmailFragment(emailFragment: string): Promise<string | null> {
  if (!emailFragment) return null;
  
  try {
    const supabase = createAdminClient();
    
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

export async function storeFormSubmission(
  organizationId: string,
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    
    // Parse the email body into structured data
    const parsedData = parseMicrosoftFormsData(body);
    
    const { error } = await supabase
      .from('form_submissions')
      .insert({
        organization_id: organizationId,
        email_to: to,
        email_subject: subject,
        email_body: body,
        structured_data: parsedData, // Add the structured data
        processed: false,
        received_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error storing form submission:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in storeFormSubmission:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error storing submission'
    };
  }
}