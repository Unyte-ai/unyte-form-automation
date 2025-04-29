'use client'

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type PlatformType = 'microsoft-forms' | 'google-forms'

interface PlatformTypeSelectProps {
  value: PlatformType | ''  // Allow empty string for unselected state
  onChange: (value: PlatformType) => void
  className?: string
  compact?: boolean
}

export function PlatformTypeSelect({
  value,
  onChange,
  className,
  compact = false,
}: PlatformTypeSelectProps) {
  return (
    <div className={className}>
      {!compact && (
        <div className="grid gap-2">
          <label htmlFor="platform-type" className="text-sm font-medium">
            Platform Type
          </label>
        </div>
      )}
      <Select
        value={value}
        onValueChange={(value) => onChange(value as PlatformType)}
      >
        <SelectTrigger 
          id="platform-type" 
          className={compact ? "h-7 text-xs border-0 bg-transparent shadow-none px-2" : ""}
        >
          <SelectValue placeholder="Platform Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="microsoft-forms">Microsoft Forms</SelectItem>
          <SelectItem value="google-forms">Google Forms</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}