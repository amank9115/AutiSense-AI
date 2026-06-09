"use client";

import React from "react";

const RULES = [
  { label: "8+ characters",         test: (v: string) => v.length >= 8 },
  { label: "Uppercase letter",       test: (v: string) => /[A-Z]/.test(v) },
  { label: "Lowercase letter",       test: (v: string) => /[a-z]/.test(v) },
  { label: "Number",                 test: (v: string) => /\d/.test(v) },
  { label: "Special character",      test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

interface Props {
  value: string;
}

export function PasswordStrengthIndicator({ value }: Props) {
  if (!value) return null;

  const passed = RULES.filter((r) => r.test(value)).length;
  const strength = passed <= 1 ? "weak" : passed <= 3 ? "fair" : passed <= 4 ? "good" : "strong";
  const barColor = { weak: "bg-error", fair: "bg-tertiary", good: "bg-primary-accent", strong: "bg-secondary" }[strength];

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex gap-1 h-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-colors duration-300 ${i <= passed ? barColor : "bg-surface-container-high"}`}
          />
        ))}
      </div>
      {/* Rule list */}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
        {RULES.map((rule) => {
          const ok = rule.test(value);
          return (
            <li key={rule.label} className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? "text-secondary" : "text-on-surface-muted"}`}>
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: ok ? "'FILL' 1" : "'FILL' 0" }}>
                {ok ? "check_circle" : "radio_button_unchecked"}
              </span>
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
