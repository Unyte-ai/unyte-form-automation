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
      variant="outline" 
      size="sm" 
      onClick={onAutoPopulate}
      disabled={disabled}
      className="flex items-center gap-2"
    >
      <Wand2 className="h-4 w-4" />
      Auto-populate
    </Button>
  )
}