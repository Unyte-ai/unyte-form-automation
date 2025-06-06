'use client'

import { Button } from '@/components/ui/button'

interface CreatedGoogleCampaign {
  campaignId: string
  campaignName: string
}

interface GoogleCampaignSuccessDisplayProps {
  createdCampaign: CreatedGoogleCampaign
  onCreateAnother: () => void
}

export function GoogleCampaignSuccessDisplay({
  createdCampaign,
  onCreateAnother
}: GoogleCampaignSuccessDisplayProps) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-green-50 border border-green-200 rounded-md dark:bg-green-950/30 dark:border-green-800">
        <p className="text-sm text-green-800 dark:text-green-300">
          <strong>Campaign Created!</strong>
        </p>
        <p className="text-sm text-green-700 dark:text-green-400 mt-1">
          Campaign: &quot;{createdCampaign.campaignName}&quot; (ID: {createdCampaign.campaignId})
        </p>
        <p className="text-xs text-green-600 dark:text-green-500 mt-2">
          The campaign is paused and ready for customization in Google Ads Manager.
        </p>
      </div>
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={onCreateAnother}
      >
        Create Another Campaign
      </Button>
    </div>
  )
}