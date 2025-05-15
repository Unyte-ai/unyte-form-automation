import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

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
    <div className="container mx-auto px-4 py-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/home/${submission.organization_id}`}>{organizationName}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>{formTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <h1 className="text-2xl font-bold">{formTitle}</h1>
    </div>
  )
}