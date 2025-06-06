'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface GoogleCampaignUnlockConfirmationDialogProps {
  isOpen: boolean
  lockType: 'budget' | 'date' | null
  hasOriginalData: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function GoogleCampaignUnlockConfirmationDialog({
  isOpen,
  lockType,
  hasOriginalData,
  onConfirm,
  onCancel
}: GoogleCampaignUnlockConfirmationDialogProps) {
  const getDialogContent = () => {
    if (lockType === 'budget') {
      return {
        title: 'Unlock Budget Fields?',
        description: hasOriginalData 
          ? 'You are about to unlock the Budget Type and Budget Amount fields that were auto-populated from the form data. Are you sure you want to make manual changes to these values?'
          : 'You are about to unlock the Budget Type and Budget Amount fields for manual editing. Are you sure you want to proceed?',
        fields: 'Budget Type and Budget Amount'
      }
    } else if (lockType === 'date') {
      return {
        title: 'Unlock Date Fields?',
        description: hasOriginalData
          ? 'You are about to unlock the Start Date and End Date fields that were auto-populated from the form data. Are you sure you want to make manual changes to these values?'
          : 'You are about to unlock the Start Date and End Date fields for manual editing. Are you sure you want to proceed?',
        fields: 'Start Date and End Date'
      }
    }
    
    return {
      title: 'Unlock Fields?',
      description: 'Are you sure you want to unlock these fields for manual editing?',
      fields: 'form fields'
    }
  }

  const content = getDialogContent()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-amber-600">⚠️</span>
            {content.title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {content.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted/30 p-3 rounded-md">
          <p className="text-sm text-muted-foreground">
            <strong>Fields to unlock:</strong> {content.fields}
          </p>
          {hasOriginalData && (
            <p className="text-xs text-muted-foreground mt-1">
              These fields contain data from your original form submission.
            </p>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="default" onClick={onConfirm}>
            Yes, Unlock Fields
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}