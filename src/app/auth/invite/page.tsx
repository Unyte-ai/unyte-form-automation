import { InviteHandler } from './InviteHandler'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Organization Invite',
  description: 'Join an organization on Unyte AI',
}

export default function InvitePage() {
  return <InviteHandler />
}