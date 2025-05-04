'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { completeInviteSetup } from '@/app/actions/complete-invite-setup'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function InviteSetupForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.email) {
        setEmail(user.email)
        // Pre-fill the name if available
        if (user.user_metadata?.full_name) {
          setFullName(user.user_metadata.full_name)
        }
      }
    }
    
    getUser()
  }, [])

  const handleFinishSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!fullName || !password) {
      toast.error('Please fill in all required fields')
      return
    }
    
    setIsLoading(true)
    
    try {
      await completeInviteSetup(fullName, password)
      
      toast.success('Account setup completed successfully')
      
      // Redirect to home page
      router.push('/home')
    } catch (error) {
      console.error('Error completing setup:', error)
      toast.error('Failed to complete setup. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Account</CardTitle>
          <CardDescription>You&apos;re almost there! Just a few details to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFinishSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  readOnly
                  className="bg-muted cursor-not-allowed"
                  autoComplete="email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Setting up...' : 'Finish Sign Up'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}