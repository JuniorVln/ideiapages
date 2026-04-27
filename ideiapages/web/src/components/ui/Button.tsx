import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "ghost" | "whatsapp" | "outline" | "ideia";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-primary text-white hover:bg-brand-primary-dark focus-visible:ring-brand-primary",
  ghost:
    "bg-transparent text-brand-primary hover:bg-blue-50 focus-visible:ring-brand-primary",
  whatsapp:
    "bg-[var(--color-brand-cta)] text-[var(--color-brand-cta-text)] hover:bg-[var(--color-brand-cta-dark)] focus-visible:ring-[var(--color-brand-cta)] font-semibold shadow-md",
  outline:
    "border border-border-focus text-brand-primary hover:bg-blue-50 focus-visible:ring-brand-primary",
  /** CTA Ideia Chat (azul marca); PageCTA usa com className que pode sobrescrever p/ gradiente. */
  ideia:
    "bg-brand-primary text-white hover:bg-brand-primary-dark focus-visible:ring-brand-primary font-semibold shadow-md",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-5 py-2.5 text-base rounded-lg",
  lg: "px-7 py-3.5 text-lg rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, children, className = "", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        className={`${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {loading && (
          <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
