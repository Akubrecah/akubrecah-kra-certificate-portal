"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, ArrowRight, X } from "lucide-react";
import Link from "next/link";

interface ProfileWarningPopupProps {
  isProfileComplete: boolean;
}

export default function ProfileWarningPopup({ isProfileComplete }: ProfileWarningPopupProps) {
  const [dismissCount, setDismissCount] = useState(0);
  const [isDismissedThisVisit, setIsDismissedThisVisit] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const count = parseInt(localStorage.getItem("profile_dismiss_count") || "0", 10);
    setDismissCount(count);
  }, []);

  if (!isMounted || isProfileComplete || isDismissedThisVisit) {
    return null;
  }

  const handleDismiss = () => {
    const nextCount = dismissCount + 1;
    localStorage.setItem("profile_dismiss_count", String(nextCount));
    setDismissCount(nextCount);
    setIsDismissedThisVisit(true);
  };

  const canDismiss = dismissCount < 3;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-2xl shadow-xl p-5 animate-in slide-in-from-bottom-5">
      <div className="flex gap-3">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/60 rounded-xl h-max">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-950 dark:text-amber-200 text-sm">
              Complete Your Profile
            </span>
            {canDismiss && (
              <button
                onClick={handleDismiss}
                className="p-1 rounded-lg hover:bg-amber-200/50 dark:hover:bg-amber-900/40 transition-colors text-amber-700 dark:text-amber-400"
                title="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
            Please update your Full Name and Phone Number. This is required to access KRA services and CV builder.
          </p>
          <div className="pt-2 flex items-center justify-between gap-4">
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 dark:text-amber-200 hover:underline"
            >
              Update Details <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            {!canDismiss && (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                Required Action
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
