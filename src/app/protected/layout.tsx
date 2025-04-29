import React from 'react';
import Link from 'next/link';
import { CurrentUserAvatar } from '@/components/current-user-avatar';
import { createClient } from '@/lib/supabase/server';
import { OrganisationSwitch } from '@/components/organisation-switch';

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get user information server-side
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  
  // Get the user's display name from metadata, fallback to email
  const displayName = user?.user_metadata?.full_name || user?.email || "Guest User";
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header/Navigation */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="font-bold text-xl">
            <Link href="/protected">LOGO</Link>
          </div>

          {/* Center/Right Side */}
          <div className="flex items-center gap-6">
            {/* Organisation Switch Component */}
            <OrganisationSwitch />

            {/* User Profile */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {displayName}
              </span>
              <CurrentUserAvatar />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}