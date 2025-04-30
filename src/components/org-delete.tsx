'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { deleteOrganization, getNextOrganizationId } from '@/app/actions/organizations'
import { toast } from 'sonner'

interface OrgDeleteProps {
  organizationId: string
  organizationName: string
}

export function OrgDelete({ organizationId, organizationName }: OrgDeleteProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      
      // First, get the next organization ID for navigation
      const nextOrgId = await getNextOrganizationId(organizationId)
      
      // Then delete the current organization
      await deleteOrganization(organizationId)
      
      // Show success message
      toast.success('Organization deleted', {
        description: `"${organizationName}" has been successfully deleted.`
      })
      
      // Close dialog
      setShowDeleteDialog(false)
      
      // Navigate to the next organization or home
      if (nextOrgId) {
        router.push(`/home/${nextOrgId}`)
      } else {
        router.push('/home')
      }
      
    } catch (error) {
      console.error('Error deleting organization:', error)
      toast.error('Failed to delete organization', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            variant="destructive"
            className="cursor-pointer"
          >
            <Trash2 className="mr-2 size-4" />
            Delete organisation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete organisation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {`"${organizationName}"`}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}