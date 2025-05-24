'use server'

import { getTikTokConnectionStatus } from './tiktok-status'
import { getLinkedInConnectionStatus } from './linkedin-status'

export async function getAllConnectionStatuses(organizationId?: string) {
  // Fetch TikTok and LinkedIn statuses in parallel with Promise.all
  const [tiktokStatus, linkedInStatus] = await Promise.all([
    getTikTokConnectionStatus(organizationId),
    getLinkedInConnectionStatus(organizationId)
  ])

  return {
    google: false, // Hardcoded until custom Google auth is implemented
    facebook: false, // Hardcoded - Meta auth removed
    linkedin: linkedInStatus.isConnected,
    tiktok: {
      isConnected: tiktokStatus.isConnected,
      username: tiktokStatus.username,
      displayName: tiktokStatus.displayName,
      avatarUrl: tiktokStatus.avatarUrl
    }
  }
}