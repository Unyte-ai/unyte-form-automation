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
import { useRouter, usePathname } from 'next/navigation'

type Organization = {
  id: string
  name: string
  platform_type: string
  org_email: string
  is_active: boolean
}

export function OrganisationSwitch() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null)

  // Extract current org ID from pathname if available
  useEffect(() => {
    const pathParts = pathname.split('/')
    if (pathParts.length >= 3 && pathParts[1] === 'home') {
      setCurrentOrgId(pathParts[2])
    }
  }, [pathname])

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
        
      } catch (error) {
        console.error('Error fetching organizations:', error)
        toast.error('Failed to load organizations')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchOrganizations()
  }, [])

  const handleOrgSelect = (orgId: string) => {
    if (orgId !== currentOrgId) {
      router.push(`/home/${orgId}`)
      setOpen(false)
    }
  }

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
          ) : currentOrgId ? (
            organizations.find((org) => org.id === currentOrgId)?.name || 'Select Organisation'
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
                  onSelect={() => handleOrgSelect(org.id)}
                >
                  {org.name}
                  <Check
                    className={cn(
                      "ml-auto size-4",
                      currentOrgId === org.id ? "opacity-100" : "opacity-0"
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