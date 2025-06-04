'use client'

import { Button } from '@/components/ui/button'
import { Wand2 } from 'lucide-react'

interface MetaAutoPopulateButtonProps {
  onAutoPopulate?: () => void
  disabled?: boolean
}

export function MetaAutoPopulateButton({ onAutoPopulate, disabled = false }: MetaAutoPopulateButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onAutoPopulate}
      disabled={disabled || !onAutoPopulate}
      className="h-8 px-3"
    >
      <Wand2 className="mr-1 size-3" />
      Auto-populate
    </Button>
  )
}