"use client";

import { Button } from "@/components/Button";
import {
  Settings,
  User,
  Bell,
  Shield,
  Wrench,
  CreditCard,
  Link2,
  LogOut,
  ChevronRight,
  Check,
  Eye,
  MessageSquare,
  Brain,
  Moon,
  Sun,
  Globe,
  Mail,
  Smartphone,
  Monitor,
  Trash2,
} from "lucide-react";
import { useState } from "react";

type Tab = "profile" | "notifications" | "connections" | "watcher" | "billing" | "security";

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-10 h-5.5 rounded-full transition-colors ${
        enabled ? "bg-accent" : "bg-muted"
      }`}
    >
      <div
        className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-raised shadow-sm transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function SettingRow({ label, description, children }: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [notifications, setNotifications] = useState({
    morningDigest: true,
    midSessionNudge: true,
    endOfDay: true,
    driftAlerts: true,
    emailDigest: false,
    slackNotifs: true,
  });

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "connections", label: "Connections", icon: Link2 },
    { id: "watcher", label: "Watcher settings", icon: Eye },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-5 h-5 text-muted-foreground" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account, connections, and preferences.</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar nav */}
        <nav className="w-48 shrink-0 space-y-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && (
            <div className="rounded-xl border border-border bg-raised p-6">
              <h2 className="font-semibold mb-6">Profile</h2>
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                <div className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center text-xl font-bold">
                  O
                </div>
                <div>
                  <p className="font-medium">Omar Charhbili</p>
                  <p className="text-sm text-muted-foreground">omar.charhbili@e-polytechnique.ma</p>
                  <button className="text-xs text-accent hover:underline mt-1">Change photo</button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Full name</label>
                  <input
                    type="text"
                    defaultValue="Omar Charhbili"
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email</label>
                  <input
                    type="email"
                    defaultValue="omar.charhbili@e-polytechnique.ma"
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Role</label>
                  <select className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent bg-raised">
                    <option>Solo founder</option>
                    <option>Co-founder (technical)</option>
                    <option>Co-founder (non-technical)</option>
                    <option>Team lead</option>
                    <option>Developer</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button>Save changes</Button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="rounded-xl border border-border bg-raised p-6">
              <h2 className="font-semibold mb-6">Notifications</h2>
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Co-founder notifications</h3>
                <SettingRow label="Morning digest" description="Daily briefing at 8:00 AM with priorities and progress">
                  <ToggleSwitch enabled={notifications.morningDigest} onChange={() => setNotifications({ ...notifications, morningDigest: !notifications.morningDigest })} />
                </SettingRow>
                <SettingRow label="Mid-session nudges" description="Real-time course corrections during coding sessions">
                  <ToggleSwitch enabled={notifications.midSessionNudge} onChange={() => setNotifications({ ...notifications, midSessionNudge: !notifications.midSessionNudge })} />
                </SettingRow>
                <SettingRow label="End-of-day recap" description="Summary of what you accomplished and what's next">
                  <ToggleSwitch enabled={notifications.endOfDay} onChange={() => setNotifications({ ...notifications, endOfDay: !notifications.endOfDay })} />
                </SettingRow>
                <SettingRow label="Drift alerts" description="Immediate notification when prompts drift from the brief">
                  <ToggleSwitch enabled={notifications.driftAlerts} onChange={() => setNotifications({ ...notifications, driftAlerts: !notifications.driftAlerts })} />
                </SettingRow>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Delivery channels</h3>
                <SettingRow label="Email digest" description="Weekly summary via email">
                  <ToggleSwitch enabled={notifications.emailDigest} onChange={() => setNotifications({ ...notifications, emailDigest: !notifications.emailDigest })} />
                </SettingRow>
                <SettingRow label="Slack notifications" description="Push to your Slack workspace">
                  <ToggleSwitch enabled={notifications.slackNotifs} onChange={() => setNotifications({ ...notifications, slackNotifs: !notifications.slackNotifs })} />
                </SettingRow>
              </div>
            </div>
          )}

          {activeTab === "connections" && (
            <div className="rounded-xl border border-border bg-raised p-6">
              <h2 className="font-semibold mb-6">Connections</h2>
              <div className="space-y-3">
                {[
                  { name: "Claude Code", status: "connected", description: "Coding agent via MCP" },
                  { name: "GitHub", status: "connected", description: "Repository access" },
                  { name: "Slack", status: "connected", description: "Notifications & co-founder chat" },
                  { name: "Linear", status: "not-connected", description: "Task management" },
                  { name: "Cursor", status: "not-connected", description: "Coding agent via MCP" },
                  { name: "Notion", status: "not-connected", description: "Documentation & wiki" },
                  { name: "Google Calendar", status: "not-connected", description: "Schedule & deadlines" },
                ].map((conn) => (
                  <div key={conn.name} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-surface transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center">
                        <Wrench className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{conn.name}</p>
                        <p className="text-xs text-muted-foreground">{conn.description}</p>
                      </div>
                    </div>
                    {conn.status === "connected" ? (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs text-success">
                          <Check className="w-3 h-3" /> Connected
                        </span>
                        <Button variant="ghost" size="sm">Disconnect</Button>
                      </div>
                    ) : (
                      <Button variant="secondary" size="sm">Connect</Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "watcher" && (
            <div className="rounded-xl border border-border bg-raised p-6">
              <h2 className="font-semibold mb-6">Watcher settings</h2>
              <SettingRow label="Auto-refine prompts" description="Automatically enrich prompts with context from the brief before sending">
                <ToggleSwitch enabled={true} onChange={() => {}} />
              </SettingRow>
              <SettingRow label="Drift sensitivity" description="How aggressively to flag off-roadmap work">
                <select className="px-3 py-1.5 rounded-lg border border-border text-sm bg-raised">
                  <option>Low — only flag major drift</option>
                  <option>Medium — balanced (recommended)</option>
                  <option>High — flag everything off-brief</option>
                </select>
              </SettingRow>
              <SettingRow label="Agentic loops" description="Allow Watcher to run prompt → code → test → fix loops automatically">
                <ToggleSwitch enabled={true} onChange={() => {}} />
              </SettingRow>
              <SettingRow label="Max loop iterations" description="Maximum iterations before stopping and asking for input">
                <select className="px-3 py-1.5 rounded-lg border border-border text-sm bg-raised">
                  <option>3 iterations</option>
                  <option>5 iterations</option>
                  <option>10 iterations</option>
                  <option>Unlimited</option>
                </select>
              </SettingRow>
              <SettingRow label="Session auto-detection" description="Automatically detect when you start coding and begin watching">
                <ToggleSwitch enabled={true} onChange={() => {}} />
              </SettingRow>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="rounded-xl border border-border bg-raised p-6">
              <h2 className="font-semibold mb-6">Billing</h2>
              <div className="p-4 rounded-lg bg-surface border border-border mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Free plan</p>
                    <p className="text-xs text-muted-foreground">1 project, 5 sessions/week</p>
                  </div>
                  <Button size="sm">Upgrade to Pro — $29/mo</Button>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Usage this week</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground">Sessions used</p>
                    <p className="text-lg font-bold">3 / 5</p>
                    <div className="w-full h-1.5 bg-muted rounded-full mt-2">
                      <div className="h-full bg-accent rounded-full" style={{ width: "60%" }} />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground">Prompts refined</p>
                    <p className="text-lg font-bold">8</p>
                    <p className="text-xs text-muted-foreground mt-1">No limit on free plan</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="rounded-xl border border-border bg-raised p-6">
              <h2 className="font-semibold mb-6">Security</h2>
              <SettingRow label="Change password" description="Last changed 30 days ago">
                <Button variant="secondary" size="sm">Change</Button>
              </SettingRow>
              <SettingRow label="Two-factor authentication" description="Add an extra layer of security to your account">
                <Button variant="secondary" size="sm">Enable</Button>
              </SettingRow>
              <SettingRow label="Active sessions" description="You're logged in on 2 devices">
                <Button variant="ghost" size="sm">Manage</Button>
              </SettingRow>
              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="text-sm font-medium text-error mb-2">Danger zone</h3>
                <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50">
                  <div>
                    <p className="text-sm font-medium">Delete account</p>
                    <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="danger" size="sm">
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
