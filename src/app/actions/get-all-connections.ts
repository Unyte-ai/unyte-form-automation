'use server'

import { getSocialConnectionStatus } from './social-connections'
import { getTikTokConnectionStatus } from './tiktok-status'
import { getLinkedInConnectionStatus } from './linkedin-status'

export async function getAllConnectionStatuses(organizationId?: string) {
  // Fetch all statuses in parallel with Promise.all
  const [socialStatuses, tiktokStatus, linkedInStatus] = await Promise.all([
    getSocialConnectionStatus(),
    getTikTokConnectionStatus(),
    getLinkedInConnectionStatus(organizationId) // Pass organizationId
  ])

  return {
    google: socialStatuses.google,
    facebook: socialStatuses.facebook,
    linkedin: linkedInStatus.isConnected,
    tiktok: {
      isConnected: tiktokStatus.isConnected,
      username: tiktokStatus.username,
      displayName: tiktokStatus.displayName,
      avatarUrl: tiktokStatus.avatarUrl
    }
  }
}