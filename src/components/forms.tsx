import { createClient } from '@/lib/supabase/server';
import { FormItem } from '@/components/form-item'; // This will be a client component

interface FormsProps {
  organizationId: string;
}

// Define interfaces for structured data
interface FormQuestion {
  question: string;
  answer: string;
}

interface StructuredData {
  rawText: string;
  formData: FormQuestion[];
}

// Helper function to extract campaign name from structured_data
function extractCampaignName(structuredData: StructuredData | null): string {
  if (!structuredData?.formData || !Array.isArray(structuredData.formData)) {
    return 'Untitled Submission';
  }

  // Search for questions containing "Campaign Name" or "Campaign Names"
  const campaignNameField = structuredData.formData.find(
    (field: FormQuestion) => 
      field.question.toLowerCase().includes('campaign name') ||
      field.question.toLowerCase().includes('campaign names')
  );

  return campaignNameField?.answer || 'Untitled Submission';
}

export async function Forms({ organizationId }: FormsProps) {
  const supabase = await createClient();
  
  // Fetch submissions with structured_data instead of email_subject
  const { data: submissions, error } = await supabase
    .from('form_submissions')
    .select('id, structured_data')
    .eq('organization_id', organizationId)
    .order('received_at', { ascending: false })
    .limit(10);
  
  const hasSubmissions = submissions && submissions.length > 0;

  return (
    <div className="rounded-lg border p-6 bg-card">
      <h2 className="text-xl font-semibold mb-4">Briefs</h2>
      
      {error ? (
        <div className="text-sm text-amber-500">
          Unable to load form submissions. Please try again later.
        </div>
      ) : !hasSubmissions ? (
        <div className="p-4 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
          <p className="text-amber-800 dark:text-amber-300 text-sm font-medium mb-2">
            ⚠️ No forms available yet.
          </p>
          <div className="text-amber-800 dark:text-amber-300 text-xs space-y-1">
            <p className="font-medium">To receive forms:</p>
            <div className="ml-2 space-y-0.5">
              <p>• Set up Power Automate on your Microsoft Forms</p>
              <p>• Send form data to your organization email (see above)</p>
              <p>• Ensure data is sent in JSON format</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <FormItem 
              key={submission.id}
              id={submission.id} 
              title={extractCampaignName(submission.structured_data)} 
            />
          ))}
        </div>
      )}
    </div>
  );
}