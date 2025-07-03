'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FacebookAdAccount, FacebookPage } from '@/app/actions/facebook-ad-accounts'
import { getFacebookPageFollowers, PageFollowers } from '@/app/actions/facebook-page-followers'

interface MetaAdAccountProps {
  accounts?: FacebookAdAccount[]
  pages?: FacebookPage[]
  onChange?: (value: string) => void
  isLoading?: boolean
  organizationId?: string
}

export function MetaAdAccount({ accounts = [], pages = [], onChange, isLoading = false, organizationId }: MetaAdAccountProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState('')
  const [pageFollowers, setPageFollowers] = React.useState<PageFollowers[]>([])
  const [loadingFollowers, setLoadingFollowers] = React.useState(false)

  const handleSelect = (accountId: string) => {
    const newValue = value === accountId ? '' : accountId
    setValue(newValue)
    setOpen(false)
    
    if (onChange) {
      onChange(newValue)
    }
    
    // Fetch followers when account is selected
    if (newValue && pages.length > 0 && organizationId) {
      fetchFollowers()
    }
  }

  const fetchFollowers = async () => {
    if (!organizationId || pages.length === 0) return
    
    setLoadingFollowers(true)
    try {
      const result = await getFacebookPageFollowers(
        organizationId,
        pages.map(page => page.id)
      )
      if (result.success) {
        setPageFollowers(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch followers:', error)
    } finally {
      setLoadingFollowers(false)
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

  // Find the selected account for display
  const selectedAccount = accounts.find(account => account.id === value)

  return (
    <div className="grid gap-2">
      <Label htmlFor="ad-account">Ad Account</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={isLoading}
          >
            {isLoading ? (
              "Loading accounts..."
            ) : selectedAccount ? (
              <div className="flex flex-col items-start">
                <span className="font-medium">{selectedAccount.name}</span>
                <span className="text-xs text-muted-foreground">
                  ID: {selectedAccount.id}
                </span>
              </div>
            ) : (
              "Select an ad account"
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search ad accounts..." 
              disabled={isLoading}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Loading accounts..." : "No ad accounts found."}
              </CommandEmpty>
              {!isLoading && accounts.map((account) => (
                <CommandItem
                  key={account.id}
                  value={`${account.name} ${account.id}`}
                  onSelect={() => handleSelect(account.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === account.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{account.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ID: {account.id}
                      {account.account_status && ` • Status: ${getAccountStatusText(account.account_status)}`}
                      {account.currency && ` • Currency: ${account.currency}`}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {value && (
        <div className="mt-3 p-3 rounded-md bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
            Connected Facebook Pages ({pages.length})
          </h4>
          {loadingFollowers ? (
            <div className="text-xs text-blue-700 dark:text-blue-400">
              Loading follower counts...
            </div>
          ) : (
            <div className="space-y-1">
              {pageFollowers.map(page => (
                <div key={page.pageId} className="text-xs text-blue-700 dark:text-blue-400">
                  <span className="font-medium">{page.pageName}</span>
                  <span className="text-blue-600 dark:text-blue-500 ml-2">
                    • {page.followers !== null ? `${page.followers.toLocaleString()} followers` : 'Followers: N/A'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        Select the Meta ad account you want to use for this campaign
      </p>
    </div>
  )
}