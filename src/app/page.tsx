import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import { ClientAuthRedirect } from './ClientAuthRedirect';

export const metadata: Metadata = {
  title: 'Unyte AI',
  description: 'Automate the creation and deployment of ad campaigns on Google, Meta, TikTok, and LinkedIn with ease.',
}

export default async function Home() {
  // Create Supabase server client
  const supabase = await createClient();
  
  try {
    // Check if user is authenticated - only wrap this in try/catch
    const { data, error } = await supabase.auth.getUser();
    const isAuthenticated = !!data?.user && !error;
    
    if (isAuthenticated) {
      // User is logged in, redirect to dashboard
      redirect('/home');
    } else {
      // Server-side auth failed, always fall back to client-side
      // This handles all edge cases including cross-origin issues, cookie problems, etc.
      return <ClientAuthRedirect />;
    }
  } catch (error) {
    // If there's any error with the auth check itself, fall back to client-side
    console.error('Server auth check failed, falling back to client:', error);
    return <ClientAuthRedirect />;
  }
}
