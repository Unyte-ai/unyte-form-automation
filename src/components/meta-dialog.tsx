'use client'

interface MetaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDisconnect?: () => Promise<void>
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function MetaDialog({ open, onOpenChange, onDisconnect }: MetaDialogProps) {
  return null
}