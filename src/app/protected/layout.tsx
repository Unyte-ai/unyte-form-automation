import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CurrentUserAvatar } from '@/components/current-user-avatar';
import { createClient } from '@/lib/supabase/server';

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get user information server-side
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  
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
            {/* Add Organisation Button */}
            <Button variant="default" className="rounded-full bg-black text-white hover:bg-black/90">
              Add Organisation
            </Button>

            {/* User Profile */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {user?.email || "Name Surname"}
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