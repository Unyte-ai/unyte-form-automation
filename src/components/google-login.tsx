'use client'

import { Button } from '@/components/ui/button'

export function GoogleLogin() {
  return (
    <div className="flex justify-between items-center">
      <span className="font-medium">Google</span>
      <Button 
        variant="outline" 
        size="sm" 
      >
        Connect
      </Button>
    </div>
  )
}