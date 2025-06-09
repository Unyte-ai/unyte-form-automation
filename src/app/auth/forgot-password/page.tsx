import { ForgotPasswordForm } from '@/components/forgot-password-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your Unyte AI account password',
}

export default function Page() {
  return (
    <div className="flex w-full items-center justify-center">
      <div className="w-full max-w-sm">
        <ForgotPasswordForm />
      </div>
    </div>
  )
}