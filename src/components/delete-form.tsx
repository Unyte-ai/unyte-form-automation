'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { deleteFormSubmission } from '@/app/actions/forms'
import { toast } from 'sonner'
import { useParams } from 'next/navigation'

interface DeleteFormProps {
  id: string
  title: string
}

export function DeleteForm({ id, title }: DeleteFormProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const params = useParams()
  const organizationId = params.orgId as string

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      
      // Call the server action to delete the form
      const result = await deleteFormSubmission(id, organizationId)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete form')
      }
      
      // Show success message
      toast.success('Form deleted', {
        description: `"${title}" has been successfully deleted.`
      })
      
      // Close dialog
      setShowDeleteDialog(false)
      
    } catch (error) {
      console.error('Error deleting form:', error)
      toast.error('Failed to delete form', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => {
          e.stopPropagation() // Prevent triggering parent click events
          setShowDeleteDialog(true)
        }}
      >
        <Trash2 className="size-4" />
        <span className="sr-only">Delete form</span>
      </Button>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete form</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{title}&quot;? This action cannot be undone.
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