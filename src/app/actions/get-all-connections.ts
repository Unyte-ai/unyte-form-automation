// src/app/actions/get-all-connections.ts
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
    linkedin: socialStatuses.linkedin,
    tiktok: {
      isConnected: tiktokStatus.isConnected,
      username: tiktokStatus.username,
      displayName: tiktokStatus.displayName,
      avatarUrl: tiktokStatus.avatarUrl
    }
  }
}