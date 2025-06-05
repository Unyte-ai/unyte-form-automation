'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function ClientAuthRedirect() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      
      try {
        // Wait a bit to ensure any cookies are properly set
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data, error } = await supabase.auth.getUser();
        
        if (data?.user && !error) {
          // User is authenticated, redirect to dashboard
          console.log('Client auth: User found, redirecting to /home');
          router.replace('/home');
        } else {
          // User is not authenticated, redirect to sign up
          console.log('Client auth: No user found, redirecting to /auth/sign-up');
          router.replace('/auth/sign-up');
        }
      } catch (error) {
        console.error('Client auth check error:', error);
        // Default to sign up on error
        router.replace('/auth/sign-up');
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold">Checking authentication...</h2>
          <p className="text-sm text-muted-foreground mt-2">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  return null;
}