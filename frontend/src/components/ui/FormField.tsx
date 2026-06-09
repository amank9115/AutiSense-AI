"use client";

import React from "react";

interface FormFieldProps {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  id,
  error,
  hint,
  children,
  className = "",
}) => (
  <div className={`space-y-1.5 ${className}`}>
    <label
      htmlFor={id}
      className="block font-headline font-semibold text-sm px-1 text-on-surface"
    >
      {label}
    </label>
    {children}
    {error && (
      <p className="text-xs text-error font-medium px-1 flex items-center gap-1" role="alert">
        <span className="material-symbols-outlined text-base leading-none">error</span>
        {error}
      </p>
    )}
    {!error && hint && (
      <p className="text-xs text-on-surface-muted px-1">{hint}</p>
    )}
  </div>
);

export default FormField;
