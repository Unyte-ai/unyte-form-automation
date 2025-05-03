'use client'

import { Button } from '@/components/ui/button'
import { Plus, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'
import { AddOrgUser } from '@/components/add-org-user'

interface ManageOrgTeamProps {
  organizationId?: string
}

export function ManageOrgTeam({ organizationId }: ManageOrgTeamProps) {
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="size-4" />
            <span className="sr-only">Team options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            className="cursor-pointer"
            onClick={() => setShowAddUserDialog(true)}
          >
            <Plus className="mr-2 size-4" />
            Add member
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <AddOrgUser 
        organizationId={organizationId} 
        open={showAddUserDialog} 
        onOpenChange={setShowAddUserDialog} 
      />
    </>
  )
}