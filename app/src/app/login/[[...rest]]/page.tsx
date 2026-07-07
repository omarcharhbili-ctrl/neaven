import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between">
        <Link
          href="/"
          className="text-white/80 hover:text-white inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        <div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Welcome back.
            <br />
            <span className="text-white/60">Neaven is ready.</span>
          </h1>
          <p className="mt-4 text-white/40 text-sm leading-relaxed max-w-md">
            Pick up right where you left off. Your brief, watcher, and
            co-founder context are synced and ready.
          </p>
        </div>
        <p className="text-white/20 text-xs">&copy; 2026 Neaven</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link href="/">
              <Logo />
            </Link>
          </div>
          <SignIn path="/login" signUpUrl="/signup" appearance={clerkAppearance} />
        </div>
      </div>
    </div>
  );
}
