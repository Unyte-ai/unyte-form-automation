import { ManageOrgTeam } from '@/components/manage-org-team'
import { getOrganizationMembers } from '@/app/actions/members'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface OrgTeamProps {
  organizationId: string
}

export async function OrgTeam({ organizationId }: OrgTeamProps) {
  // Fetch members and handle potential errors
  let members = [];
  let error = null;
  
  try {
    members = await getOrganizationMembers(organizationId);
  } catch (err) {
    console.error("Error loading team members:", err);
    error = err;
  }
  
  // Generate initials from user name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="rounded-lg border p-6 bg-card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Team</h2>
        <ManageOrgTeam />
      </div>
      
      {error ? (
        <div className="text-sm text-amber-500">
          Unable to load team members. Please try again later.
        </div>
      ) : members.length === 0 ? (
        <div className="text-muted-foreground">
          No team members found.
        </div>
      ) : (
        <div className="space-y-4">
          {members.map(member => (
            <div key={member.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getInitials(member.user_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{member.user_name}</p>
                  <p className="text-muted-foreground text-xs">{member.user_email}</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                  {member.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}