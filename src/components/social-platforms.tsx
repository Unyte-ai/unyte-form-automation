import { Button } from '@/components/ui/button'

export function SocialPlatforms() {
  // List of social platforms
  const platforms = ['Google', 'Meta', 'TikTok', 'LinkedIn']

  return (
    <div className="rounded-lg border p-6 bg-card">
      <h2 className="text-xl font-semibold mb-4">Platforms</h2>
      <div className="space-y-4">
        {platforms.map((platform) => (
          <div key={platform} className="flex justify-between items-center">
            <span className="font-medium">{platform}</span>
            <Button variant="outline" size="sm">Sign In</Button>
          </div>
        ))}
      </div>
    </div>
  )
}