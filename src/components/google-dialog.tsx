'use client'

interface GoogleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDisconnect?: () => Promise<void>
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function GoogleDialog({ open, onOpenChange }: GoogleDialogProps) {
  return null
}