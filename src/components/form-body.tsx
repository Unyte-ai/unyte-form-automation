import { createClient } from '@/lib/supabase/server'

interface FormBodyProps {
  formId: string
}

export async function FormBody({ formId }: FormBodyProps) {
  const supabase = await createClient()
  
  // Fetch the form submission body
  const { data, error } = await supabase
    .from('form_submissions')
    .select('email_body')
    .eq('id', formId)
    .single()
  
  if (error || !data) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800/30 dark:bg-amber-800/10 dark:text-amber-500">
        <p>Failed to load form content.</p>
      </div>
    )
  }
  
  // If email body is empty
  if (!data.email_body || data.email_body.trim() === '') {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-muted-foreground">
        <p>This form submission has no content.</p>
      </div>
    )
  }

  return (
    <div className="mt-6 rounded-lg border border-border bg-card p-6">
      {/* Use pre tag to preserve formatting, wrapped in a div for styling */}
      <div className="max-h-[600px] overflow-y-auto">
        <pre className="text-sm whitespace-pre-wrap break-words font-normal">
          {data.email_body}
        </pre>
      </div>
    </div>
  )
}