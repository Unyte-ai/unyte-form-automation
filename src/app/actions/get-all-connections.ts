'use server'

import { getSocialConnectionStatus } from './social-connections'
import { getTikTokConnectionStatus } from './tiktok-status'

export async function getAllConnectionStatuses() {
  // Fetch all statuses in parallel with Promise.all
  const [socialStatuses, tiktokStatus] = await Promise.all([
    getSocialConnectionStatus(),
    getTikTokConnectionStatus()
  ])

  return {
    google: socialStatuses.google,
    facebook: socialStatuses.facebook,
    linkedin: false, // Keep this property but set it to false until LinkedIn is implemented
    tiktok: {
      isConnected: tiktokStatus.isConnected,
      username: tiktokStatus.username,
      displayName: tiktokStatus.displayName,
      avatarUrl: tiktokStatus.avatarUrl
    }
  }
}