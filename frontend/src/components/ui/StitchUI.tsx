"use client";

import React from "react";

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

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div className={`bg-surface-container-lowest rounded-lg p-6 md:p-8 login-card border-none ${className}`}>
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
      className={`w-full px-6 py-4 rounded-full bg-surface-container-highest border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-bright font-headline transition-all outline-none ${className}`}
      {...props}
    />
  </div>
);
