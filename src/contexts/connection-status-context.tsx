'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { getAllConnectionStatuses } from '@/app/actions/get-all-connections'
import { toast } from 'sonner'
import { useParams } from 'next/navigation'

// Define the context type
interface ConnectionStatusContextType {
  isLoading: boolean
  connections: {
    google: boolean
    facebook: boolean
    linkedin: boolean
    tiktok: {
      isConnected: boolean
      username?: string
      displayName?: string
      avatarUrl?: string
    }
  }
  refreshConnections: () => Promise<void>
}

// Default context values
const defaultContext: ConnectionStatusContextType = {
  isLoading: true,
  connections: {
    google: false,
    facebook: false,
    linkedin: false,
    tiktok: {
      isConnected: false
    }
  },
  refreshConnections: async () => {}
}

// Create the context
const ConnectionStatusContext = createContext<ConnectionStatusContextType>(defaultContext)

// Custom hook to use the context
export const useConnectionStatus = () => useContext(ConnectionStatusContext)

// Provider component
export function ConnectionStatusProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [connections, setConnections] = useState(defaultContext.connections)
  const params = useParams()
  const organizationId = params?.orgId as string

  // Function to fetch all connection statuses - wrapped in useCallback
  const refreshConnections = useCallback(async () => {
    try {
      setIsLoading(true)
      const statuses = await getAllConnectionStatuses(organizationId)
      setConnections(statuses)
    } catch (error) {
      console.error('Error fetching connection statuses:', error)
      toast.error('Failed to load connection statuses')
    } finally {
      setIsLoading(false)
    }
  }, [organizationId]) // Add organizationId as a dependency

  // Fetch connection statuses on mount or when organizationId changes
  useEffect(() => {
    refreshConnections()
  }, [refreshConnections]) // Now includes refreshConnections

  return (
    <ConnectionStatusContext.Provider 
      value={{ isLoading, connections, refreshConnections }}
    >
      {children}
    </ConnectionStatusContext.Provider>
  )
}