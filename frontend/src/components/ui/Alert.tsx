"use client";

import React from "react";

type AlertVariant = "info" | "warning" | "error" | "success";

const styles: Record<AlertVariant, { container: string; icon: string; defaultIcon: string }> = {
  info: { container: "bg-primary-container/40 border-primary/30", icon: "text-primary", defaultIcon: "info" },
  warning: { container: "bg-tertiary-container/40 border-tertiary/40", icon: "text-tertiary", defaultIcon: "warning" },
  error: { container: "bg-error-container/20 border-error/40", icon: "text-error", defaultIcon: "report" },
  success: { container: "bg-secondary-container/40 border-secondary/30", icon: "text-secondary", defaultIcon: "check_circle" },
};

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  /** Material Symbols icon name; falls back to a sensible default per variant. */
  icon?: string;
  children?: React.ReactNode;
  className?: string;
  /** Set to "alert"/"status" for dynamically surfaced messages so screen readers announce them. */
  role?: "alert" | "status";
  action?: React.ReactNode;
}

/**
 * Prominent inline callout used for disclaimers, warnings, and error/empty messaging.
 * Built on the design-token palette so it stays on-brand in light/dark + high-contrast.
 */
export const Alert: React.FC<AlertProps> = ({
  variant = "info",
  title,
  icon,
  children,
  className = "",
  role,
  action,
}) => {
  const s = styles[variant];
  return (
    <div
      role={role}
      className={`flex items-start gap-3 rounded-2xl border border-l-4 p-4 ${s.container} ${className}`}
    >
      <span
        className={`material-symbols-outlined shrink-0 ${s.icon}`}
        style={{ fontVariationSettings: "'FILL' 1" }}
        aria-hidden="true"
      >
        {icon ?? s.defaultIcon}
      </span>
      <div className="min-w-0 flex-grow">
        {title && (
          <p className="font-headline font-bold text-sm text-on-surface mb-0.5">{title}</p>
        )}
        {children && (
          <div className="text-sm text-on-surface-variant leading-relaxed">{children}</div>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
};
