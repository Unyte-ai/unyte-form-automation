import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface LinkedInCampaignBasicInfoProps {
  name: string
  setName: (name: string) => void
  campaignType: 'SPONSORED_UPDATES' | 'TEXT_AD' | 'SPONSORED_INMAILS' | 'DYNAMIC'
  setCampaignType: (type: 'SPONSORED_UPDATES' | 'TEXT_AD' | 'SPONSORED_INMAILS' | 'DYNAMIC') => void
}

export function LinkedInCampaignBasicInfo({
  name,
  setName,
  campaignType,
  setCampaignType
}: LinkedInCampaignBasicInfoProps) {
  return (
    <>
      {/* Campaign Name */}
      <div className="grid gap-2">
        <Label htmlFor="campaign-name">Campaign Name *</Label>
        <Input
          id="campaign-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter campaign name"
          required
        />
      </div>

      {/* Campaign Type */}
      <div className="grid gap-2">
        <Label htmlFor="campaign-type">Campaign Type *</Label>
        <Select value={campaignType} onValueChange={(value) => setCampaignType(value as 'SPONSORED_UPDATES' | 'TEXT_AD' | 'SPONSORED_INMAILS' | 'DYNAMIC')}>
          <SelectTrigger id="campaign-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SPONSORED_UPDATES">Sponsored Content</SelectItem>
            <SelectItem value="TEXT_AD">Text Ads</SelectItem>
            <SelectItem value="SPONSORED_INMAILS">Sponsored Messaging</SelectItem>
            <SelectItem value="DYNAMIC">Dynamic Ads</SelectItem>
          </SelectContent>
        </Select>
        {campaignType === 'SPONSORED_INMAILS' && (
          <p className="text-xs text-muted-foreground">
            Note: For Sponsored Messaging, Cost Per Send (CPS) is measured as CPM × 1000
          </p>
        )}
      </div>
    </>
  )
}