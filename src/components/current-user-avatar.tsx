'use client'

import { useState, useEffect } from 'react'
import { useCurrentUserImage } from '@/hooks/use-current-user-image'
import { useCurrentUserName } from '@/hooks/use-current-user-name'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { EditProfileDialog } from '@/components/edit-profile'

export const CurrentUserAvatar = () => {
  const router = useRouter()
  const profileImage = useCurrentUserImage()
  const name = useCurrentUserName()
  const [email, setEmail] = useState<string | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const initials = name
    ?.split(' ')
    ?.map((word) => word[0])
    ?.join('')
    ?.toUpperCase()

  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data: { user }, error } = await createClient().auth.getUser()
      if (error) {
        console.error(error)
        return
      }
      if (user?.email) {
        setEmail(user.email)
      }
    }
    
    fetchUserEmail()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="outline-none">
          <Avatar className="cursor-pointer hover:ring-2 hover:ring-ring/50 transition-all">
            {profileImage && <AvatarImage src={profileImage} alt={initials} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 flex flex-col">
            <span className="font-medium">{name}</span>
            <span className="text-xs text-muted-foreground mt-0.5">{email}</span>
          </div>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setShowEditDialog(true)}
          >
            <User className="mr-2 size-4" />
            Edit Profile
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 size-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <EditProfileDialog 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog} 
      />
    </>
  )
}