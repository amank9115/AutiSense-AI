"use client";

import React from "react";

type SkipLinkProps = {
  targetId: string;
  label?: string;
};

/**
 * Skip-to-content link for keyboard and screen reader users.
 * Allows users to bypass navigation and jump directly to main content.
 */
const SkipLink: React.FC<SkipLinkProps> = ({
  targetId,
  label = "Skip to main content",
}) => {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-primary focus:text-on-primary focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
    >
      {label}
    </a>
  );
};

export default SkipLink;
