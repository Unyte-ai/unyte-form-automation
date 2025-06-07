import { useState, useCallback } from 'react'

interface BlurConfirmationState {
  isOpen: boolean
  fieldType: 'budget-type' | 'budget-amount' | 'start-date' | 'end-date' | null
  originalValue: string
  newValue: string
  hasOriginalData: boolean
  pendingRevertCallback: (() => void) | null
}

export function useLinkedInCampaignBlurConfirmation() {
  const [confirmationState, setConfirmationState] = useState<BlurConfirmationState>({
    isOpen: false,
    fieldType: null,
    originalValue: '',
    newValue: '',
    hasOriginalData: false,
    pendingRevertCallback: null
  })

  const requestConfirmation = useCallback((
    fieldType: 'budget-type' | 'budget-amount' | 'start-date' | 'end-date',
    originalValue: string,
    newValue: string,
    hasOriginalData: boolean,
    revertCallback: () => void
  ) => {
    setConfirmationState({
      isOpen: true,
      fieldType,
      originalValue,
      newValue,
      hasOriginalData,
      pendingRevertCallback: revertCallback
    })
  }, [])

  const confirmChange = useCallback(() => {
    // User confirmed the change - just close the dialog and keep new value
    setConfirmationState({
      isOpen: false,
      fieldType: null,
      originalValue: '',
      newValue: '',
      hasOriginalData: false,
      pendingRevertCallback: null
    })
  }, [])

  const cancelChange = useCallback(() => {
    setConfirmationState(prev => {
      // Execute the revert callback if it exists
      if (prev.pendingRevertCallback) {
        prev.pendingRevertCallback()
      }
      
      // Reset the confirmation state
      return {
        isOpen: false,
        fieldType: null,
        originalValue: '',
        newValue: '',
        hasOriginalData: false,
        pendingRevertCallback: null
      }
    })
  }, [])

  return {
    confirmationState,
    requestConfirmation,
    confirmChange,
    cancelChange
  }
}