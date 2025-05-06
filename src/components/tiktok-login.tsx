import { Button } from '@/components/ui/button'

export function TikTokLogin() {
  return (
    <div className="flex justify-between items-center">
      <span className="font-medium">TikTok</span>
      <Button variant="outline" size="sm">Sign In</Button>
    </div>
  )
}