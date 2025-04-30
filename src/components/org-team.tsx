import { ManageOrgTeam } from '@/components/manage-org-team'

export function OrgTeam() {
  return (
    <div className="rounded-lg border p-6 bg-card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Team</h2>
        <ManageOrgTeam />
      </div>
      <div className="text-muted-foreground">
        Team members will appear here.
      </div>
    </div>
  )
}