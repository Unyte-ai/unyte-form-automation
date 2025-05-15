import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'

export default async function FormDetailPage({
  params,
}: {
  params: Promise<{ orgId: string; formId: string }>
}) {
  // Await the params before using them
  const resolvedParams = await params
  const { orgId, formId } = resolvedParams
  
  // Get the current user and verify authentication
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  
  // If not authenticated, redirect to login
  if (!userData?.user) {
    redirect('/auth/login')
  }
  
  // Check if user belongs to this organization
  const { data: memberData } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization', orgId)
    .eq('user_id', userData.user.id)
    .single()
  
  // If user is not a member of this organization, return 404
  if (!memberData) {
    notFound()
  }

  // Now get the form submission data
  const { data: submission, error } = await supabase
    .from('form_submissions')
    .select('email_subject')
    .eq('id', formId)
    .eq('organization_id', orgId) // Also verify this submission belongs to this org
    .single()

  // If submission doesn't exist or doesn't belong to this org, return 404
  if (error || !submission) {
    notFound()
  }

  // Return a simple page with just the subject as title
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold">{submission.email_subject || 'Untitled Submission'}</h1>
    </div>
  )
}