"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GuidanceTip {
  type: "encouragement" | "suggestion" | "alert" | "guidance";
  message: string;
  action?: string;
}

interface ParentGuidanceOverlayProps {
  tips: GuidanceTip[];
  onDismiss?: () => void;
  autoHideMs?: number;
}

/**
 * Overlay component that displays real-time guidance for parents
 * during screening sessions.
 */
const ParentGuidanceOverlay: React.FC<ParentGuidanceOverlayProps> = ({
  tips,
  onDismiss,
  autoHideMs = 8000,
}) => {
  const [visibleTip, setVisibleTip] = useState<GuidanceTip | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (tips.length > 0 && !dismissed) {
      // Show the most recent tip
      setVisibleTip(tips[tips.length - 1]);
    }
  }, [tips, dismissed]);

  useEffect(() => {
    if (visibleTip && autoHideMs > 0) {
      const timer = setTimeout(() => {
        setVisibleTip(null);
      }, autoHideMs);
      return () => clearTimeout(timer);
    }
  }, [visibleTip, autoHideMs]);

  const handleDismiss = () => {
    setDismissed(true);
    setVisibleTip(null);
    onDismiss?.();
  };

  const getTypeStyles = (type: GuidanceTip["type"]) => {
    switch (type) {
      case "encouragement":
        return {
          bg: "bg-success/95",
          icon: "thumb_up",
          border: "border-success",
        };
      case "suggestion":
        return {
          bg: "bg-primary/95",
          icon: "lightbulb",
          border: "border-primary",
        };
      case "alert":
        return {
          bg: "bg-error/95",
          icon: "warning",
          border: "border-error",
        };
      case "guidance":
        return {
          bg: "bg-secondary/95",
          icon: "school",
          border: "border-secondary",
        };
    }
  };

  return (
    <AnimatePresence>
      {visibleTip && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 50, x: "-50%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 z-50 max-w-md w-[calc(100%-2rem)]"
          role="alert"
          aria-live="polite"
        >
          <div
            className={`rounded-2xl border ${getTypeStyles(visibleTip.type).border} ${
              getTypeStyles(visibleTip.type).bg
            } text-white p-4 shadow-xl`}
          >
            <div className="flex items-start gap-3">
              <span
                className="material-symbols-outlined text-2xl shrink-0"
                aria-hidden="true"
              >
                {getTypeStyles(visibleTip.type).icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-relaxed">
                  {visibleTip.message}
                </p>
                {visibleTip.action && (
                  <button
                    onClick={handleDismiss}
                    className="mt-2 text-xs font-semibold underline underline-offset-2 hover:no-underline"
                  >
                    Got it
                  </button>
                )}
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                aria-label="Dismiss"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ParentGuidanceOverlay;

/**
 * Hook to manage guidance tips state
 */
export const useGuidanceTips = () => {
  const [tips, setTips] = useState<GuidanceTip[]>([]);

  const addTip = (tip: GuidanceTip) => {
    setTips((prev) => [...prev, { ...tip, action: tip.action || Date.now().toString() }]);
  };

  const clearTips = () => {
    setTips([]);
  };

  return { tips, addTip, clearTips };
};
