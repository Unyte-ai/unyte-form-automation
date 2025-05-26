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
  account_status?: number
  currency?: string
}

interface MetaAdAccountProps {
  accounts?: AdAccount[]
  onChange?: (value: string) => void
  isLoading?: boolean
}

export function MetaAdAccount({ accounts = [], onChange, isLoading = false }: MetaAdAccountProps) {
  const [value, setValue] = React.useState('')

  const handleValueChange = (newValue: string) => {
    setValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  // Helper function to get account status text
  const getAccountStatusText = (status?: number) => {
    switch (status) {
      case 1:
        return 'Active'
      case 2:
        return 'Disabled'
      case 3:
        return 'Unsettled'
      case 7:
        return 'Pending Risk Review'
      case 9:
        return 'Pending Settlement'
      case 100:
        return 'Pending Closure'
      case 101:
        return 'Closed'
      case 201:
        return 'Any Active'
      case 202:
        return 'Any Closed'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor="ad-account">Ad Account</Label>
      <Select 
        value={value} 
        onValueChange={handleValueChange}
        disabled={isLoading}
      >
        <SelectTrigger id="ad-account" className="w-full">
          <SelectValue placeholder={isLoading ? "Loading accounts..." : "Select an ad account"} />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Loading ad accounts...
            </div>
          ) : accounts.length > 0 ? (
            accounts.map(account => (
              <SelectItem key={account.id} value={account.id}>
                <div className="flex flex-col">
                  <span>{account.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ID: {account.id}
                    {account.account_status && ` • Status: ${getAccountStatusText(account.account_status)}`}
                    {account.currency && ` • Currency: ${account.currency}`}
                  </span>
                </div>
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
        Select the Meta ad account you want to use for this campaign
      </p>
    </div>
  )
}