'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Pencil, Lock } from 'lucide-react'

interface GoogleCampaignLockableFieldProps {
  label: string
  isLocked: boolean
  onToggleLock: () => void
  disabled?: boolean
  children: React.ReactNode
}

export function GoogleCampaignLockableField({
  label,
  isLocked,
  onToggleLock,
  disabled = false,
  children
}: GoogleCampaignLockableFieldProps) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggleLock}
          disabled={disabled}
          className="h-6 w-6 p-0"
        >
          {isLocked ? (
            <Lock className="h-3 w-3" />
          ) : (
            <Pencil className="h-3 w-3" />
          )}
        </Button>
      </div>
      {children}
    </div>
  )
}