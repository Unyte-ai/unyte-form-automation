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
  email_body: string;
  structured_data: StructuredData;
}

interface FormBodyProps {
  formId: string
}

export async function FormBody({ formId }: FormBodyProps) {
  const supabase = await createClient()
  
  // Fetch the form submission data
  const { data, error } = await supabase
    .from('form_submissions')
    .select('email_body, structured_data')
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
  
  // Check if we have structured data
  const hasStructuredData = submission.structured_data?.formData?.length > 0;
  
  // If no content at all
  if (!submission.email_body && !hasStructuredData) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-muted-foreground">
        <p>This form submission has no content.</p>
      </div>
    )
  }

  // If we have structured data, display it in a table
  if (hasStructuredData) {
    return (
      <div className="mt-6 rounded-lg border border-border bg-card p-6">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-semibold">Question</th>
              <th className="text-left py-3 px-4 font-semibold">Answer</th>
            </tr>
          </thead>
          <tbody>
            {submission.structured_data.formData.map((item: FormQuestion, i: number) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-3 px-4 align-top">{item.question}</td>
                <td className="py-3 px-4 align-top">{item.answer || 'No answer'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  
  // Fallback to displaying the raw email body
  return (
    <div className="mt-6 rounded-lg border border-border bg-card p-6">
      <div className="max-h-[600px] overflow-y-auto">
        <pre className="text-sm whitespace-pre-wrap break-words font-normal">
          {submission.email_body}
        </pre>
      </div>
    </div>
  )
}