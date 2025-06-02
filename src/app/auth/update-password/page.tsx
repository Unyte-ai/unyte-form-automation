import { UpdatePasswordForm } from '@/components/update-password-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Update Password',
  description: 'Update your account password',
}

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <UpdatePasswordForm />
      </div>
    </div>
  )
}