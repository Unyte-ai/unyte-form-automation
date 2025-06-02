'use client'

import { useConnectionStatus } from '@/contexts/connection-status-context'

export function PlatformConnectionWarning() {
  const { connections, isLoading } = useConnectionStatus()
  
  // Check if any platform is connected
  const hasAnyConnection = connections.google || 
                          connections.facebook || 
                          connections.linkedin || 
                          connections.tiktok.isConnected
  
  // Don't show the warning while loading
  const showWarning = !isLoading && !hasAnyConnection

  if (!showWarning) {
    return null
  }

  return (
    <div className="mt-4 p-4 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
      <p className="text-amber-800 dark:text-amber-300 text-sm font-medium">
        ⚠️ You must connect to at least one platform to create campaigns for this organization.
      </p>
    </div>
  )
}