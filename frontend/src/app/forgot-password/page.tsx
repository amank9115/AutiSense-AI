"use client";

import React, { useState } from "react";
import { Navbar, Footer } from "@/components/layout/Navigation";
import { Button, Card, Input } from "@/components/ui/StitchUI";
import { authApi } from "@/services/authApi";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");

    try {
      const response = await authApi.forgotPassword(email);
      setStatus("success");
      setMessage(response.message);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased flex flex-col">
      <Navbar />

      <main className="flex-grow flex items-center justify-center pt-24 pb-16 px-4">
        <Card className="max-w-md w-full p-8 rounded-3xl bg-white shadow-xl text-center">
          <h1 className="font-headline font-extrabold text-3xl text-primary mb-4">Reset Password</h1>
          
          {status === "success" ? (
            <div className="animate-in fade-in slide-in-from-top-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-success" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
              </div>
              <p className="text-on-surface-variant mb-6 font-medium">{message}</p>
              <Link href="/login">
                <Button variant="outline" className="w-full py-4 rounded-full font-bold">
                  Return to Login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <p className="text-on-surface-variant mb-8 text-sm">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-6 text-left">
                {status === "error" && (
                  <div className="bg-error/10 border border-error/20 text-error text-xs font-bold p-4 rounded-2xl">
                    {message}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="font-headline font-extrabold text-xs px-4 text-on-surface uppercase tracking-widest opacity-60" htmlFor="email">Email Address</label>
                  <Input
                    className="w-full px-6 py-4 rounded-full bg-surface-container-highest border-none focus:ring-4 focus:ring-primary/5 shadow-inner"
                    id="email"
                    placeholder="name@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-full font-bold uppercase tracking-widest shadow-lg"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-surface-container-high text-sm font-medium">
                Remember your password? <Link href="/login" className="text-primary font-bold hover:underline">Log In</Link>
              </div>
            </>
          )}
        </Card>
      </main>

      <Footer />
    </div>
  );
}