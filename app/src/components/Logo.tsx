"use client";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  };
  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  };

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${sizes[size]} bg-primary rounded-lg flex items-center justify-center`}
      >
        <span className="text-white font-bold tracking-tight">N</span>
      </div>
      <span className={`${textSizes[size]} font-semibold text-foreground tracking-tight`}>
        neaven
      </span>
    </div>
  );
}
