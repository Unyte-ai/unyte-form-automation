'use client'

import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function LeaveOrg() {
  return (
    <Button variant="outline" size="sm">
      <LogOut className="mr-2 size-4" />
      Leave Organisation
    </Button>
  )
}