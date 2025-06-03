import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { FormBreadcrumb } from '@/components/form-breadcrumb'
import { FormBody } from '@/components/form-body'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { CreateCampaign } from '@/components/create-campaign'
import { Metadata } from 'next'

// Define interfaces for form data
interface FormQuestion {
  question: string;
  answer: string;
}

interface StructuredData {
  rawText: string;
  formData: FormQuestion[];
}

interface FormSubmission {
  email_subject: string;
  organization_id: string;
  structured_data: StructuredData;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ formId: string }>
}): Promise<Metadata> {
  // Await the params before using them
  const { formId } = await params
  
  const supabase = await createClient()
  
  // Get the form submission and organization data for metadata
  const { data: submission } = await supabase
    .from('form_submissions')
    .select('email_subject, organization_id')
    .eq('id', formId)
    .single()

  if (!submission) {
    return {
      title: 'Form Not Found',
      description: 'The requested form could not be found',
    }
  }

  // Fetch the organization name
  const { data: organization } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', submission.organization_id)
    .single()
  
  const organizationName = organization?.name || 'Organization'
  const formTitle = submission.email_subject || 'Untitled Submission'
  
  return {
    title: `${formTitle} - ${organizationName}`,
    description: `View and manage the "${formTitle}" form submission for ${organizationName}`,
  }
}

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
  
  // Fetch the form submission with structured_data - now we get all the data we need
  const { data: submission, error } = await supabase
    .from('form_submissions')
    .select('email_subject, organization_id, structured_data')
    .eq('id', formId)
    .single()

  // If submission doesn't exist, return 404
  if (error || !submission) {
    notFound()
  }

  // Type the submission data
  const typedSubmission = submission as FormSubmission

  // Now check if user belongs to this organization
  const { data: memberData } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization', typedSubmission.organization_id)
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
    .eq('id', typedSubmission.organization_id)
    .single()
  
  const organizationName = organization?.name || 'Organization'
  const formTitle = typedSubmission.email_subject || 'Untitled Submission'

  return (
    <>
      <FormBreadcrumb 
        organizationId={typedSubmission.organization_id}
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
          
          {/* Right column - Campaign creation */}
          <ResizablePanel defaultSize={50} minSize={20}>
            <div className="p-4 h-full overflow-y-auto bg-card/50">
              <CreateCampaign 
                organizationId={typedSubmission.organization_id}
                formData={typedSubmission.structured_data}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  )
}