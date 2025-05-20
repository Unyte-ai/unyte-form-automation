'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface LinkedInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LinkedInDialog({ open, onOpenChange }: LinkedInDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>LinkedIn Account</DialogTitle>
          <DialogDescription>
            LinkedIn integration is being updated.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-muted-foreground text-sm">
            The LinkedIn integration is currently being reimplemented to provide 
            enhanced functionality and access to the LinkedIn Marketing API.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}