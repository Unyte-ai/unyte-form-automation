import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export const useCurrentUserImage = () => {
  const [image, setImage] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserImage = async () => {
      const { data: { user }, error } = await createClient().auth.getUser()
      if (error) {
        console.error(error)
        return
      }

      if (user?.user_metadata?.avatar_url) {
        setImage(user.user_metadata.avatar_url)
      }
    }
    fetchUserImage()
  }, [])

  return image
}