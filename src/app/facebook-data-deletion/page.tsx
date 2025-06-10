import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, UserX, Shield } from 'lucide-react'

export default function FacebookDataDeletionPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Facebook Data Deletion</h1>
          <p className="text-muted-foreground">
            Instructions for deleting your Facebook data from our application
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              How to Delete Your Facebook Data
            </CardTitle>
            <CardDescription>
              Follow these steps to completely remove your Facebook connection and data from our system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">Log into your account</h3>
                  <p className="text-sm text-muted-foreground">
                    Sign in to your account on our application using your regular login credentials.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold">Navigate to your organization</h3>
                  <p className="text-sm text-muted-foreground">
                    Go to the organization where you connected your Facebook account.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold">Access the Meta connection</h3>
                  <p className="text-sm text-muted-foreground">
                    Click on the Meta/Facebook icon or connection button to open the Meta dialog.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold">Disconnect your account</h3>
                  <p className="text-sm text-muted-foreground">
                    Click the &quot;Disconnect&quot; button to remove your Facebook connection. This will permanently delete all associated data.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <UserX className="h-4 w-4" />
                What gets deleted:
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your Facebook access token and authentication data</li>
                <li>• Any cached Facebook profile information (name, email, profile picture)</li>
                <li>• The connection between your account and Facebook</li>
              </ul>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Alternative method:
              </h4>
              <p className="text-sm text-muted-foreground">
                You can also revoke access directly from your Facebook account by going to 
                Settings & Privacy → Settings → Apps and Websites, then removing our application.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              If you&apos;re unable to access your account or need assistance with data deletion, 
              please contact our support team at hi@unyte.ai and we&apos;ll help you remove your data manually.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}