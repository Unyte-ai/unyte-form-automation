import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface LinkedInCampaignFormActionsProps {
  isCreating: boolean
  onCancel: () => void
}

export function LinkedInCampaignFormActions({
  isCreating,
  onCancel
}: LinkedInCampaignFormActionsProps) {
  return (
    <>
      {/* Form Actions */}
      <div className="flex gap-2 pt-2">
        <Button 
          type="button" 
          variant="ghost" 
          onClick={onCancel}
          disabled={isCreating}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isCreating}>
          {isCreating ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Draft Campaign'
          )}
        </Button>
      </div>
    </>
  )
}