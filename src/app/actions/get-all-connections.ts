'use server'

import { getTikTokConnectionStatus } from './tiktok-status'
import { getLinkedInConnectionStatus } from './linkedin-status'
import { getFacebookConnectionStatus } from './facebook-status'

export async function getAllConnectionStatuses(organizationId?: string) {
  // Fetch TikTok, LinkedIn, and Facebook statuses in parallel with Promise.all
  const [tiktokStatus, linkedInStatus, facebookStatus] = await Promise.all([
    getTikTokConnectionStatus(organizationId),
    getLinkedInConnectionStatus(organizationId),
    getFacebookConnectionStatus(organizationId)
  ])

  return {
    google: false, // Hardcoded until custom Google auth is implemented
    facebook: facebookStatus.isConnected,
    linkedin: linkedInStatus.isConnected,
    tiktok: {
      isConnected: tiktokStatus.isConnected,
      username: tiktokStatus.username,
      displayName: tiktokStatus.displayName,
      avatarUrl: tiktokStatus.avatarUrl
    }
  }
}