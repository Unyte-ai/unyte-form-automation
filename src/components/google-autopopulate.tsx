'use client'

import { Button } from '@/components/ui/button'
import { Wand2 } from 'lucide-react'

interface GoogleAutoPopulateButtonProps {
  onClick?: () => void
  disabled?: boolean
}

export function GoogleAutoPopulateButton({ onClick, disabled = false }: GoogleAutoPopulateButtonProps) {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2"
    >
      <Wand2 className="h-4 w-4" />
      Auto-populate
    </Button>
  )
}