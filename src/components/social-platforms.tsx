import { GoogleLogin } from '@/components/google-login'
import { MetaLogin } from '@/components/meta-login'
import { TikTokLogin } from '@/components/tiktok-login'
import { LinkedInLogin } from '@/components/linkedin-login'

export function SocialPlatforms() {

  
  return (
    <div className="rounded-lg border p-6 bg-card">
      <h2 className="text-xl font-semibold mb-4">Platforms</h2>
      <div className="space-y-4">
        <GoogleLogin />
        <MetaLogin />
        <TikTokLogin />
        <LinkedInLogin />
      </div>
    </div>
  )
}