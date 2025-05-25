'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LinkedInCampaign } from '@/components/linkedin-campaign'
import { TikTokCampaign } from '@/components/tiktok-campaign'
import { FacebookCampaign } from '@/components/facebook-campaign'
import { v4 as uuidv4 } from 'uuid'

interface CreateCampaignProps {
  organizationId: string
}

export function CreateCampaign({ organizationId }: CreateCampaignProps) {
  const [linkedInCampaigns, setLinkedInCampaigns] = useState<{id: string}[]>([])
  const [tikTokCampaigns, setTikTokCampaigns] = useState<{id: string}[]>([])
  const [facebookCampaigns, setFacebookCampaigns] = useState<{id: string}[]>([])

  const addLinkedInCampaign = () => {
    const newCampaign = { id: uuidv4() }
    setLinkedInCampaigns(prev => [...prev, newCampaign])
  }

  const removeLinkedInCampaign = (id: string) => {
    setLinkedInCampaigns(prev => prev.filter(campaign => campaign.id !== id))
  }

  const addTikTokCampaign = () => {
    const newCampaign = { id: uuidv4() }
    setTikTokCampaigns(prev => [...prev, newCampaign])
  }

  const removeTikTokCampaign = (id: string) => {
    setTikTokCampaigns(prev => prev.filter(campaign => campaign.id !== id))
  }

  const addFacebookCampaign = () => {
    const newCampaign = { id: uuidv4() }
    setFacebookCampaigns(prev => [...prev, newCampaign])
  }

  const removeFacebookCampaign = (id: string) => {
    setFacebookCampaigns(prev => prev.filter(campaign => campaign.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Plus className="size-4" />
              Create Campaign
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="cursor-pointer">
              Google
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={addFacebookCampaign}>
              Meta
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={addTikTokCampaign}>
              TikTok
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={addLinkedInCampaign}>
              LinkedIn
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Display campaigns */}
      <div className="space-y-4 mt-4">
        {/* LinkedIn campaigns */}
        {linkedInCampaigns.map(campaign => (
          <LinkedInCampaign 
            key={campaign.id} 
            id={campaign.id} 
            onRemove={removeLinkedInCampaign}
            organizationId={organizationId}
          />
        ))}

        {/* Facebook campaigns */}
        {facebookCampaigns.map(campaign => (
          <FacebookCampaign 
            key={campaign.id} 
            id={campaign.id} 
            onRemove={removeFacebookCampaign}
            organizationId={organizationId}
          />
        ))}
        
        {/* TikTok campaigns */}
        {tikTokCampaigns.map(campaign => (
          <TikTokCampaign 
            key={campaign.id} 
            id={campaign.id} 
            onRemove={removeTikTokCampaign}
            organizationId={organizationId}
          />
        ))}
      </div>
    </div>
  )
}