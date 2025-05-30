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

interface GoogleAdAccount {
  id: string
  name: string
  resourceName: string
  isManager?: boolean
  testAccount?: boolean
  currency?: string
  timeZone?: string
}

interface GoogleAdAccountProps {
  accounts?: GoogleAdAccount[]
  onChange?: (value: string) => void
  isLoading?: boolean
}

export function GoogleAdAccount({ 
  accounts = [], 
  onChange, 
  isLoading = false 
}: GoogleAdAccountProps) {
  const [value, setValue] = React.useState('')

  const handleValueChange = (newValue: string) => {
    setValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor="google-ad-account">Google Ad Account</Label>
      <Select 
        value={value} 
        onValueChange={handleValueChange}
        disabled={isLoading}
      >
        <SelectTrigger id="google-ad-account" className="w-full">
          <SelectValue 
            placeholder={isLoading ? "Loading accounts..." : "Select a Google ad account"} 
          />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Loading Google ad accounts...
            </div>
          ) : accounts.length > 0 ? (
            accounts.map(account => (
              <SelectItem key={account.id} value={account.id}>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span>{account.name}</span>
                    {account.isManager && (
                      <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded dark:bg-blue-900/30 dark:text-blue-400">
                        Manager
                      </span>
                    )}
                    {account.testAccount && (
                      <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded dark:bg-orange-900/30 dark:text-orange-400">
                        Test
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
              No Google ad accounts available
            </div>
          )}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Select the Google Ads account you want to use for this campaign
      </p>
    </div>
  )
}