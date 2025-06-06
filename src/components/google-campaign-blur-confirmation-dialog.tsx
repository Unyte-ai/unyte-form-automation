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

interface GoogleCampaignBlurConfirmationDialogProps {
  isOpen: boolean
  fieldType: 'budget-type' | 'budget-amount' | 'start-date' | 'end-date' | null
  originalValue: string
  newValue: string
  hasOriginalData: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function GoogleCampaignBlurConfirmationDialog({
  isOpen,
  fieldType,
  originalValue,
  newValue,
  hasOriginalData,
  onConfirm,
  onCancel
}: GoogleCampaignBlurConfirmationDialogProps) {
  const getDialogContent = () => {
    const formatValue = (value: string, type: string | null) => {
      switch (type) {
        case 'budget-type':
          return value === 'daily' ? 'Daily Budget' : 'Total Budget (Lifetime)'
        case 'budget-amount':
          return `$${value}`
        case 'start-date':
        case 'end-date':
          try {
            return new Date(value).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          } catch {
            return value
          }
        default:
          return value
      }
    }

    const getFieldName = () => {
      switch (fieldType) {
        case 'budget-type': return 'Budget Type'
        case 'budget-amount': return 'Budget Amount'
        case 'start-date': return 'Start Date'
        case 'end-date': return 'End Date'
        default: return 'field'
      }
    }

    const fieldName = getFieldName()
    const formattedOriginal = formatValue(originalValue, fieldType)
    const formattedNew = formatValue(newValue, fieldType)

    return {
      title: `Confirm ${fieldName} Change?`,
      description: hasOriginalData 
        ? `You've changed the ${fieldName} from the auto-populated value. Do you want to keep this change?`
        : `You've changed the ${fieldName}. Do you want to keep this change?`,
      fieldName,
      formattedOriginal,
      formattedNew
    }
  }

  const content = getDialogContent()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-blue-600">💭</span>
            {content.title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {content.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted/30 p-3 rounded-md space-y-2">
          <div className="text-sm">
            <span className="text-muted-foreground">Original:</span>
            <span className="ml-2 font-medium">{content.formattedOriginal}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">New:</span>
            <span className="ml-2 font-medium text-blue-600">{content.formattedNew}</span>
          </div>
          {hasOriginalData && (
            <p className="text-xs text-muted-foreground mt-1">
              Original value was auto-populated from your form submission.
            </p>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel (Revert)
          </Button>
          <Button variant="default" onClick={onConfirm}>
            Keep Change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}