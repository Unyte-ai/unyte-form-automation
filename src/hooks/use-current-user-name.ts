import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export const useCurrentUserName = () => {
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfileName = async () => {
      const { data: { user }, error } = await createClient().auth.getUser()
      if (error) {
        console.error(error)
        return
      }

      if (user?.user_metadata?.full_name) {
        setName(user.user_metadata.full_name)
      }
    }

    fetchProfileName()
  }, [])

  return name || '?'
}