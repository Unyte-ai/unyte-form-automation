import { GoogleLogin } from '@/components/google-login'
import { MetaLogin } from '@/components/meta-login'
import { TikTokLogin } from '@/components/tiktok-login'
import { LinkedInLogin } from '@/components/linkedin-login'
import { ConnectionStatusProvider } from '@/contexts/connection-status-context'
import { PlatformConnectionWarning } from '@/components/platform-connection-warning'

export function SocialPlatforms() {
  return (
    <div className="rounded-lg border p-6 bg-card">
      <h2 className="text-xl font-semibold mb-4">Platforms</h2>
      <ConnectionStatusProvider>
        <div className="space-y-4">
          <GoogleLogin />
          <MetaLogin />
          <TikTokLogin />
          <LinkedInLogin />
        </div>
        <PlatformConnectionWarning />
      </ConnectionStatusProvider>
    </div>
  )
}