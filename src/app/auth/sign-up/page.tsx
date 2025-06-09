import { SignUpForm } from '@/components/sign-up-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your Unyte AI account to get started with automated ad campaigns',
}

export default function Page() {
  return (
    <div className="flex w-full items-center justify-center">
      <div className="w-full max-w-sm">
        <SignUpForm />
      </div>
    </div>
  )
}