// Clerk appearance — graphite & brass, dark.
export const clerkAppearance = {
  variables: {
    colorPrimary: "#d9a441",
    colorText: "#e9e7e2",
    colorTextSecondary: "#a9aeb6",
    colorTextOnPrimaryBackground: "#14100a",
    colorBackground: "#151b22",
    colorInputBackground: "#0e1116",
    colorInputText: "#e9e7e2",
    colorNeutral: "#e9e7e2",
    colorDanger: "#e25d4f",
    borderRadius: "0.625rem",
    fontFamily: "var(--font-plex), system-ui, sans-serif",
  },
  elements: {
    card: "shadow-none border border-[#222a33] bg-[#151b22]",
    headerTitle: "text-[17px] tracking-[-0.01em] !text-[#e9e7e2]",
    headerSubtitle: "!text-[#a9aeb6]",
    dividerText: "!text-[#6e7681]",
    formFieldLabel: "!text-[#a9aeb6]",
    footer: "!bg-none !bg-[#11161c]",
    footerActionText: "!text-[#6e7681]",
    formButtonPrimary:
      "bg-[#d9a441] hover:bg-[#e5b558] text-[#14100a] text-[13px] font-medium normal-case shadow-none",
    footerActionLink: "text-[#d9a441] hover:text-[#e5b558]",
    formFieldInput: "border-[#303a45]",
    socialButtonsBlockButton: "border-[#303a45] text-[#e9e7e2]",
    dividerLine: "bg-[#222a33]",
  },
} as const;
