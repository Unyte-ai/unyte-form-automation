import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import { AddOrganisationButton } from '@/components/add-organisation-button'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your Unyte AI dashboard',
}

export default async function HomePage() {
  const supabase = await createClient()

  // Check authentication
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/auth/login')
  }

  // Fetch the first organization (if any)
  const { data: organizations } = await supabase
    .from('organizations')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)

  // If organizations exist, redirect to the first one
  if (organizations && organizations.length > 0) {
    redirect(`/home/${organizations[0].id}`)
  }

  // If no organizations, show a message with add organisation button
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex h-full w-full items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Welcome to Unyte Form Automation</h1>
          <p className="text-muted-foreground mb-6">Please create an organization to get started.</p>
          <AddOrganisationButton />
        </div>
      </div>
    </div>
  )
}