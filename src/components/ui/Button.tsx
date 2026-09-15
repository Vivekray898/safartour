import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "whatsapp";
type Size = "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-dark focus-visible:outline-primary",
  secondary:
    "bg-secondary text-white hover:bg-secondary-dark focus-visible:outline-secondary",
  outline:
    "border border-border bg-transparent text-foreground hover:border-primary hover:text-primary focus-visible:outline-primary",
  ghost:
    "bg-transparent text-foreground hover:bg-foreground/5 focus-visible:outline-primary",
  whatsapp:
    "bg-[#25D366] text-white hover:bg-[#1da851] focus-visible:outline-[#1da851]",
};

const sizeClasses: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

type ButtonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
} & (
  | ({ href: string } & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">)
  | ({ href?: undefined } & Omit<
      ComponentProps<"button">,
      "className" | "children"
    >)
);

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const base = `inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if ("href" in rest && rest.href) {
    const { href, ...linkRest } = rest as { href: string } & Record<string, unknown>;
    return (
      <Link href={href} className={base} {...linkRest}>
        {children}
      </Link>
    );
  }
  const btnRest = rest as ComponentProps<"button">;
  return (
    <button className={base} {...btnRest}>
      {children}
    </button>
  );
}

export { variantClasses };
