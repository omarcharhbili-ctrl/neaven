"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Eye,
  MessageSquare,
  Settings,
  BarChart3,
  Workflow,
  Plug,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { useState, ReactNode } from "react";
import { UserButton, useUser } from "@clerk/nextjs";

const navItems = [
  { href: "/dashboard", label: "Today", icon: LayoutDashboard },
  { href: "/cofounder", label: "Co-founder", icon: MessageSquare },
  { href: "/watcher", label: "Watcher", icon: Eye },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/agents", label: "Automations", icon: Workflow },
  { href: "/connectors", label: "Connectors", icon: Plug },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13.5px] transition-colors duration-150 ${
        active
          ? "bg-accent-soft text-accent font-medium"
          : "text-secondary-foreground hover:bg-surface hover:text-foreground"
      } ${collapsed ? "justify-center" : ""}`}
    >
      <Icon
        className={`h-4 w-4 shrink-0 transition-colors ${
          active ? "text-accent" : "text-muted-foreground group-hover:text-foreground"
        }`}
        strokeWidth={active ? 2.1 : 1.8}
      />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useUser();

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <aside
        className={`${
          collapsed ? "w-[60px]" : "w-[224px]"
        } flex flex-col border-r border-border transition-[width] duration-200 shrink-0`}
      >
        {/* Wordmark */}
        <div
          className={`flex h-14 items-center ${collapsed ? "justify-center px-0" : "justify-between px-4"}`}
        >
          {!collapsed && (
            <Link href="/dashboard" className="flex items-baseline gap-1.5 select-none">
              <span className="text-[17px] font-semibold tracking-[-0.02em]">
                neaven
              </span>
              <span className="h-[7px] w-[7px] translate-y-[-1px] rounded-full bg-accent inline-block" />
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" strokeWidth={1.8} />
            ) : (
              <PanelLeftClose className="h-4 w-4" strokeWidth={1.8} />
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 pt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              active={pathname.startsWith(item.href)}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* Account */}
        <div className="border-t border-border px-2.5 py-2.5 space-y-0.5">
          <NavLink
            href="/settings"
            label="Settings"
            icon={Settings}
            active={pathname.startsWith("/settings")}
            collapsed={collapsed}
          />
          <div
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <UserButton
              appearance={{
                elements: { avatarBox: "h-6 w-6" },
              }}
            />
            {!collapsed && (
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[13px] font-medium">
                  {user?.firstName ?? user?.fullName ?? "Account"}
                </p>
                <p className="truncate text-[11.5px] text-muted-foreground">
                  {user?.primaryEmailAddress?.emailAddress ?? ""}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}
