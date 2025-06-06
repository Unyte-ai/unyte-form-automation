// 'use client'

// import { Button } from '@/components/ui/button'
// import { useState, useEffect } from 'react'
// import { toast } from 'sonner'
// import { initTikTokOAuth } from '@/app/actions/tiktok-auth'
// import { TikTokDialog } from '@/components/tiktok-dialog'
// import { useConnectionStatus } from '@/contexts/connection-status-context'
// import { useParams } from 'next/navigation'
// import { createClient } from '@/lib/supabase/client'

// export function TikTokLogin() {
//   const [isConnecting, setIsConnecting] = useState(false)
//   const [isDialogOpen, setIsDialogOpen] = useState(false)
//   const [organizationName, setOrganizationName] = useState<string>('')
  
//   const { connections, isLoading, refreshConnections } = useConnectionStatus()
//   const connectionStatus = connections.tiktok
  
//   const params = useParams()
//   const organizationId = params?.orgId as string

//   // Fetch organization name for better UX
//   useEffect(() => {
//     async function fetchOrganizationName() {
//       if (!organizationId) return
      
//       try {
//         const supabase = createClient()
//         const { data } = await supabase
//           .from('organizations')
//           .select('name')
//           .eq('id', organizationId)
//           .single()
        
//         setOrganizationName(data?.name || '')
//       } catch (error) {
//         console.error('Error fetching organization name:', error)
//       }
//     }
    
//     fetchOrganizationName()
//   }, [organizationId])
  
//   async function connectTikTok() {
//     if (connectionStatus.isConnected) {
//       setIsDialogOpen(true)
//       return
//     }
    
//     if (!organizationId) {
//       toast.error('No organization selected', {
//         description: 'Please select an organization from the dropdown before connecting TikTok.'
//       })
//       return
//     }
    
//     try {
//       setIsConnecting(true)
      
//       toast.info('Connecting TikTok...', {
//         description: `Connecting TikTok to ${organizationName || 'your organization'}`
//       })
      
//       const authUrl = await initTikTokOAuth(organizationId)
//       window.location.href = authUrl
      
//     } catch (error) {
//       console.error('Error connecting TikTok account:', error)
//       toast.error('Failed to connect TikTok account', {
//         description: error instanceof Error ? error.message : 'Please try again or contact support if the issue persists.'
//       })
//       setIsConnecting(false)
//     }
//   }

//   // Generate button text based on connection status
//   const getButtonText = () => {
//     if (isConnecting) return 'Connecting...'
//     if (isLoading) return 'Loading...'
//     if (connectionStatus.isConnected) return 'Connected'
//     return 'Connect'
//   }

//   // Generate button title for accessibility
//   const getButtonTitle = () => {
//     if (!organizationId) return 'Select an organization first'
//     if (connectionStatus.isConnected) return `Manage TikTok connection for ${organizationName}`
//     return `Connect TikTok to ${organizationName}`
//   }

//   return (
//     <>
//       <div className="flex justify-between items-center">
//         <div className="flex flex-col">
//           <span className="font-medium">TikTok</span>
//         </div>
        
//         <Button 
//           variant="outline" 
//           size="sm" 
//           onClick={connectTikTok}
//           disabled={isLoading || isConnecting || !organizationId}
//           title={getButtonTitle()}
//           className={connectionStatus.isConnected 
//             ? "text-green-700 border-green-500 bg-green-50 hover:text-green-800 dark:text-green-400 dark:border-green-700 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/30 dark:hover:text-green-400" 
//             : ""}
//         >
//           {getButtonText()}
//         </Button>
//       </div>
      
//       {!organizationId && (
//         <div className="mt-2 p-2 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
//           <p className="text-amber-800 dark:text-amber-300 text-xs">
//             Select an organization to connect TikTok
//           </p>
//         </div>
//       )}
      
//       <TikTokDialog 
//         open={isDialogOpen} 
//         onOpenChange={setIsDialogOpen}
//         onDisconnect={refreshConnections}
//       />
//     </>
//   )
// }


'use client'

import { Button } from "./ui/button"

export function TikTokLogin() {
  return (
    <div className="flex justify-between items-center opacity-50">
      <div className="flex flex-col">
        <span className="font-medium text-gray-500">TikTok</span>
        <span className="text-sm text-gray-400">Coming soon</span>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        disabled={true}
        title="Feature coming soon"
        className="text-gray-400 border-gray-300 bg-gray-100 cursor-not-allowed"
      >
        Coming soon
      </Button>
    </div>
  )
}
