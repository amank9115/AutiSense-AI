"use client";

import React, { useState, useEffect } from "react";
import { Navbar, Footer } from "@/components/layout/Navigation";
import { Button, Card, Input } from "@/components/ui/StitchUI";
import { authApi } from "@/services/authApi";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const queryToken = searchParams.get("token");
    if (!queryToken) {
      setStatus("error");
      setMessage("No reset token provided. Please request a new link.");
    } else {
      setToken(queryToken);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) return;

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setStatus("error");
      setMessage("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setStatus("idle");

    try {
      const response = await authApi.resetPassword({ token, newPassword: password });
      setStatus("success");
      setMessage(response.message);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased flex flex-col">
      <Navbar />

      <main className="flex-grow flex items-center justify-center pt-24 pb-16 px-4">
        <Card className="max-w-md w-full p-8 rounded-3xl bg-white shadow-xl text-center">
          <h1 className="font-headline font-extrabold text-3xl text-primary mb-4">Set New Password</h1>
          
          {status === "success" ? (
            <div className="animate-in fade-in slide-in-from-top-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-success" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <p className="text-on-surface-variant mb-6 font-medium">{message}</p>
              <Link href="/login">
                <Button variant="primary" className="w-full py-4 rounded-full font-bold">
                  Go to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 text-left mt-6">
              {status === "error" && (
                <div className="bg-error/10 border border-error/20 text-error text-xs font-bold p-4 rounded-2xl">
                  {message}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="font-headline font-extrabold text-xs px-4 text-on-surface uppercase tracking-widest opacity-60" htmlFor="password">New Password</label>
                <div className="relative">
                  <Input
                    className="w-full px-6 py-4 rounded-full bg-surface-container-highest border-none focus:ring-4 focus:ring-primary/5 shadow-inner"
                    id="password"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={!token}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-headline font-extrabold text-xs px-4 text-on-surface uppercase tracking-widest opacity-60" htmlFor="confirmPassword">Confirm Password</label>
                <div className="relative">
                  <Input
                    className="w-full px-6 py-4 rounded-full bg-surface-container-highest border-none focus:ring-4 focus:ring-primary/5 shadow-inner"
                    id="confirmPassword"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={!token}
                  />
                </div>
              </div>

              <Button 
                variant="primary" 
                type="submit"
                disabled={loading || !token}
                className="w-full py-4 rounded-full font-bold uppercase tracking-widest shadow-lg"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}
        </Card>
      </main>

      <Footer />
    </div>
  );
}