import { InviteSetupForm } from '@/components/invite-setup-form'

export default function InviteSetupPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <InviteSetupForm />
      </div>
    </div>
  )
}