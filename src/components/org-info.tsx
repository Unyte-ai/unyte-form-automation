import { OrgDelete } from './org-delete'

interface Organization {
  id: string;
  name: string;
  platform_type: string;
  org_email: string;
  is_active: boolean;
}

interface OrgInfoProps {
  organization: Organization;
  userRole: string;
}

export function OrgInfo({ organization, userRole }: OrgInfoProps) {
  // Format platform type directly (convert hyphens to spaces and capitalize words)
  const formattedPlatformType = organization.platform_type
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="rounded-lg border p-6 bg-card">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">{organization.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{organization.org_email}</span>
            <span>•</span>
            <span>{formattedPlatformType}</span>
          </div>
        </div>
        {userRole === 'owner' && (
          <OrgDelete organizationId={organization.id} organizationName={organization.name} />
        )}
      </div>
    </div>
  );
}