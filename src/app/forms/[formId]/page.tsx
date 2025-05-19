// src/app/forms/[formId]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { FormBreadcrumb } from '@/components/form-breadcrumb'
import { FormBody } from '@/components/form-body'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

export default async function FormDetailPage({
  params,
}: {
  params: Promise<{ formId: string }>
}) {
  // Await the params before using them
  const resolvedParams = await params
  const { formId } = resolvedParams
  
  // Get the current user and verify authentication
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  
  // If not authenticated, redirect to login
  if (!userData?.user) {
    redirect('/auth/login')
  }
  
  // First, get the form submission to determine which organization it belongs to
  const { data: submission, error } = await supabase
    .from('form_submissions')
    .select('email_subject, organization_id')
    .eq('id', formId)
    .single()

  // If submission doesn't exist, return 404
  if (error || !submission) {
    notFound()
  }

  // Now check if user belongs to this organization
  const { data: memberData } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization', submission.organization_id)
    .eq('user_id', userData.user.id)
    .single()
  
  // If user is not a member of this organization, return 404
  if (!memberData) {
    notFound()
  }
  
  // Fetch the organization name
  const { data: organization } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', submission.organization_id)
    .single()
  
  const organizationName = organization?.name || 'Organization'
  const formTitle = submission.email_subject || 'Untitled Submission'

  return (
    <>
      <FormBreadcrumb 
        organizationId={submission.organization_id}
        organizationName={organizationName}
        formTitle={formTitle}
      />
      
      <div className="h-[calc(100vh-8rem)]">
        <ResizablePanelGroup 
          direction="horizontal"
          className="min-h-full"
        >
          {/* Left column - Form body */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="p-2 h-full overflow-y-auto">
              <FormBody formId={formId} />
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Right column - Empty for now */}
          <ResizablePanel defaultSize={50} minSize={20}>
            <div className="p-4 h-full overflow-y-auto bg-card/50">
              <p className="text-muted-foreground text-sm">
                Additional information will be displayed here.
              </p>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  )
}