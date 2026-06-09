"use client";

import React from "react";
import { Button } from "./StitchUI";

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  variant?: "primary" | "secondary" | "tertiary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg" | "xl";
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  children,
  disabled,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) => (
  <Button
    variant={variant}
    size={size}
    disabled={disabled || loading}
    aria-busy={loading}
    className={`relative ${loading ? "opacity-80 cursor-not-allowed" : ""} ${className}`}
    {...props}
  >
    {loading ? (
      <>
        <span
          className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"
          aria-hidden="true"
        />
        {loadingText ?? children}
      </>
    ) : (
      children
    )}
  </Button>
);

export default LoadingButton;
