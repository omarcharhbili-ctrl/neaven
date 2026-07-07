import { SignUp } from "@clerk/nextjs";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignupPage() {
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
            Build with a co-founder
            <br />
            <span className="text-white/60">that pushes back.</span>
          </h1>
          <p className="mt-4 text-white/40 text-sm leading-relaxed max-w-md">
            Neaven holds full context on your vision, progress, code, and
            revenue — and argues with you when a decision contradicts your own
            goals.
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
          <SignUp path="/signup" signInUrl="/login" appearance={clerkAppearance} />
        </div>
      </div>
    </div>
  );
}
