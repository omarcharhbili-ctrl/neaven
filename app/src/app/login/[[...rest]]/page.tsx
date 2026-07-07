import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Wordmark } from "@/components/app/Shell";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-6">
      {/* Faint brass glow behind the card */}
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
        <SignIn path="/login" signUpUrl="/signup" appearance={clerkAppearance} />
      </div>
      <p className="relative mt-8 max-w-xs text-center font-mono text-[11px] leading-relaxed text-faint-foreground">
        Your vision baseline, progress, and every past argument — where you
        left them.
      </p>
    </div>
  );
}
