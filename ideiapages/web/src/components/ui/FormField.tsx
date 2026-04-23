"use client";

import { type InputHTMLAttributes, forwardRef, useId } from "react";
import { Input } from "./Input";
import { Label } from "./Label";

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
        <Label htmlFor={id} requiredIndicator={Boolean(props.required)}>
          {label}
        </Label>
        <Input
          ref={ref}
          id={id}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? "true" : undefined}
          invalid={Boolean(error)}
          className={className}
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
