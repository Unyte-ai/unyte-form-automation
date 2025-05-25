'use client'

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface MetaCampaignProps {
  id: string
  onRemove: (id: string) => void
  organizationId: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function MetaCampaign({ id, onRemove, organizationId }: MetaCampaignProps) {
  return (
    <Card className="mb-4 relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2 h-6 w-6" 
        onClick={() => onRemove(id)}
      >
        <X className="h-4 w-4" />
      </Button>
      <CardHeader>
        <CardTitle>Meta</CardTitle>
        <CardDescription>Create a campaign for Meta</CardDescription>
      </CardHeader>
    </Card>
  )
}