// Clerk appearance — keeps the auth UI inside Neaven's ink & paper system.
export const clerkAppearance = {
  variables: {
    colorPrimary: "#14705c",
    colorText: "#1a2620",
    colorTextSecondary: "#79857e",
    colorBackground: "#ffffff",
    colorInputBackground: "#faf9f6",
    colorInputText: "#1a2620",
    colorDanger: "#b3382c",
    borderRadius: "0.625rem",
    fontFamily: "var(--font-instrument), system-ui, sans-serif",
  },
  elements: {
    card: "shadow-none border border-[#e5e1d8]",
    headerTitle: "text-[17px] tracking-[-0.01em]",
    formButtonPrimary:
      "bg-[#14705c] hover:bg-[#0d5a49] text-[13px] font-medium normal-case shadow-none",
    footerActionLink: "text-[#14705c] hover:text-[#0d5a49]",
    formFieldInput: "border-[#e5e1d8]",
  },
} as const;
