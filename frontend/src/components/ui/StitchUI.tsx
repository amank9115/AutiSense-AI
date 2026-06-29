"use client";

import React from "react";
import { ChevronRight } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg" | "xl";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) => {
  const baseStyles = "font-headline font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-primary text-on-primary hover:bg-primary-dim shadow-lg shadow-primary/10",
    secondary: "bg-secondary-container text-on-secondary-container hover:bg-secondary/20",
    tertiary: "text-primary hover:text-primary-dim",
    ghost: "bg-transparent hover:bg-surface-container-high text-on-surface",
    outline: "border-2 border-primary text-primary hover:bg-primary hover:text-on-primary",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm rounded-full",
    md: "px-6 py-3 text-base rounded-full",
    lg: "px-8 py-4 text-lg rounded-full",
    xl: "px-10 py-5 text-xl rounded-full",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties; onClick?: () => void }> = ({
  children,
  className = "",
  style,
  onClick,
}) => (
  <div
    className={`bg-surface-container-lowest rounded-lg p-6 md:p-8 login-card border-none ${className}`}
    style={style}
    onClick={onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={
      onClick
        ? (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick();
            }
          }
        : undefined
    }
  >
    {children}
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({
  label,
  id,
  className = "",
  ...props
}) => (
  <div className="space-y-2">
    {label && (
      <label className="font-headline font-semibold text-sm px-4 text-on-surface" htmlFor={id}>
        {label}
      </label>
    )}
    <input
      id={id}
      className={`w-full px-6 py-4 rounded-full bg-surface-container-highest border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-bright font-headline transition-all focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none outline-none ${className}`}
      {...props}
    />
  </div>
);

// ─────────────────────────────────────────────────────────
// Skeleton — shimmer loading placeholder
// ─────────────────────────────────────────────────────────

interface SkeletonProps {
  variant?: "line" | "circle" | "card";
  className?: string;
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = "line",
  className = "",
  width,
  height,
}) => {
  const base = "skeleton-shimmer rounded-full";
  const variants = {
    line: "h-4 rounded-full",
    circle: "rounded-full aspect-square",
    card: "rounded-2xl",
  };

  return (
    <div
      className={`${base} ${variants[variant]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
};

// ─────────────────────────────────────────────────────────
// Badge — status pill
// ─────────────────────────────────────────────────────────

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "destructive" | "neutral";
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  children,
  className = "",
}) => {
  const variants = {
    default: "bg-primary-container text-on-primary-container",
    success: "bg-success-container text-success-dim",
    warning: "bg-tertiary-container text-on-tertiary-container",
    destructive: "bg-error-container/20 text-error",
    neutral: "bg-surface-container-high text-on-surface-variant",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-label ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

// ─────────────────────────────────────────────────────────
// EmptyState — consistent empty/zero-data placeholder
// ─────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "inbox",
  title,
  description,
  action,
  className = "",
}) => (
  <div className={`flex flex-col items-center justify-center gap-3 py-12 px-6 text-center ${className}`}>
    <span className="material-symbols-outlined text-5xl text-on-surface-muted">{icon}</span>
    <p className="font-headline font-semibold text-on-surface">{title}</p>
    {description && (
      <p className="text-sm text-on-surface-muted max-w-xs">{description}</p>
    )}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

// ─────────────────────────────────────────────────────────
// PageHeader — consistent dashboard page title block
// ─────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  action,
  breadcrumbs,
  className = "",
}) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {breadcrumbs && breadcrumbs.length > 0 && (
      <nav aria-label="breadcrumb" className="flex items-center gap-1 text-xs text-on-surface-muted mb-1">
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="w-3 h-3" />}
            {crumb.href ? (
              <a href={crumb.href} className="hover:text-on-surface transition-colors">{crumb.label}</a>
            ) : (
              <span aria-current={i === breadcrumbs.length - 1 ? "page" : undefined}>{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
    )}
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="font-headline font-bold text-2xl text-on-surface">{title}</h1>
        {description && (
          <p className="text-sm text-on-surface-muted mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  </div>
);
