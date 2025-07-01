'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Suspense } from 'react'

function ConfirmContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const confirmationUrl = searchParams.get('confirmation_url')

  const handleConfirm = () => {
    if (confirmationUrl) {
      // This will redirect to Supabase's verify endpoint
      window.location.href = confirmationUrl
    } else {
      router.push('/auth/error?error=Missing confirmation URL')
    }
  }

  if (!confirmationUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid Link</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This confirmation link is invalid or expired.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirm Your Account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>Click the button below to confirm your account and complete the setup.</p>
        <Button onClick={handleConfirm} className="w-full">
          Confirm Account
        </Button>
      </CardContent>
    </Card>
  )
}

export default function ConfirmSignupPage() {
  return (
    <div className="flex w-full items-center justify-center">
      <div className="w-full max-w-md">
        <Suspense fallback={<div>Loading...</div>}>
          <ConfirmContent />
        </Suspense>
      </div>
    </div>
  )
}