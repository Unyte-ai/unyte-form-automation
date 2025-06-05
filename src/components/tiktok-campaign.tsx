'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Construction } from 'lucide-react'

interface TikTokCampaignProps {
  id: string
  onRemove: (id: string) => void
  organizationId: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function TikTokCampaign({ id, onRemove, organizationId }: TikTokCampaignProps) {
  return (
    <Card className="mb-4 relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2 h-6 w-6" 
        onClick={() => onRemove(id)}
      >
        <X className="h-4 w-4" />
      </Button>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          TikTok
          <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-normal dark:bg-amber-900/30 dark:text-amber-400">
            Coming Soon
          </span>
        </CardTitle>
        <CardDescription>Create a campaign for TikTok</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <Construction className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-amber-800 dark:text-amber-300 font-medium text-sm">
                Platform Under Development
              </p>
              <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">
                TikTok is currently the <strong>only</strong> platform out of our 4 supported ad platforms that&apos;s still under construction. 
                We&apos;re working hard to bring you TikTok campaign creation capabilities soon!
              </p>
              <p className="text-amber-600 dark:text-amber-500 text-xs mt-2">
                Available platforms: Meta, Google Ads, LinkedIn • Coming soon: TikTok
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}