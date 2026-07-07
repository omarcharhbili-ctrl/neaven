import { Shell } from "@/components/app/Shell";

// Analytics is preserved exactly as verified on the previous light system —
// .theme-paper scopes those token values to this route only.
export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Shell>
      <div className="theme-paper min-h-full">{children}</div>
    </Shell>
  );
}
