// src/components/forms.tsx (remains a server component)
import { createClient } from '@/lib/supabase/server';
import { FormItem } from '@/components/form-item'; // This will be a client component

interface FormsProps {
  organizationId: string;
}

export async function Forms({ organizationId }: FormsProps) {
  const supabase = await createClient();
  
  // Fetch submissions with pagination
  const { data: submissions, error } = await supabase
    .from('form_submissions')
    .select('id, email_subject')
    .eq('organization_id', organizationId)
    .order('received_at', { ascending: false })
    .limit(10);
  
  const hasSubmissions = submissions && submissions.length > 0;

  return (
    <div className="rounded-lg border p-6 bg-card">
      <h2 className="text-xl font-semibold mb-4">Forms</h2>
      
      {error ? (
        <div className="text-sm text-amber-500">
          Unable to load form submissions. Please try again later.
        </div>
      ) : !hasSubmissions ? (
        <div className="text-muted-foreground">
          No forms available yet.
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <FormItem 
              key={submission.id}
              id={submission.id} 
              title={submission.email_subject || 'Untitled Submission'} 
            />
          ))}
        </div>
      )}
    </div>
  );
}