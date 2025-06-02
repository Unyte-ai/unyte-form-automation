'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { acceptOrganizationInvitation } from '@/app/actions/members'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Accept Invitation',
  description: 'Accept your organization invitation',
}

function InvitationProcessor() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  const organizationId = searchParams.get('organization')
  const memberId = searchParams.get('member')

  // Memoize the processInvitation function with useCallback
  const processInvitation = useCallback(async () => {
    try {
      if (!organizationId || !memberId) {
        throw new Error('Invalid invitation link. Missing required parameters.')
      }
      
      // Process the invitation acceptance
      await acceptOrganizationInvitation(organizationId, memberId)
      
      toast.success('Invitation accepted', {
        description: 'You have successfully joined the organization.'
      })
      
      // Redirect to the organization page
      router.push(`/home/${organizationId}`)
    } catch (error) {
      console.error('Error processing invitation:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while processing the invitation.')
      setIsProcessing(false)
    }
  }, [organizationId, memberId, router])

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.getUser()
        
        if (error || !data?.user) {
          setIsLoggedIn(false)
          setIsProcessing(false)
        } else {
          setIsLoggedIn(true)
          processInvitation()
        }
      } catch (error) {
        console.error('Error checking login status:', error)
        setError('Failed to check login status')
        setIsProcessing(false)
      }
    }

    if (organizationId && memberId) {
      checkLoginStatus()
    } else {
      setError('Invalid invitation link. Missing required parameters.')
      setIsProcessing(false)
    }
  }, [organizationId, memberId, processInvitation])

  const handleLogin = () => {
    // Save the current URL parameters to return after login
    const returnPath = `/auth/accept-invitation?organization=${organizationId}&member=${memberId}`
    router.push(`/auth/login?returnTo=${encodeURIComponent(returnPath)}`)
  }

  if (isLoggedIn === false) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">Organization Invitation</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p>Please log in to accept this organization invitation.</p>
            <Button onClick={handleLogin}>Log In</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-destructive">Error</h2>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold">
          {isProcessing ? "Processing invitation..." : "Invitation processed"}
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          {isProcessing 
            ? "Please wait while we process your invitation." 
            : "Your invitation has been processed. Redirecting..."}
        </p>
      </div>
    </div>
  )
}

// Main page component with Suspense boundary
export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-svh w-full items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Loading...</h2>
          <p className="text-sm text-muted-foreground mt-2">Please wait...</p>
        </div>
      </div>
    }>
      <InvitationProcessor />
    </Suspense>
  )
}