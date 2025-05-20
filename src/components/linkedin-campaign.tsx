'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { LinkedInAdAccount } from '@/components/linkedin-ad-account'

interface LinkedInCampaignProps {
  id: string
  onRemove: (id: string) => void
}

export function LinkedInCampaign({ id, onRemove }: LinkedInCampaignProps) {
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
        <CardTitle>LinkedIn</CardTitle>
        <CardDescription>Create a campaign for LinkedIn</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <LinkedInAdAccount accounts={[]} />
      </CardContent>
    </Card>
  )
}