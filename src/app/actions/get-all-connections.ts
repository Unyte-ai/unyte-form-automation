'use server'

import { getTikTokConnectionStatus } from './tiktok-status'
import { getLinkedInConnectionStatus } from './linkedin-status'
import { getFacebookConnectionStatus } from './facebook-status'
import { getGoogleConnectionStatus } from './google-status'

export async function getAllConnectionStatuses(organizationId?: string) {
  // Fetch TikTok, LinkedIn, Facebook, and Google statuses in parallel with Promise.all
  const [tiktokStatus, linkedInStatus, facebookStatus, googleStatus] = await Promise.all([
    getTikTokConnectionStatus(organizationId),
    getLinkedInConnectionStatus(organizationId),
    getFacebookConnectionStatus(organizationId),
    getGoogleConnectionStatus(organizationId)
  ])

  return {
    google: googleStatus.isConnected,
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