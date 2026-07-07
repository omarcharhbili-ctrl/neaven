import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Wordmark } from "@/components/app/Shell";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignupPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(560px 320px at 50% 38%, rgba(217,164,65,0.07), transparent 70%)",
        }}
      />
      <Link href="/" className="relative mb-8">
        <Wordmark />
      </Link>
      <div className="relative">
        <SignUp path="/signup" signInUrl="/login" appearance={clerkAppearance} />
      </div>
      <p className="relative mt-8 max-w-xs text-center font-mono text-[11px] leading-relaxed text-faint-foreground">
        First step: set your vision baseline. Everything Neaven argues from
        hangs off it.
      </p>
    </div>
  );
}
