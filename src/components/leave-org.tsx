'use client'

import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useState } from 'react'
import { leaveOrganization } from '@/app/actions/members'
import { getNextOrganizationId } from '@/app/actions/organizations'
import { toast } from 'sonner'
import { useRouter, useParams } from 'next/navigation'

export function LeaveOrg() {
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const router = useRouter()
  const params = useParams()
  const organizationId = params?.orgId as string

  const handleLeave = async () => {
    try {
      setIsLeaving(true)
      
      // Get next organization ID before leaving
      const nextOrgId = await getNextOrganizationId(organizationId)
      
      // Leave the organization
      await leaveOrganization(organizationId)
      
      toast.success('Successfully left the organization')
      
      // Navigate to next organization or home
      if (nextOrgId) {
        router.push(`/home/${nextOrgId}`)
      } else {
        router.push('/home')
      }
      
    } catch (error) {
      console.error('Error leaving organization:', error)
      toast.error('Failed to leave organization', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setIsLeaving(false)
      setShowLeaveDialog(false)
    }
  }

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setShowLeaveDialog(true)}
      >
        <LogOut className="mr-2 size-4" />
        Leave Organisation
      </Button>

      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave organisation</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this organization? You will need to be re-invited to join again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setShowLeaveDialog(false)}
              disabled={isLeaving}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleLeave}
              disabled={isLeaving}
            >
              {isLeaving ? 'Leaving...' : 'Leave'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}