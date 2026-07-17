import { Logo } from "@/components/Logo";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { SignUp } from "@clerk/nextjs";

export default function SignupPage() {
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
            Start shipping
            <br />
            <span className="text-white/60">with a co-founder by your side.</span>
          </h1>
          <ul className="mt-8 space-y-4">
            {[
              "Set up your project overview in 5 minutes",
              "Connect your coding agent instantly",
              "Get your first co-founder nudge today",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-white/70 text-sm">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-white/20 text-xs">&copy; 2026 Neaven</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden mb-8 inline-block">
            <Logo />
          </Link>
          <SignUp
            routing="path"
            path="/signup"
            signInUrl="/login"
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
