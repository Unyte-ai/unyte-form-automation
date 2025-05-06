'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { acceptOrganizationInvitation } from '@/app/actions/members'
import { toast } from 'sonner'

export default function AcceptInvitationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const processInvitation = async () => {
      try {
        setIsProcessing(true)
        
        const organizationId = searchParams.get('organization')
        const memberId = searchParams.get('member')
        
        if (!organizationId || !memberId) {
          throw new Error('Invalid invitation link. Missing required parameters.')
        }
        
        // Process the invitation acceptance
        // Since this page is accessed via magic link, the user is already authenticated
        await acceptOrganizationInvitation(organizationId, memberId)
        
        toast.success('Invitation accepted', {
          description: 'You have successfully joined the organization.'
        })
        
        // Redirect to the organization page
        router.push(`/home/${organizationId}`)
      } catch (error) {
        console.error('Error processing invitation:', error)
        setError(error instanceof Error ? error.message : 'An error occurred while processing the invitation.')
      } finally {
        setIsProcessing(false)
      }
    }

    processInvitation()
  }, [router, searchParams])

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
    );
}