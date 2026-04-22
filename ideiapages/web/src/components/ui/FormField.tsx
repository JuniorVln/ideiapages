"use client";

import { type InputHTMLAttributes, forwardRef, useId } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, id: externalId, className = "", ...props }, ref) => {
    const internalId = useId();
    const id = externalId ?? internalId;
    const errorId = `${id}-error`;

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium text-text">
          {label}
          {props.required && <span className="text-red-500 ml-0.5" aria-hidden>*</span>}
        </label>
        <input
          ref={ref}
          id={id}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? "true" : undefined}
          className={`
            w-full rounded-lg border px-3 py-2.5 text-sm text-text placeholder:text-text-subtle
            transition-colors duration-150 outline-none
            border-border focus:border-border-focus focus:ring-2 focus:ring-brand-primary/20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-red-500 focus:border-red-500 focus:ring-red-200" : ""}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-600 mt-0.5">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";
