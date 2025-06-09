import { UpdatePasswordForm } from '@/components/update-password-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Update Password',
  description: 'Update your account password',
}

export default function Page() {
  return (
    <div className="flex w-full items-center justify-center">
      <div className="w-full max-w-sm">
        <UpdatePasswordForm />
      </div>
    </div>
  )
}