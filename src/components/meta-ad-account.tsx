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
import { FacebookAdAccount, FacebookPage } from '@/app/actions/facebook-ad-accounts'

interface MetaAdAccountProps {
  accounts?: FacebookAdAccount[]
  pages?: FacebookPage[]
  onChange?: (value: string) => void
  isLoading?: boolean
}

export function MetaAdAccount({ accounts = [], pages = [], onChange, isLoading = false }: MetaAdAccountProps) {
  const [value, setValue] = React.useState('')

  const handleValueChange = (newValue: string) => {
    setValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  const getAccountStatusText = (status?: number) => {
    switch (status) {
      case 1: return 'Active'
      case 2: return 'Disabled'
      case 3: return 'Unsettled'
      case 7: return 'Pending Risk Review'
      case 9: return 'Pending Settlement'
      case 100: return 'Pending Closure'
      case 101: return 'Closed'
      case 201: return 'Any Active'
      case 202: return 'Any Closed'
      default: return 'Unknown'
    }
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor="ad-account">Ad Account</Label>
      <Select value={value} onValueChange={handleValueChange} disabled={isLoading}>
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
      
      {value && pages.length > 0 && (
        <div className="mt-3 p-3 rounded-md bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
            Available Facebook Pages ({pages.length})
          </h4>
          <div className="space-y-1">
            {pages.map(page => (
              <div key={page.id} className="text-xs text-blue-700 dark:text-blue-400">
                <span className="font-medium">{page.name}</span>
                {page.category && (
                  <span className="text-blue-600 dark:text-blue-500 ml-2">• {page.category}</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">
            These pages can be used for lead generation campaigns or other page-based features.
          </p>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        Select the Meta ad account you want to use for this campaign
      </p>
    </div>
  )
}