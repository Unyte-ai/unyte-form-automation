'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function CreateCampaign() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <Plus className="size-4" />
          Create Campaign
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="cursor-pointer">
          Google
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          Meta
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          TikTok
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          LinkedIn
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}