"use client";

import React from "react";

interface FormFieldProps {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  id,
  error,
  hint,
  required,
  children,
  className = "",
}) => {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label
        htmlFor={id}
        className="block font-headline font-semibold text-sm px-1 text-on-surface"
      >
        {label}
        {required && <span className="text-error ml-1" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && (
        <p id={errorId} className="text-xs text-error font-medium px-1 flex items-center gap-1" role="alert" aria-live="polite">
          <span className="material-symbols-outlined text-base leading-none" aria-hidden="true">error</span>
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={hintId} className="text-xs text-on-surface-muted px-1">{hint}</p>
      )}
    </div>
  );
};

export default FormField;
