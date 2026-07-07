import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel — ink */}
      <div className="hidden flex-col justify-between bg-foreground p-12 lg:flex lg:w-1/2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[13px] text-white/60 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Back to home
        </Link>
        <div>
          <p className="flex items-baseline gap-1.5 select-none">
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-white">
              neaven
            </span>
            <span className="inline-block h-[6px] w-[6px] rounded-full bg-accent" />
          </p>
          <h1 className="mt-5 font-serif text-[34px] italic leading-[1.2] tracking-[-0.01em] text-white">
            Welcome back.
            <br />
            <span className="text-white/50">Everything&apos;s where you left it.</span>
          </h1>
          <p className="mt-5 max-w-md text-[13.5px] leading-relaxed text-white/40">
            Your vision baseline, progress, and every past conversation are
            synced. Pick up the thread.
          </p>
        </div>
        <p className="text-[11px] text-white/25">© 2026 Neaven</p>
      </div>

      {/* Right panel — auth */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-baseline gap-1.5 select-none lg:hidden">
            <span className="text-[17px] font-semibold tracking-[-0.02em]">neaven</span>
            <span className="inline-block h-[6px] w-[6px] rounded-full bg-accent" />
          </Link>
          <SignIn path="/login" signUpUrl="/signup" appearance={clerkAppearance} />
        </div>
      </div>
    </div>
  );
}
