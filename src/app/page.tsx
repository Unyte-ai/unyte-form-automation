import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import { ClientAuthRedirect } from './ClientAuthRedirect';

export const metadata: Metadata = {
  title: 'Unyte AI',
  description: 'Automate the creation and deployment of ad campaigns on Google, Meta, TikTok, and LinkedIn with ease.',
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Create Supabase server client
  const supabase = await createClient();
  
  // Get the search parameters to check if we have tracking params
  const params = await searchParams;
  const hasTrackingParams = Object.keys(params).some(key => 
    key.startsWith('_gl') || key.startsWith('_gcl') || key.startsWith('utm_')
  );
  
  let isAuthenticated = false;
  
  try {
    // Check if user is authenticated - only wrap this in try/catch
    const { data, error } = await supabase.auth.getUser();
    isAuthenticated = !!data?.user && !error;
  } catch (error) {
    // If there's any error with the auth check itself, fall back to client-side
    console.error('Server auth check failed, falling back to client:', error);
    return <ClientAuthRedirect />;
  }
  
  if (isAuthenticated) {
    // User is logged in, redirect to dashboard
    redirect('/home');
  } else if (hasTrackingParams) {
    // If we have tracking params and server-side auth failed,
    // fall back to client-side auth check
    return <ClientAuthRedirect />;
  } else {
    // User is not logged in and no tracking params, redirect to sign up
    redirect('/auth/sign-up');
  }
}