'use client'

import * as React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inviteUserToOrganization } from '@/app/actions/members'
import { toast } from 'sonner'
import { useParams } from 'next/navigation'

interface AddOrgUserProps {
  organizationId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddOrgUser({ organizationId, open, onOpenChange }: AddOrgUserProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const params = useParams()
  
  // Get organization ID from props or URL params
  const orgId = organizationId || (params?.orgId as string)

  const handleInvite = async () => {
    if (!email) {
      toast.error('Please enter an email address')
      return
    }
    
    if (!orgId) {
      toast.error('Organization ID is missing')
      return
    }
    
    try {
      setIsLoading(true)
      
      // Call the server action to invite the user
      await inviteUserToOrganization(orgId, email)
      
      // Show success message
      toast.success('Invitation sent', {
        description: `${email} has been invited to the organization.`
      })
      
      // Reset form and close dialog
      setEmail('')
      onOpenChange(false)
      
    } catch (error) {
      console.error('Error inviting user:', error)
      toast.error('Failed to invite user', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Enter the email of the person you want to invite to your organization.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="colleague@example.com" 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleInvite} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Invite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}