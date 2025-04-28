import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
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
      <Link href="/auth/sign-up">
        <Button size="lg" className="px-8 py-4">
          Get Started
        </Button>
      </Link>
    </div>
  );
}
