"use client";

import React, { useState, useEffect } from "react";
import { Navbar, Footer } from "@/components/layout/Navigation";
import { Button, Card, Input } from "@/components/ui/StitchUI";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/services/authApi";
import { useAppStore } from "@/store";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAppStore((state) => state.setAuth);

  useEffect(() => {
    // Check if redirected from signup with pending verification
    const verified = searchParams?.get('verified');
    if (verified === 'false') {
      const storedEmail = localStorage.getItem('pendingVerificationEmail');
      if (storedEmail) {
        setPendingEmail(storedEmail);
        setEmail(storedEmail);
      }
      setError("Account created! Please check your email to verify your account before logging in.");
    }
  }, [searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authApi.login(email, password);
      if (!response.user || !response.access_token) {
        setError("Login failed. Please try again.");
        return;
      }
      setAuth(response.user, response.access_token);

      // Redirect based on role returned from the server, ignoring the toggle state
      if (response.user.role === "doctor") {
        router.push("/dashboard/doctor");
      } else {
        router.push("/dashboard/parent");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setResending(true);
    try {
      const response = await authApi.resendVerification(email);
      setVerificationSent(true);
      setError(response.message || "Verification email sent!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend verification email.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased flex flex-col">
      <Navbar />

      <main className="flex-grow flex items-center justify-center pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-8">
        <div className="max-w-[1440px] w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Visual Illustration Section */}
          <div className="hidden lg:flex flex-col items-start justify-center p-8 lg:p-12 relative h-full animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="absolute inset-0 z-0 opacity-30">
              <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-fixed via-transparent to-transparent blur-[120px]"></div>
            </div>
            <div className="relative z-10 space-y-8 lg:space-y-12">
              <div className="w-full aspect-video rounded-2xl lg:rounded-3xl overflow-hidden bg-surface-container-low shadow-2xl border-8 border-white group relative">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9cwobMulniCkL_iTHzZguL9_9h5cddmPQszvDOmHmlCIOldcJGs9IlhVegeC2YZOKNz2AGgwMx5kkXFxMmsELZ4ezImoE6xvEPO0KpKc7VT8Lz2KCte9CIUf699qXhzmBdVRGUZuQ6_HnFV5J88zEIp8YJjCgWJMZgUC7lsXuGgzsPDFvmTUHYRMxHUi3I1OQb61VzJSLUiFN9F2ZjXYUAcw1QA_q2Jf1hRjN1W-rngDOFYwFKtn1eGUivChKvHGP6WOrC2ZCzfc"
                  alt="Tranquil Sanctuary"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-[2s]"
                  priority
                />
              </div>
              <div className="space-y-4 lg:space-y-6">
                <h2 className="font-headline font-extrabold text-3xl lg:text-5xl text-primary tracking-tighter leading-tight">Your child&apos;s progress starts with a calm first step.</h2>
                <p className="text-base lg:text-xl text-on-surface-variant leading-relaxed max-w-xl font-medium opacity-80">
                  We&apos;ve designed this space to be a low-aroused sanctuary. Navigate your journey with clarity, supported by tools built for sensory comfort and neurodivergent accessibility.
                </p>
              </div>
            </div>
          </div>

          {/* Login Form Section */}
          <div className="w-full flex justify-center lg:justify-start">
            <Card className="w-full max-w-lg p-8 sm:p-10 lg:p-16 rounded-2xl lg:rounded-[3rem] border-none shadow-2xl bg-white/80 backdrop-blur-xl relative overflow-hidden">
              <div className="text-center mb-8 lg:mb-12">
                <h1 className="font-headline font-extrabold text-3xl lg:text-4xl text-primary mb-3 tracking-tight">Welcome Back</h1>
                <p className="text-sm lg:text-on-surface-variant font-medium opacity-60">Please sign in to access your navigator dashboard.</p>
              </div>

              {/* Form */}
              <form className="space-y-6 lg:space-y-8" onSubmit={handleSignIn}>
                {error && (
                  <div className="bg-error/10 border border-error/20 text-error text-xs font-bold p-4 rounded-2xl animate-in fade-in slide-in-from-top-2">
                    {error}
                  </div>
                )}

                {pendingEmail && (
                  <div className="text-center space-y-3 p-4 bg-success/10 border border-success/20 rounded-2xl">
                    <p className="text-success text-sm font-bold">Verification email sent!</p>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resending || verificationSent}
                      className="text-primary text-xs font-bold hover:underline disabled:opacity-50"
                    >
                      {verificationSent ? "Email sent!" : resending ? "Sending..." : "Didn't receive it? Resend"}
                    </button>
                  </div>
                )}

                <div className="space-y-2 sm:space-y-3">
                  <label className="font-headline font-extrabold text-xs px-4 sm:px-6 text-on-surface uppercase tracking-widest opacity-60" htmlFor="email">Email Address</label>
                  <Input
                    className="w-full px-6 sm:px-8 py-4 sm:py-5 rounded-full bg-surface-container-highest border-none focus:ring-4 focus:ring-primary/5 shadow-inner"
                    id="email"
                    placeholder="name@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <label className="font-headline font-extrabold text-xs px-4 sm:px-6 text-on-surface uppercase tracking-widest opacity-60" htmlFor="password">Password</label>
                  <div className="relative">
                    <Input
                      className="w-full px-6 sm:px-8 py-4 sm:py-5 rounded-full bg-surface-container-highest border-none focus:ring-4 focus:ring-primary/5 shadow-inner"
                      id="password"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span>
                    </button>
                  </div>
                  <div className="flex justify-end mt-1">
                    <Link href="/forgot-password" className="text-xs font-bold text-primary hover:underline">
                      Forgot Password?
                    </Link>
                  </div>
                </div>
                
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 sm:py-6 rounded-full text-base lg:text-lg font-extrabold shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all mt-4 sm:mt-6 uppercase tracking-[0.2em]"
                >
                  {loading ? "Authenticating..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-10 sm:mt-16 pt-8 sm:pt-10 text-center border-t border-surface-container-high/50">
                <p className="text-sm text-on-surface-variant font-medium">
                  Don&apos;t have an account?
                  <Link href="/signup" className="font-extrabold text-secondary hover:underline ml-2 uppercase tracking-widest text-[10px]">
                    Get Started
                  </Link>
                </p>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
