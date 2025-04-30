import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ orgId: string }> | { orgId: string };
}) {
  // Await params to get the actual orgId
  const resolvedParams = 'then' in params ? await params : params;
  const orgId = resolvedParams.orgId;
  
  const supabase = await createClient();
  
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
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Organization header */}
          <div className="rounded-lg border p-6 bg-card">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">{organization.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{organization.org_email}</span>
                <span>•</span>
                <span className="capitalize">{organization.platform_type} Form</span>
              </div>
            </div>
          </div>
          
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
          {/* Platforms - placeholder for now */}
          <div className="rounded-lg border p-6 bg-card">
            <h2 className="text-xl font-semibold mb-4">Platforms</h2>
            <div className="text-muted-foreground">
              Platform integrations will appear here.
            </div>
          </div>
          
          {/* Team members - placeholder for now */}
          <div className="rounded-lg border p-6 bg-card">
            <h2 className="text-xl font-semibold mb-4">Team</h2>
            <div className="text-muted-foreground">
              Team members will appear here.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}