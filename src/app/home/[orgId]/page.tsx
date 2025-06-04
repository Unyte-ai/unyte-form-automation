import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { OrgInfo } from '@/components/org-info';
import { SocialPlatforms } from '@/components/social-platforms';
import { OrgTeam } from '@/components/org-team';
import { Forms } from '@/components/forms';
import { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgId: string }>;
}): Promise<Metadata> {
  // Await the params before accessing properties
  const { orgId } = await params;
  
  const supabase = await createClient();
  
  // Fetch organization data for metadata
  const { data: organization } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single();
  
  const organizationName = organization?.name || 'Organization';
  
  return {
    title: organizationName,
    description: `Dashboard for ${organizationName} - manage forms, campaigns, and team members`,
  };
}

export default async function OrganizationPage({
    params,
  }: {
    params: Promise<{ orgId: string }>;
  }) {
    // Correctly await the params before accessing properties
    const { orgId } = await params;
    
    const supabase = await createClient();
    
    // Get current user
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    
    // Fetch organization data
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();
    
    // If organization doesn't exist, return 404
    if (error || !organization) {
      notFound();
    }
    
    // Fetch user's role in this organization
    const { data: memberData } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization', orgId)
      .eq('user_id', user?.id)
      .single()
    
    const userRole = memberData?.role || 'member'
  
  return (
    <div className="container mx-auto px-4 py-6 bg-neutral-100">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Organization header */}
          <OrgInfo organization={organization} userRole={userRole} />
          
          {/* Forms list */}
          <Forms organizationId={orgId} />
        </div>
        
        {/* Right column */}
        <div className="space-y-6">
          {/* Platforms */}
          <SocialPlatforms />
          
          {/* Team members */}
          <OrgTeam organizationId={orgId} userRole={userRole} />
        </div>
      </div>
    </div>
  );
}