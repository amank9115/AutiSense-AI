"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar, Footer } from "@/components/layout/Navigation";
import { Card } from "@/components/ui/StitchUI";
import { useAppStore } from "@/store";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [message, setMessage] = useState("");
  const setAuth = useAppStore((state) => state.setAuth);

  useEffect(() => {
    const verificationToken = searchParams.get("token");
    if (verificationToken) {
      verifyEmail(verificationToken);
    } else {
      setStatus("error");
      setMessage("No verification token provided in the URL.");
    }
  }, [searchParams]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3003"}/api/v1/auth/verify-email?token=${verificationToken}`
      );
      const data = await response.json();

      if (response.ok && data.access_token && data.user) {
        // Auto-login with the token returned from verification
        setAuth(data.user, data.access_token);
        
        // Instantly redirect to the correct dashboard
        if (data.user.role === "doctor") {
          router.replace("/dashboard/doctor");
        } else {
          router.replace("/dashboard/parent");
        }
      } else {
        setStatus("error");
        setMessage(data.message || data.error || "Verification failed. The link may be expired.");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Failed to reach the server. Please check your connection.");
    }
  };

  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased flex flex-col">
      <Navbar />

      <main className="flex-grow flex items-center justify-center pt-24 pb-16 px-4">
        <Card className="max-w-md w-full p-8 rounded-3xl bg-white shadow-xl text-center">
          {status === "loading" && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-container flex items-center justify-center animate-pulse">
                <span className="material-symbols-outlined text-4xl text-primary">login</span>
              </div>
              <h1 className="font-headline font-extrabold text-2xl text-primary mb-4">Logging you in...</h1>
              <p className="text-on-surface-variant">Securing your session and opening your dashboard.</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-error/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-error" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
              </div>
              <h1 className="font-headline font-extrabold text-2xl text-error mb-4">Verification Failed</h1>
              <p className="text-on-surface-variant mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={() => token && verifyEmail(token)}
                  className="w-full bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary-dim transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Retry Verification
                </button>
                <button
                  onClick={() => router.push("/login")}
                  className="w-full border border-surface-container-high text-on-surface px-8 py-3 rounded-full font-bold hover:bg-surface-container-low transition-all"
                >
                  Go to Login
                </button>
                <button
                  onClick={() => router.push("/signup")}
                  className="w-full text-primary text-sm font-bold hover:underline py-2"
                >
                  Sign Up Again
                </button>
              </div>
            </>
          )}
        </Card>
      </main>

      <Footer />
    </div>
  );
}