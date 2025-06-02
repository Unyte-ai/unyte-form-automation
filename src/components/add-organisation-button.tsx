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
import { PlatformTypeSelect, PlatformType } from '@/components/platform-type'
import { GenerateEmail } from '@/components/generate-email'
import { createOrganization } from '@/app/actions/organizations'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function AddOrganisationButton() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [platformType, setPlatformType] = useState<PlatformType | ''>('') 
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async () => {
    if (!platformType || !name || !email) {
      toast.error('Missing information', {
        description: 'Please fill out all fields before continuing.'
      })
      return
    }
    
    try {
      setIsLoading(true)

      // Get the current user's information
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('Could not authenticate user')
      }
      
      // Get the user's display name
      const userName = user.user_metadata?.full_name || user.email || 'Unknown User'
      
      // Create the organization
      await createOrganization({
        name,
        platformType,
        email,
        userId:   user.id,
        userName: userName as string,
        userEmail: user.email!,
      })      

      // Show success message
      toast.success('Organization created', {
        description: 'Your new organization has been created successfully.'
      })
      
      // Reset form and close dialog on success
      setName('')
      setEmail('')
      setPlatformType('')
      setOpen(false)
      
      // Refresh the page to show the new organization
      router.refresh()
    } catch (error) {
      console.error('Error creating organization:', error)
      toast.error('Failed to create organization', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailGenerated = (generatedEmail: string) => {
    setEmail(generatedEmail)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="font-medium">
          Create Your First Organisation
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
                className="pr-[140px]"
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
            <div className="flex justify-between items-center">
              <Label htmlFor="email">Email</Label>
              <GenerateEmail onEmailGenerated={handleEmailGenerated} />
            </div>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Organisation email..." 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Organisation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}