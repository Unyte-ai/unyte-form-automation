import { useState, useCallback } from 'react'

interface UnlockConfirmationState {
  isOpen: boolean
  lockType: 'budget' | 'date' | null
  hasOriginalData: boolean
  pendingUnlockCallback: (() => void) | null
}

export function useGoogleCampaignUnlockConfirmation() {
  const [confirmationState, setConfirmationState] = useState<UnlockConfirmationState>({
    isOpen: false,
    lockType: null,
    hasOriginalData: false,
    pendingUnlockCallback: null
  })

  const requestUnlock = useCallback((
    lockType: 'budget' | 'date',
    hasOriginalData: boolean,
    unlockCallback: () => void
  ) => {
    setConfirmationState({
      isOpen: true,
      lockType,
      hasOriginalData,
      pendingUnlockCallback: unlockCallback
    })
  }, [])

  const confirmUnlock = useCallback(() => {
    setConfirmationState(prev => {
      // Execute the pending callback if it exists
      if (prev.pendingUnlockCallback) {
        prev.pendingUnlockCallback()
      }
      
      // Reset the confirmation state
      return {
        isOpen: false,
        lockType: null,
        hasOriginalData: false,
        pendingUnlockCallback: null
      }
    })
  }, [])

  const cancelUnlock = useCallback(() => {
    setConfirmationState({
      isOpen: false,
      lockType: null,
      hasOriginalData: false,
      pendingUnlockCallback: null
    })
  }, [])

  return {
    confirmationState,
    requestUnlock,
    confirmUnlock,
    cancelUnlock
  }
}