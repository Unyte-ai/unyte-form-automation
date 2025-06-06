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
import { MetaCampaign } from '@/components/meta-campaign'
import { GoogleCampaign } from '@/components/google-campaign'
import { v4 as uuidv4 } from 'uuid'

// Define interfaces for form data
interface FormQuestion {
  question: string;
  answer: string;
}

interface StructuredData {
  rawText: string;
  formData: FormQuestion[];
}

interface CreateCampaignProps {
  organizationId: string
  formData?: StructuredData
}

export function CreateCampaign({ organizationId, formData }: CreateCampaignProps) {
  const [linkedInCampaigns, setLinkedInCampaigns] = useState<{id: string}[]>([])
  const [tikTokCampaigns, setTikTokCampaigns] = useState<{id: string}[]>([])
  const [metaCampaigns, setMetaCampaigns] = useState<{id: string}[]>([])
  const [googleCampaigns, setGoogleCampaigns] = useState<{id: string}[]>([])

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

  const addMetaCampaign = () => {
    const newCampaign = { id: uuidv4() }
    setMetaCampaigns(prev => [...prev, newCampaign])
  }

  const removeMetaCampaign = (id: string) => {
    setMetaCampaigns(prev => prev.filter(campaign => campaign.id !== id))
  }

  const addGoogleCampaign = () => {
    const newCampaign = { id: uuidv4() }
    setGoogleCampaigns(prev => [...prev, newCampaign])
  }

  const removeGoogleCampaign = (id: string) => {
    setGoogleCampaigns(prev => prev.filter(campaign => campaign.id !== id))
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
            <DropdownMenuItem className="cursor-pointer" onClick={addGoogleCampaign}>
              Google
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={addMetaCampaign}>
              Meta
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={addLinkedInCampaign}>
              LinkedIn
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={addTikTokCampaign}>
              TikTok
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Display campaigns */}
      <div className="space-y-4 mt-4">
        {/* Google campaigns - now with form data */}
        {googleCampaigns.map(campaign => (
          <GoogleCampaign 
            key={campaign.id} 
            id={campaign.id} 
            onRemove={removeGoogleCampaign}
            organizationId={organizationId}
            formData={formData}
          />
        ))}

        {/* LinkedIn campaigns - now with form data */}
        {linkedInCampaigns.map(campaign => (
          <LinkedInCampaign 
            key={campaign.id} 
            id={campaign.id} 
            onRemove={removeLinkedInCampaign}
            organizationId={organizationId}
            formData={formData}
          />
        ))}

        {/* Meta campaigns - now with form data */}
        {metaCampaigns.map(campaign => (
          <MetaCampaign 
            key={campaign.id} 
            id={campaign.id} 
            onRemove={removeMetaCampaign}
            organizationId={organizationId}
            formData={formData}
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