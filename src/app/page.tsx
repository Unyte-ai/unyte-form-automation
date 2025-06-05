import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Unyte AI',
  description: 'Automate the creation and deployment of ad campaigns on Google, Meta, TikTok, and LinkedIn with ease.',
}

export default async function Home() {
  // Create Supabase server client
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data } = await supabase.auth.getUser();
  const isAuthenticated = !!data?.user;
  
  if (isAuthenticated) {
    // User is logged in, redirect to dashboard
    redirect('/home');
  } else {
    // User is not logged in, redirect to sign up
    redirect('/auth/sign-up');
  }
}
