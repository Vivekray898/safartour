export default function Badge({
  children,
  variant = "light",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "light" | "dark" | "primary" | "secondary";
  className?: string;
}) {
  const variants = {
    light: "bg-white/90 text-foreground backdrop-blur-sm",
    dark: "bg-foreground/80 text-white backdrop-blur-sm",
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary-dark",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
