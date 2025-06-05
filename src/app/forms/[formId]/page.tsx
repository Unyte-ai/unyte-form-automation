import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { FormBreadcrumb } from '@/components/form-breadcrumb'
import { FormBody } from '@/components/form-body'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { CreateCampaign } from '@/components/create-campaign'
import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

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
      {/* Header with breadcrumbs and logo */}
      <div className="flex items-center justify-between mb-6">
        <FormBreadcrumb 
          organizationId={typedSubmission.organization_id}
          organizationName={organizationName}
          formTitle={formTitle}
        />
        <Link href={`/home/${typedSubmission.organization_id}`} className="cursor-pointer transition-all duration-200 hover:opacity-80 hover:scale-105">
          <Image
            src="/Unyte-Logo.png"
            alt="Unyte Logo"
            height={40}
            width={134}
            className="h-10 w-auto"
            priority
          />
        </Link>
      </div>
      
      <div className="h-[calc(100vh+10rem)] bg-neutral-100">
        <ResizablePanelGroup 
          direction="horizontal"
          className="min-h-full rounded-t-lg border-t border-l border-r overflow-hidden pb-64"
        >
          {/* Left column - Form body */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="p-5 h-full overflow-y-auto bg-white">
              <FormBody formId={formId} />
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Right column - Campaign creation */}
          <ResizablePanel defaultSize={50} minSize={20}>
            <div className="p-5 h-full overflow-y-auto bg-white">
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