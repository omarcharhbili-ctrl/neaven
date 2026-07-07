// Shared Clerk appearance — keeps the auth UI inside Neaven's calm, restrained
// design language instead of Clerk's defaults.
export const clerkAppearance = {
  variables: {
    colorPrimary: "#0f172a",
    colorText: "#1a1a1a",
    colorTextSecondary: "#737373",
    colorBackground: "#ffffff",
    colorInputBackground: "#fafafa",
    colorInputText: "#1a1a1a",
    borderRadius: "0.5rem",
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  },
  elements: {
    card: "shadow-none border border-[#e5e5e5]",
    headerTitle: "text-lg",
    formButtonPrimary:
      "bg-[#0f172a] hover:bg-[#1e293b] text-sm normal-case shadow-none",
    footerActionLink: "text-[#f97316] hover:text-[#f97316]",
  },
} as const;
