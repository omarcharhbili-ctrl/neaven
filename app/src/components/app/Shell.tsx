"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { ReactNode } from "react";
import { UserButton } from "@clerk/nextjs";

/* ---------------------------------------------------------------------------
   Shell — a single top bar. Wordmark, flat text nav with a brass underline
   for the active surface, account on the right. Content owns everything
   below the hairline.
--------------------------------------------------------------------------- */

const NAV = [
  { href: "/dashboard", label: "Today" },
  { href: "/cofounder", label: "Co-founder" },
  { href: "/watcher", label: "Watcher" },
  { href: "/analytics", label: "Analytics" },
  { href: "/agents", label: "Automations" },
  { href: "/connectors", label: "Connectors" },
];

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display inline-flex select-none items-baseline gap-1.5 ${className}`}>
      <span className="text-[16px] font-semibold tracking-[-0.01em]">neaven</span>
      <span className="inline-block h-[6px] w-[6px] translate-y-[-1px] rounded-full bg-accent" />
    </span>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="flex h-[52px] shrink-0 items-stretch justify-between border-b border-border bg-raised/80 px-5 backdrop-blur">
        <div className="flex items-stretch gap-7">
          <Link href="/dashboard" className="flex items-center">
            <Wordmark />
          </Link>
          <nav className="flex items-stretch gap-1 overflow-x-auto">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center px-3 text-[13px] transition-colors duration-150 ${
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-secondary-foreground"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-t bg-accent" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            aria-label="Settings"
            className={`rounded-md p-2 transition-colors ${
              pathname.startsWith("/settings")
                ? "text-accent"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Settings className="h-4 w-4" strokeWidth={1.8} />
          </Link>
          <UserButton appearance={{ elements: { avatarBox: "h-7 w-7" } }} />
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
