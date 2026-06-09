"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/StitchUI";
import { useAppStore } from "@/store";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const setAuth = useAppStore((state) => state.setAuth);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const verificationToken = searchParams?.get("token");
    if (verificationToken) {
      setToken(verificationToken);
      verifyEmail(verificationToken);
    } else {
      setStatus("error");
      setMessage("No verification token found in the URL.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyEmail = async (verificationToken: string) => {
    setStatus("loading");
    try {
      // Use the Next.js proxy (/api/v1 → localhost:4000) — works on any device
      const response = await fetch(
        `/api/v1/auth/verify-email?token=${verificationToken}`
      );
      const data = await response.json();

      if (response.ok && data.access_token && data.user) {
        setAuth(data.user, data.access_token);
        setStatus("success");
        setTimeout(() => {
          router.replace(data.user.role === "doctor" ? "/dashboard/doctor" : "/dashboard/parent");
        }, 1500);
      } else {
        setStatus("error");
        setMessage(data.message || data.error || "Verification failed. The link may have expired.");
      }
    } catch {
      setStatus("error");
      setMessage("Could not reach the server. Make sure the app is open in your browser.");
    }
  };

  return (
    <Card className="max-w-md w-full p-10 rounded-3xl bg-white shadow-xl text-center">
      {status === "loading" && (
        <>
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-container flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
          <h1 className="font-headline font-extrabold text-2xl text-primary mb-2">Verifying your email…</h1>
          <p className="text-on-surface-muted text-sm">Hang tight, securing your session.</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-secondary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h1 className="font-headline font-extrabold text-2xl text-secondary mb-2">Email verified!</h1>
          <p className="text-on-surface-muted text-sm">Redirecting you to your dashboard…</p>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-error/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-error" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
          </div>
          <h1 className="font-headline font-extrabold text-2xl text-error mb-3">Verification Failed</h1>
          <p className="text-on-surface-muted text-sm mb-6">{message}</p>
          <div className="space-y-3">
            {token && (
              <button
                onClick={() => verifyEmail(token)}
                className="w-full bg-primary text-on-primary px-8 py-3 rounded-full font-bold hover:bg-primary-dim transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Retry
              </button>
            )}
            <button
              onClick={() => router.push("/login")}
              className="w-full border border-outline-variant/30 text-on-surface px-8 py-3 rounded-full font-bold hover:bg-surface-container-low transition-all"
            >
              Go to Login
            </button>
          </div>
        </>
      )}
    </Card>
  );
}
