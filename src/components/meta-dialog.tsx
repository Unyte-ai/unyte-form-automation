// src/components/meta-dialog.tsx
'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface MetaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MetaDialog({ open, onOpenChange }: MetaDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Meta Account</DialogTitle>
          <DialogDescription>
            Manage your connected Meta account settings.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground text-sm">
            Your Meta account is connected.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}