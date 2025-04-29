'use client'

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export type PlatformType = 'microsoft-forms' | 'google-forms'

interface PlatformTypeSelectProps {
  value: PlatformType
  onChange: (value: PlatformType) => void
  className?: string
}

export function PlatformTypeSelect({
  value,
  onChange,
  className,
}: PlatformTypeSelectProps) {
  return (
    <div className={className}>
      <div className="grid gap-2">
        <Label htmlFor="platform-type">Platform Type</Label>
        <Select
          value={value}
          onValueChange={(value) => onChange(value as PlatformType)}
        >
          <SelectTrigger id="platform-type">
            <SelectValue placeholder="Select platform type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="microsoft-forms">Microsoft Forms</SelectItem>
            <SelectItem value="google-forms">Google Forms</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}