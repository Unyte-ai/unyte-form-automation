import { ManageOrgTeam } from '@/components/manage-org-team'
import { ManageOrgMember } from '@/components/manage-org-member'
import { getOrganizationMembers } from '@/app/actions/members'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LeaveOrg } from '@/components/leave-org'

interface OrgTeamProps {
  organizationId: string
  userRole: string
}

export async function OrgTeam({ organizationId, userRole }: OrgTeamProps) {
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
    if (!name) return '??';
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
        {userRole === 'owner' ? (
          <ManageOrgTeam organizationId={organizationId} />
        ) : (
          <LeaveOrg />
        )}
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
            <div 
              key={member.id} 
              className="group flex items-center justify-between py-2 rounded-md hover:bg-accent/50 transition-colors duration-200"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getInitials(member.user_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{member.user_name || 'Pending User'}</p>
                  <p className="text-muted-foreground text-xs">{member.user_email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Show owner badge always, member badge only when not pending */}
                {(member.role === 'owner' || (member.role === 'member' && member.invitation_status !== 'pending')) && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    member.role === 'owner' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-200' 
                      : 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-200'
                  }`}>
                    {member.role}
                  </span>
                )}
                {member.invitation_status === 'pending' && (
                  <span className="ml-2 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-800/30 dark:text-amber-200">
                    Pending
                  </span>
                )}
                <div className={`${userRole === 'owner' && member.role !== 'owner' ? 'opacity-0 group-hover:opacity-100 w-0 group-hover:w-auto' : 'invisible w-0'} transition-all duration-700 ease-[cubic-bezier(0.2,0.0,0.1,1.0)]`}>
                  <ManageOrgMember 
                    memberId={member.id}
                    memberName={member.user_name || member.user_email}
                    organizationId={organizationId}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}