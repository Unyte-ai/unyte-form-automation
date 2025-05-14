import { createClient } from '@/lib/supabase/server';

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
            <button 
              key={submission.id}
              className="p-4 rounded-md border border-border bg-background w-full text-left transition-all 
                         hover:bg-accent/25 hover:border-primary hover:shadow-sm"
            >
              <p className="font-medium truncate">
                {submission.email_subject || 'Untitled Submission'}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}