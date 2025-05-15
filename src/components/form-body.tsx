import { createClient } from '@/lib/supabase/server'

// Define interfaces for our structured data
interface FormQuestion {
  question: string;
  answer: string;
}

interface StructuredData {
  rawText: string;
  formData: FormQuestion[];
}

interface FormSubmission {
  structured_data: StructuredData;
  email_subject: string;
}

interface FormBodyProps {
  formId: string
}

export async function FormBody({ formId }: FormBodyProps) {
  const supabase = await createClient()
  
  // Fetch the form submission data - only select structured_data now
  const { data, error } = await supabase
    .from('form_submissions')
    .select('structured_data, email_subject')
    .eq('id', formId)
    .single()
  
  if (error || !data) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800/30 dark:bg-amber-800/10 dark:text-amber-500">
        <p>Failed to load form content.</p>
      </div>
    )
  }
  
  const submission = data as FormSubmission;
  const structuredData = submission.structured_data;
  
  // Check if we have valid structured data
  const hasFormData = structuredData?.formData?.length > 0;
  const hasRawText = structuredData?.rawText;
  
  // If no content at all
  if (!hasRawText && !hasFormData) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-muted-foreground">
        <p>This form submission has no content.</p>
      </div>
    )
  }

  // If we have structured form data, display it in vertical format (question as title, answer as text)
  if (hasFormData) {
    return (
      <div className="mt-6 rounded-lg border border-border bg-card p-6">
        <div className="space-y-6">
          {structuredData.formData.map((item: FormQuestion, i: number) => (
            <div key={i} className="border-b pb-6 last:border-0 last:pb-0">
              <h3 className="text-lg font-medium mb-2">{item.question}</h3>
              <p className="text-muted-foreground">
                {item.answer || 'No answer provided'}
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  // Fallback to displaying the raw email body from structured_data.rawText
  return (
    <div className="mt-6 rounded-lg border border-border bg-card p-6">
      <div className="max-h-[600px] overflow-y-auto">
        <pre className="text-sm whitespace-pre-wrap break-words font-normal">
          {structuredData?.rawText || 'No content available'}
        </pre>
      </div>
    </div>
  )
}