"use client";

import { type LabelHTMLAttributes } from "react";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  requiredIndicator?: boolean;
}

export function Label({ children, className = "", requiredIndicator, ...props }: LabelProps) {
  return (
    <label
      className={`text-sm font-medium text-text ${className}`}
      {...props}
    >
      {children}
      {requiredIndicator && (
        <span className="text-red-500 ml-0.5" aria-hidden>
          *
        </span>
      )}
    </label>
  );
}
