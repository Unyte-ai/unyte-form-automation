'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface TikTokDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TikTokDialog({ open, onOpenChange }: TikTokDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>TikTok Account</DialogTitle>
          <DialogDescription>
            Manage your connected TikTok account settings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-muted-foreground text-sm">
            Your TikTok account is connected.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}