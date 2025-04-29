'use client'

import * as React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import { PlatformTypeSelect, PlatformType } from '@/components/platform-type'

export function AddOrganisationDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [platformType, setPlatformType] = useState<PlatformType | ''>('') // Initialize with empty string

  const handleSubmit = () => {
    // Make sure platform type is selected before submission
    if (!platformType) {
      // Show error or handle empty platform type
      return
    }
    
    // Rest of submission logic
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start text-sm font-normal">
          <Plus className="mr-2 size-4" />
          Add Organisation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Organisation</DialogTitle>
          <DialogDescription>
            Create a new organisation to manage campaigns.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <div className="relative">
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Organisation name" 
                className="pr-[140px]" // Add enough padding to accommodate the platform select
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <PlatformTypeSelect
                  value={platformType}
                  onChange={(value) => setPlatformType(value)}
                  compact={true}
                />
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="contact@example.com" 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            Create Organisation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}