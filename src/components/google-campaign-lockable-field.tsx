'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Pencil, Lock } from 'lucide-react'
import { OriginalValueDisplay } from './google-original-value-display'

interface GoogleCampaignLockableFieldProps {
  label: string
  isLocked: boolean
  onToggleLock: () => void
  disabled?: boolean
  children: React.ReactNode
  originalValue?: string | null
  fieldType?: 'budget-type' | 'budget-amount' | 'date'
  warning?: React.ReactNode
}

export function GoogleCampaignLockableField({
  label,
  isLocked,
  onToggleLock,
  disabled = false,
  children,
  originalValue,
  fieldType,
  warning
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
          title={isLocked ? 'Click to unlock and edit this field' : 'Click to lock this field'}
        >
          {isLocked ? (
            <Lock className="h-3 w-3" />
          ) : (
            <Pencil className="h-3 w-3" />
          )}
        </Button>
      </div>
      {warning && (
        <div className="p-4 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
          {warning}
        </div>
      )}
      {children}
      <OriginalValueDisplay originalValue={originalValue} fieldType={fieldType} />
    </div>
  )
}