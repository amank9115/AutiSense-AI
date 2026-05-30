"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LiveScreeningPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main screening page
    router.push("/screening");
  }, [router]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-on-surface-variant text-sm font-medium animate-pulse">
          Preparing live screening session...
        </p>
      </div>
    </div>
  );
}