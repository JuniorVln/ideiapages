"use client";

import { type InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ invalid, className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`
        w-full rounded-lg border px-3 py-2.5 text-sm text-text placeholder:text-text-subtle
        transition-colors duration-150 outline-none
        border-border focus:border-border-focus focus:ring-2 focus:ring-brand-primary/20
        disabled:opacity-50 disabled:cursor-not-allowed
        ${invalid ? "border-red-500 focus:border-red-500 focus:ring-red-200" : ""}
        ${className}
      `}
      {...props}
    />
  )
);

Input.displayName = "Input";
