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

interface AdAccount {
  id: string
  name: string
}

interface LinkedInAdAccountProps {
  accounts?: AdAccount[]
  onChange?: (value: string) => void
}

export function LinkedInAdAccount({ accounts = [], onChange }: LinkedInAdAccountProps) {
  const [value, setValue] = React.useState('')

  const handleValueChange = (newValue: string) => {
    setValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor="ad-account">Ad Account</Label>
      <Select 
        value={value} 
        onValueChange={handleValueChange}
      >
        <SelectTrigger id="ad-account" className="w-full">
          <SelectValue placeholder="Select an ad account" />
        </SelectTrigger>
        <SelectContent>
          {accounts.length > 0 ? (
            accounts.map(account => (
              <SelectItem key={account.id} value={account.id}>
                {account.name} <span className="text-xs text-muted-foreground ml-1">({account.id})</span>
              </SelectItem>
            ))
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No ad accounts available
            </div>
          )}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Select the LinkedIn ad account you want to use for this campaign
      </p>
    </div>
  )
}