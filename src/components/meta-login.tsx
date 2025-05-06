import { Button } from '@/components/ui/button'

export function MetaLogin() {
  return (
    <div className="flex justify-between items-center">
      <span className="font-medium">Meta</span>
      <Button variant="outline" size="sm">Sign In</Button>
    </div>
  )
}