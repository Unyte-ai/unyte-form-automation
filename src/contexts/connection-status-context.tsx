// src/contexts/connection-status-context.tsx
'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getAllConnectionStatuses } from '@/app/actions/get-all-connections'
import { toast } from 'sonner'

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

  // Function to fetch all connection statuses
  const refreshConnections = async () => {
    try {
      setIsLoading(true)
      const statuses = await getAllConnectionStatuses()
      setConnections(statuses)
    } catch (error) {
      console.error('Error fetching connection statuses:', error)
      toast.error('Failed to load connection statuses')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch connection statuses on mount
  useEffect(() => {
    refreshConnections()
  }, [])

  return (
    <ConnectionStatusContext.Provider 
      value={{ isLoading, connections, refreshConnections }}
    >
      {children}
    </ConnectionStatusContext.Provider>
  )
}