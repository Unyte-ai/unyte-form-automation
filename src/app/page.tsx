import { Button } from "@/components/ui/button";
import Link from "next/link";
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
  
  // Determine the target URL based on authentication status
  const targetUrl = isAuthenticated ? "/home" : "/auth/sign-up";
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background text-foreground">
      {/* Hero Section */}
      <h1 className="text-5xl font-extrabold mb-4 text-center">
        Unyte Form Automation
      </h1>
      <p className="text-lg text-center max-w-2xl mb-8">
        Automate the creation and deployment of ad campaigns on Google, Meta, TikTok, and LinkedIn with ease.
      </p>
      {/* Call to Action */}
      <Link href={targetUrl}>
        <Button size="lg" className="px-8 py-4">
          {isAuthenticated ? "Dashboard" : "Get Started"}
        </Button>
      </Link>
    </div>
  );
}
