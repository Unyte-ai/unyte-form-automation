'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface GenerateEmailProps {
  onClick?: () => void
  className?: string
}

export function GenerateEmail({ onClick, className }: GenerateEmailProps) {
  return (
    <button
      className={cn(
        "text-sm font-medium underline underline-offset-4 text-primary p-0 bg-transparent border-none cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      Generate email
    </button>
  )
}