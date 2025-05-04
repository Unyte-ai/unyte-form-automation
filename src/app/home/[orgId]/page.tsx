import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { OrgInfo } from '@/components/org-info';
import { SocialPlatforms } from '@/components/social-platforms';
import { OrgTeam } from '@/components/org-team';

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
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Organization header */}
          <OrgInfo organization={organization} userRole={userRole} />
          
          {/* Forms list - placeholder for now */}
          <div className="rounded-lg border p-6 bg-card">
            <h2 className="text-xl font-semibold mb-4">Forms</h2>
            <div className="text-muted-foreground">
              No forms available yet.
            </div>
          </div>
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