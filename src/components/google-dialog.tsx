'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface GoogleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GoogleDialog({ open, onOpenChange }: GoogleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Google Account</DialogTitle>
          <DialogDescription>
            Manage your connected Google account settings.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground text-sm">
            Your Google account is connected.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}