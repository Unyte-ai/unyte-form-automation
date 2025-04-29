'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { AddOrganisationDialog } from '@/components/add-organisation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Organization = {
  id: string
  name: string
  platform_type: string
  org_email: string
  is_active: boolean
}

export function OrganisationSwitch() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch organizations on component mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()
        
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .order('created_at', { ascending: false })
          
        if (error) throw error
        
        setOrganizations(data || [])
        
        // If we have organizations and none selected, select the first one
        if (data && data.length > 0 && !value) {
          setValue(data[0].id)
        }
      } catch (error) {
        console.error('Error fetching organizations:', error)
        toast.error('Failed to load organizations')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchOrganizations()
  }, [value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
          disabled={isLoading}
        >
          {isLoading ? (
            "Loading organizations..."
          ) : value ? (
            organizations.find((org) => org.id === value)?.name || 'Select Organisation'
          ) : (
            'Select Organisation'
          )}
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search Organisations..." />
          <CommandList>
            <CommandEmpty>No Organisations found.</CommandEmpty>
            <CommandGroup>
              {organizations.map((org) => (
                <CommandItem
                  key={org.id}
                  value={org.id}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? '' : currentValue)
                    setOpen(false)
                  }}
                >
                  {org.name}
                  <Check
                    className={cn(
                      "ml-auto size-4",
                      value === org.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            
            <CommandSeparator />
            
            {/* Add Organisation Dialog */}
            <div className="p-1">
              <AddOrganisationDialog />
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}