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

interface GoogleSubAccount {
  id: string
  name: string
  resourceName: string
  testAccount?: boolean
  currency?: string
  timeZone?: string
  status?: string
}

interface GoogleSubAccountsProps {
  subAccounts?: GoogleSubAccount[]
  onChange?: (value: string) => void
  isLoading?: boolean
  managerAccountName?: string
}

export function GoogleSubAccounts({ 
  subAccounts = [], 
  onChange, 
  isLoading = false,
  managerAccountName
}: GoogleSubAccountsProps) {
  const [value, setValue] = React.useState('')

  const handleValueChange = (newValue: string) => {
    setValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  return (
    <div className="grid gap-2 mt-4">
      <Label htmlFor="google-sub-account">
        Select Sub-Account
        {managerAccountName && (
          <span className="text-muted-foreground ml-1">
            (managed by {managerAccountName})
          </span>
        )}
      </Label>
      <Select 
        value={value} 
        onValueChange={handleValueChange}
        disabled={isLoading}
      >
        <SelectTrigger id="google-sub-account" className="w-full">
          <SelectValue 
            placeholder={isLoading ? "Loading sub-accounts..." : "Select a sub-account to use for campaigns"} 
          />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Loading sub-accounts...
            </div>
          ) : subAccounts.length > 0 ? (
            subAccounts.map(account => (
              <SelectItem key={account.id} value={account.id}>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span>{account.name}</span>
                    {account.testAccount && (
                      <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded dark:bg-orange-900/30 dark:text-orange-400">
                        Test
                      </span>
                    )}
                    {account.status && account.status !== 'ENABLED' && (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded dark:bg-gray-800 dark:text-gray-400">
                        {account.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>ID: {account.id}</span>
                    {account.currency && <span>• {account.currency}</span>}
                    {account.timeZone && <span>• {account.timeZone}</span>}
                  </div>
                </div>
              </SelectItem>
            ))
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No sub-accounts found for this manager account
            </div>
          )}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        This manager account manages {subAccounts.length} account{subAccounts.length !== 1 ? 's' : ''}. 
        Select the specific account to use for campaign creation.
      </p>
    </div>
  )
}