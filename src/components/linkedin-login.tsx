'use client'

import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function LinkedInLogin() {
  
  function handleLinkedInClick() {
    toast.info('LinkedIn integration', {
      description: 'LinkedIn integration is currently being reimplemented'
    })
  }

  return (
    <div className="flex justify-between items-center">
      <span className="font-medium">LinkedIn</span>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleLinkedInClick}
      >
        Connect
      </Button>
    </div>
  )
}