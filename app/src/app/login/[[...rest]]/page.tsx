import { Logo } from "@/components/Logo";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between">
        <Link href="/" className="text-white/80 hover:text-white inline-flex items-center gap-2 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        <div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Welcome back.
            <br />
            <span className="text-white/60">Your co-founder is ready.</span>
          </h1>
          <p className="mt-4 text-white/40 text-sm leading-relaxed max-w-md">
            Pick up right where you left off. Your overview, Qode, and chat are synced and ready.
          </p>
        </div>
        <p className="text-white/20 text-xs">&copy; 2026 Neaven</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden mb-8 inline-block">
            <Logo />
          </Link>
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/signup"
            fallbackRedirectUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 p-0 w-full",
                headerTitle: "text-2xl font-bold",
                headerSubtitle: "text-sm text-muted-foreground",
                formButtonPrimary:
                  "bg-accent hover:bg-accent/90 text-sm normal-case",
                footerActionLink: "text-accent hover:underline",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
