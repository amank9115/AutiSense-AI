"use client";

import React from "react";
import { useAppStore } from "@/store";

/**
 * Accessibility settings panel for high contrast, reduced motion, and font size.
 */
const AccessibilitySettings: React.FC = () => {
  const { accessibility, setAccessibility, toggleHighContrast } = useAppStore();

  return (
    <div className="space-y-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
      <h3 className="font-semibold text-on-surface flex items-center gap-2">
        <span className="material-symbols-outlined text-primary" aria-hidden="true">accessibility</span>
        Accessibility
      </h3>

      <div className="space-y-3">
        {/* High Contrast */}
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-sm text-on-surface-variant group-hover:text-on-surface">
            High contrast mode
          </span>
          <button
            role="switch"
            aria-checked={accessibility.highContrast}
            onClick={toggleHighContrast}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              accessibility.highContrast ? "bg-primary" : "bg-surface-container-highest"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                accessibility.highContrast ? "translate-x-5" : "translate-x-0"
              }`}
              aria-hidden="true"
            />
            <span className="sr-only">Toggle high contrast mode</span>
          </button>
        </label>

        {/* Reduced Motion */}
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-sm text-on-surface-variant group-hover:text-on-surface">
            Reduce motion
          </span>
          <button
            role="switch"
            aria-checked={accessibility.reducedMotion}
            onClick={() => setAccessibility({ reducedMotion: !accessibility.reducedMotion })}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              accessibility.reducedMotion ? "bg-primary" : "bg-surface-container-highest"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                accessibility.reducedMotion ? "translate-x-5" : "translate-x-0"
              }`}
              aria-hidden="true"
            />
            <span className="sr-only">Toggle reduced motion</span>
          </button>
        </label>

        {/* Font Size */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-on-surface-variant">Text size</span>
          <select
            value={accessibility.fontSize}
            onChange={(e) => setAccessibility({ fontSize: e.target.value as 'normal' | 'large' | 'xlarge' })}
            className="text-sm bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-1.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-accent"
            aria-label="Select text size"
          >
            <option value="normal">Normal</option>
            <option value="large">Large</option>
            <option value="xlarge">Extra large</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default AccessibilitySettings;
