"use client";

import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";

type Size = "sm" | "md" | "lg";

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-5 py-2.5 text-base rounded-lg",
  lg: "px-7 py-3.5 text-lg rounded-2xl",
};

/** CTA sólido verde WhatsApp; rola até a âncore (ex.: #demonstracao-gratuita). */
export const ScrollToSectionButton = forwardRef<
  HTMLButtonElement,
  {
    targetId: string;
    size?: Size;
    children: ReactNode;
    className?: string;
  } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick">
>(({ targetId, size = "md", className = "", children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }}
      className={
        "inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-150 " +
        "text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
        "disabled:opacity-50 disabled:cursor-not-allowed " +
        "bg-[var(--color-brand-cta)] hover:bg-[var(--color-brand-cta-dark)] " +
        "focus-visible:ring-[var(--color-brand-cta)] shadow-md " +
        sizeClasses[size] +
        " " +
        className
      }
      {...props}
    >
      <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
      {children}
    </button>
  );
});
ScrollToSectionButton.displayName = "ScrollToSectionButton";
